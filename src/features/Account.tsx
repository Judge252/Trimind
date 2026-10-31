import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "../app/context";
import { Button, Field, Go, Page, Status } from "../components/ui";
import {
  authService,
  intendedDestination,
  validateAccount,
  type AccountFields,
  type AccountMode,
  type AuthRequest,
} from "../services/auth";
export default function Account({ mode }: { mode: AccountMode }) {
  const { t } = useApp(),
    [params] = useSearchParams();
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
    invalidLink = mode === "reset" && (!token || expired);
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
      await authService.submit(request);
    } catch {
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
      eyebrow={t(
        "ACCOUNT / PHASE 2 PREVIEW",
        "الحساب / معاينة المرحلة الثانية",
      )}
      description={t(
        "Guest learning works now. Real authentication and email delivery require Phase 2.",
        "التعلم كضيف يعمل الآن. تسجيل الدخول الحقيقي وتسليم البريد يحتاجان المرحلة الثانية.",
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
          <Status>
            {t(
              "Phase 1 preview. This form does not authenticate, create accounts or send email.",
              "معاينة المرحلة الأولى. هذا النموذج لا يسجل الدخول أو ينشئ حسابات أو يرسل بريداً.",
            )}
          </Status>
          {invalidLink ? (
            <>
              <Status error>
                {expired
                  ? t(
                      "This reset link is expired. A new server-issued link will be needed in Phase 2.",
                      "انتهت صلاحية رابط إعادة التعيين. ستحتاج رابطاً جديداً من الخادم في المرحلة الثانية.",
                    )
                  : t(
                      "A valid reset link is missing. This screen is ready for a future server-issued token, but no token can be validated in Phase 1.",
                      "لا يوجد رابط إعادة تعيين صالح. الشاشة جاهزة لرمز يصدره الخادم لاحقاً، ولا يمكن التحقق من رموز في المرحلة الأولى.",
                    )}
              </Status>
              <Go secondary to={`/forgot-password${suffix}`}>
                {t("Request a new link", "طلب رابط جديد")}
              </Go>
            </>
          ) : (
            <>
              {mode === "reset" && (
                <Status>
                  {t(
                    "A link parameter is present. Only a future server can validate it; this demo cannot change a password.",
                    "يوجد معامل رابط. الخادم المستقبلي وحده يستطيع التحقق منه؛ لا يمكن لهذا العرض تغيير كلمة المرور.",
                  )}
                </Status>
              )}
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
                        "8–128 characters. Use a placeholder password for this demo.",
                        "من 8 إلى 128 حرفاً. استخدم كلمة مرور تجريبية لهذا العرض.",
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
                  ? t("Log in — preview", "تسجيل الدخول — معاينة")
                  : mode === "signup"
                    ? t("Create account — preview", "إنشاء حساب — معاينة")
                    : mode === "recovery"
                      ? t("Request recovery — preview", "طلب استعادة — معاينة")
                      : t("Reset password — preview", "إعادة تعيين — معاينة")}
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
                {mode === "recovery"
                  ? t(
                      "Recovery email was not sent. Email delivery requires Phase 2. Continue as guest or return to login.",
                      "لم يُرسل بريد استعادة. يتطلب تسليم البريد المرحلة الثانية. تابع كضيف أو عُد لتسجيل الدخول.",
                    )
                  : mode === "signup"
                    ? t(
                        "No account was created. Real account creation requires Phase 2. Your passwords were not saved.",
                        "لم يُنشأ حساب. إنشاء الحساب الحقيقي يحتاج المرحلة الثانية. لم تُحفظ كلمات المرور.",
                      )
                    : mode === "reset"
                      ? t(
                          "No password was changed. Token validation and password updates require the Phase 2 server.",
                          "لم تتغير كلمة المرور. التحقق من الرمز وتحديث كلمة المرور يحتاجان خادم المرحلة الثانية.",
                        )
                      : t(
                          "You have not been logged in. Real authentication requires Phase 2. Your password was not saved.",
                          "لم يتم تسجيل دخولك. يحتاج التحقق الحقيقي المرحلة الثانية. لم تُحفظ كلمة المرور.",
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
                {t("Create account preview", "معاينة إنشاء حساب")}
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
              "Continue to your intended destination as a guest. Existing learning progress remains on this browser. Account fields are never included in assessment or plan storage.",
              "تابع إلى وجهتك كضيف. يبقى تقدمك على هذا المتصفح. لا تدخل حقول الحساب في تخزين التقييم أو الخطة.",
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
