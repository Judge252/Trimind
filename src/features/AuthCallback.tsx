import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, currentUser } from "../services/session";
import { intendedDestination } from "../services/auth";
import { useApp } from "../app/context";
import { Go, Page, Status } from "../components/ui";
let exchange: Promise<unknown> | undefined;
export default function AuthCallback() {
  const { t } = useApp(),
    navigate = useNavigate(),
    [params] = useSearchParams(),
    [error, setError] = useState(false);
  const next = intendedDestination(params.get("next")),
    recovery = params.get("mode") === "recovery";
  useEffect(() => {
    if (params.get("error") || !supabase) {
      setError(true);
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (currentUser())
        navigate(recovery ? "/reset-password" : next, { replace: true });
      else setError(true);
      return;
    }
    // Consume the URL code once; never log or retain it in app storage.
    history.replaceState(
      null,
      "",
      location.pathname +
        "?next=" +
        encodeURIComponent(next) +
        (recovery ? "&mode=recovery" : ""),
    );
    if (!exchange)
      exchange = supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error || !data.session) throw Error();
          if (recovery)
            sessionStorage.setItem(
              "trimind:recovery",
              JSON.stringify({
                user: data.session.user.id,
                expires: Date.now() + 600000,
              }),
            );
        });
    exchange
      .then(() =>
        navigate(recovery ? "/reset-password" : next, { replace: true }),
      )
      .catch(() => setError(true))
      .finally(() => {
        exchange = undefined;
      });
  }, []);
  return (
    <Page title={t("Completing sign-in", "جارٍ إكمال تسجيل الدخول")}>
      <Status error={error}>
        {error
          ? t(
              "Sign-in was cancelled or the link expired. Your local assessment is safe. Try signing in again.",
              "أُلغي تسجيل الدخول أو انتهت صلاحية الرابط. تقييمك المحلي محفوظ. حاول تسجيل الدخول مجدداً.",
            )
          : t(
              "Checking your secure sign-in link…",
              "جارٍ التحقق من رابط تسجيل الدخول الآمن…",
            )}
      </Status>
      {error && (
        <Go to={`/login?next=${encodeURIComponent(next)}`}>
          {t("Return to login", "العودة لتسجيل الدخول")}
        </Go>
      )}
    </Page>
  );
}
