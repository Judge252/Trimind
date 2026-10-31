import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "../app/context";
import { Button, Field, Go, Page, Status } from "../components/ui";
import {
  authService,
  continueWithGoogle,
  recoveryAllowed,
  intendedDestination,
  validateAccount,
  type AccountFields,
  type AccountMode,
  type AuthRequest,
} from "../services/auth";
export default function Account({ mode }: { mode: AccountMode }) {
  const { t } = useApp(),
    [params] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(""),
    [serviceCode, setServiceCode] = useState("");
  const destination = intendedDestination(params.get("next"));
  const suffix = `?next=${encodeURIComponent(destination)}`;
  const [fields, setFields] = useState<AccountFields>({
      name: "",
      email: "",
      password: "",
      confirmation: "",
    }),
    [errors, setErrors] = useState<ReturnType<typeof validateAccount>>({}),
    [pending, setPending] = useState(false),
    [status, setStatus] = useState<"idle" | "invalid" | "unavailable">("idle"),
    [visible, setVisible] = useState(false),
    [confirmVisible, setConfirmVisible] = useState(false);
  const mounted = useRef(true),
    busy = useRef(false),
    errorHeading = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (status !== "idle") errorHeading.current?.focus();
  }, [status, pending]);
  const set = (key: keyof AccountFields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setStatus("idle");
  };
  const message = (code: string | undefined) =>
    code === "email"
      ? t("Enter a valid email address.", "أدخل عنوان بريد إلكتروني صالحاً.")
      : code === "password"
        ? t("Use 8–128 characters.", "استخدم من 8 إلى 128 حرفاً.")
        : code === "confirmation"
          ? t("Passwords must match.", "يجب أن تتطابق كلمتا المرور.")
          : code === "name"
            ? t(
                "Enter a display name of 1–40 characters.",
                "أدخل اسم عرض من حرف إلى 40 حرفاً.",
              )
            : undefined;
  const token = params.get("token") || "";
  const expired = params.get("status") === "expired",
    invalidLink = mode === "reset" && (!recoveryAllowed() || expired);
  const title =
    mode === "signup"
      ? t("Make room for what’s next.", "امنح القادم مساحة.")
      : mode === "recovery"
        ? t("Find your way back.", "اعثر على طريق العودة.")
        : mode === "reset"
          ? t("Choose a new password.", "اختر كلمة مرور جديدة.")
          : t("Welcome to TRIMIND.", "أهلاً بك في تريمايند.");
  const submit = async () => {
    if (busy.current) return;
    const nextErrors = validateAccount(mode, fields);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setStatus("invalid");
      return;
    }
    if (invalidLink) return;
    busy.current = true;
    setPending(true);
    setStatus("idle");
    const request: AuthRequest =
      mode === "login"
        ? {
            kind: "login",
            email: fields.email,
            password: fields.password,
            returnTo: destination,
          }
        : mode === "signup"
          ? {
              kind: "signup",
              name: fields.name.trim(),
              email: fields.email,
              password: fields.password,
              returnTo: destination,
            }
          : mode === "recovery"
            ? { kind: "recovery", email: fields.email, returnTo: destination }
            : {
                kind: "reset",
                password: fields.password,
                token,
                returnTo: destination,
              };
    try {
      const response = await authService.submit(request);
      if (response.status === "signed-in") {
        navigate(destination, { replace: true });
        return;
      }
      setSuccess(
        response.status === "verify-email"
          ? t(
              "Check your email to verify your account, then sign in.",
              "تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.",
            )
          : response.status === "recovery-requested"
            ? t(
                "Recovery requested. If an eligible account exists, check your email for a secure link.",
                "طُلبت الاستعادة. إذا كان الحساب مؤهلاً فتحقق من بريدك لرابط آمن.",
              )
            : t("Your password was updated.", "تم تحديث كلمة المرور."),
      );
      setFields((f) => ({ ...f, password: "", confirmation: "" }));
    } catch (error) {
      setServiceCode(error instanceof Error ? error.message : "unavailable");
      if (mounted.current) {
        setStatus("unavailable");
        setFields((f) => ({ ...f, password: "", confirmation: "" }));
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return (
    <Page
      title={title}
      eyebrow={t("YOUR ACCOUNT", "حسابك")}
      description={t(
        "Sign in to keep learning progress across your devices. You can also browse as a guest.",
        "سجّل الدخول لحفظ تقدمك عبر أجهزتك. يمكنك التصفح كضيف أيضاً.",
      )}
    >
      <div className="account-layout">
        <form
          className="panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          aria-busy={pending}
        >
          <h2>
            {mode === "signup"
              ? t("Create an account", "إنشاء حساب")
              : mode === "login"
                ? t("Log in", "تسجيل الدخول")
                : mode === "recovery"
                  ? t("Recover your account", "استعادة حسابك")
                  : t("Reset password", "إعادة تعيين كلمة المرور")}
          </h2>
          {success && <Status>{success}</Status>}
          {(mode === "login" || mode === "signup") && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  await continueWithGoogle(destination);
                } catch {
                  setPending(false);
                  setStatus("unavailable");
                  setServiceCode("google-unavailable");
                }
              }}
            >
              {t("Continue with Google", "المتابعة باستخدام Google")}
            </Button>
          )}
          {invalidLink ? (
            <>
              <Status error>
                {expired
                  ? t(
                      "This reset link has expired. Request a new link.",
                      "انتهت صلاحية رابط إعادة التعيين. اطلب رابطاً جديداً.",
                    )
                  : t(
                      "Open the secure password recovery link from your email in the browser where you requested it.",
                      "افتح رابط استعادة كلمة المرور الآمن من بريدك في المتصفح الذي طلبته منه.",
                    )}
              </Status>
              <Go secondary to={`/forgot-password${suffix}`}>
                {t("Request a new link", "طلب رابط جديد")}
              </Go>
            </>
          ) : (
            <>
              <fieldset className="account-fields" disabled={pending}>
                {mode === "signup" && (
                  <Field
                    label={t("Display name", "اسم العرض")}
                    error={message(errors.name)}
                  >
                    <input
                      required
                      autoComplete="nickname"
                      maxLength={40}
                      value={fields.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                )}
                {mode !== "reset" && (
                  <Field
                    label={t("Email", "البريد الإلكتروني")}
                    error={message(errors.email)}
                  >
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={fields.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </Field>
                )}
                {mode !== "recovery" && (
                  <>
                    <Field
                      label={
                        mode === "reset"
                          ? t("New password", "كلمة المرور الجديدة")
                          : t("Password", "كلمة المرور")
                      }
                      error={message(errors.password)}
                      hint={t(
                        "Use 8–128 characters.",
                        "استخدم من 8 إلى 128 حرفاً.",
                      )}
                    >
                      <span className="password-wrap">
                        <input
                          required
                          type={visible ? "text" : "password"}
                          maxLength={128}
                          autoComplete={
                            mode === "login"
                              ? "current-password"
                              : "new-password"
                          }
                          value={fields.password}
                          onChange={(e) => set("password", e.target.value)}
                        />
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={
                            visible
                              ? t("Hide password", "إخفاء كلمة المرور")
                              : t("Show password", "إظهار كلمة المرور")
                          }
                          onClick={() => setVisible(!visible)}
                        >
                          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </span>
                    </Field>
                    {mode !== "login" && (
                      <Field
                        label={t("Confirm password", "تأكيد كلمة المرور")}
                        error={message(errors.confirmation)}
                      >
                        <span className="password-wrap">
                          <input
                            required
                            type={confirmVisible ? "text" : "password"}
                            autoComplete="new-password"
                            maxLength={128}
                            value={fields.confirmation}
                            onChange={(e) =>
                              set("confirmation", e.target.value)
                            }
                          />
                          <button
                            className="icon-button"
                            type="button"
                            aria-label={
                              confirmVisible
                                ? t(
                                    "Hide password confirmation",
                                    "إخفاء تأكيد كلمة المرور",
                                  )
                                : t(
                                    "Show password confirmation",
                                    "إظهار تأكيد كلمة المرور",
                                  )
                            }
                            onClick={() => setConfirmVisible(!confirmVisible)}
                          >
                            {confirmVisible ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </span>
                      </Field>
                    )}
                  </>
                )}
              </fieldset>
              <Button loading={pending} type="submit" variant="secondary">
                {mode === "login"
                  ? t("Log in", "تسجيل الدخول")
                  : mode === "signup"
                    ? t("Create account", "إنشاء حساب")
                    : mode === "recovery"
                      ? t("Send recovery link", "إرسال رابط الاستعادة")
                      : t("Update password", "تحديث كلمة المرور")}
              </Button>
            </>
          )}
          <div ref={errorHeading} tabIndex={-1}>
            {status === "invalid" && (
              <Status error>
                {t(
                  "Check the highlighted fields. Nothing was submitted.",
                  "تحقق من الحقول الموضحة. لم يتم إرسال شيء.",
                )}
              </Status>
            )}
            {status === "unavailable" && (
              <Status error>
                {serviceCode === "service-unconfigured"
                  ? t(
                      "Account service is not configured. You can continue browsing as a guest.",
                      "خدمة الحساب غير مهيأة. يمكنك مواصلة التصفح كضيف.",
                    )
                  : t(
                      "We could not complete this request. Check your details or connection and try again.",
                      "تعذر إكمال الطلب. تحقق من بياناتك أو الاتصال وحاول مجدداً.",
                    )}
              </Status>
            )}
          </div>
          <div className="account-links">
            {mode === "login" && (
              <Link to={`/forgot-password${suffix}`}>
                {t("Forgot password?", "نسيت كلمة المرور؟")}
              </Link>
            )}
            {mode !== "signup" && (
              <Link to={`/signup${suffix}`}>
                {t("Create account", "إنشاء حساب")}
              </Link>
            )}
            {mode !== "login" && (
              <Link to={`/login${suffix}`}>
                {t("Return to login", "العودة لتسجيل الدخول")}
              </Link>
            )}
          </div>
        </form>
        <div>
          <span className="brand-flower">✳</span>
          <h2>
            {t("Curiosity needs no password.", "الفضول لا يحتاج كلمة مرور.")}
          </h2>
          <p>
            {t(
              "As a guest, progress stays on this browser. Sign in to save across devices. Account information is kept separate from learning assessments.",
              "كضيف يبقى تقدمك على هذا المتصفح. سجّل الدخول للحفظ عبر الأجهزة. تبقى معلومات الحساب منفصلة عن التقييمات.",
            )}
          </p>
          <Go to={destination}>{t("Continue as guest", "المتابعة كضيف")}</Go>
          <p className="meta">
            {t("Next: ", "التالي: ")}
            {destination.startsWith("/my-plan")
              ? t("My plan", "خطتي")
              : destination.startsWith("/dashboard")
                ? t("My learning", "تعلّمي")
                : destination.startsWith("/assessment")
                  ? t("Learner assessment", "تقييم المتعلم")
                  : t("Your selected activity", "نشاطك المختار")}
          </p>
        </div>
      </div>
    </Page>
  );
}
