import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Provider, useApp } from "./context";
import { repository } from "../services/repository";
import { Skeleton, Status, Button } from "../components/ui";
import AppRoutes from "./routes";
function Wordmark() {
  return (
    <span className="wordmark" dir="ltr">
      <svg width="31" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M2 26 16 2l14 24H2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M9 26 16 14l7 12M16 2v12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      TRIMIND
      <span className="wordmark-dot" />
    </span>
  );
}
function Shell() {
  const { data, t, act, ready, error, retry, notice } = useApp();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      const el = document.querySelector("main");
      el?.setAttribute("tabindex", "-1");
      el?.focus({ preventScroll: true });
    });
  }, [location.pathname]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById("main");
          main?.setAttribute("tabindex", "-1");
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        {t("Skip to content", "تخطَّ إلى المحتوى")}
      </a>
      <header className="header">
        <div className="header-inner">
          <Link to="/" aria-label={t("TRIMIND home", "تريمايند الرئيسية")}>
            <Wordmark />
          </Link>
          <nav
            className={`main-nav ${menu ? "is-open" : ""}`}
            id="main-nav"
            aria-label={t("Main navigation", "التنقل الرئيسي")}
          >
            {[
              ["/", t("Home", "الرئيسية")],
              ["/learn", t("Learn", "تعلّم")],
              ["/practice", t("Practice", "تدرّب")],
              ["/projects", t("Projects", "المشاريع")],
            ].map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="language-button"
              onClick={() =>
                void act(
                  repository.savePreferences({
                    ...data.preferences,
                    language: data.preferences.language === "en" ? "ar" : "en",
                  }),
                )
              }
              aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
            >
              {data.preferences.language === "en" ? "العربية" : "EN"}
            </button>
            <NavLink className="my-learning" to="/dashboard">
              {t("My learning", "تعلّمي")}
              <ArrowUpRight size={16} />
            </NavLink>
            <button
              className="menu-button icon-button"
              aria-label={
                menu
                  ? t("Close menu", "إغلاق القائمة")
                  : t("Open menu", "فتح القائمة")
              }
              aria-expanded={menu}
              aria-controls="main-nav"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <div className="guest-bar">
        <span className="guest-dot" />
        {t("Guest demo", "عرض ضيف")}
        <span>·</span>
        {t("Saved on this browser only", "محفوظ على هذا المتصفح فقط")}
      </div>
      {error ? (
        <main id="main" className="container page">
          <Status error>
            {t(
              "Unable to load the demo. Please retry.",
              "تعذر تحميل العرض. حاول مجدداً.",
            )}
          </Status>
          <Button onClick={retry}>{t("Retry", "إعادة المحاولة")}</Button>
        </main>
      ) : !ready ? (
        <Skeleton />
      ) : (
        <>
          {repository.status !== "persistent" && (
            <div className="container">
              <Status error={repository.status === "unavailable"}>
                {repository.status === "unavailable"
                  ? t(
                      "Browser storage is unavailable. You can continue, but changes will be lost when this page closes.",
                      "تخزين المتصفح غير متاح. يمكنك المتابعة لكن التغييرات ستفقد عند إغلاق الصفحة.",
                    )
                  : t(
                      "Unreadable saved data was found. A fresh demo has been loaded. Saving will replace only TRIMIND data.",
                      "عُثر على بيانات غير قابلة للقراءة. تم تحميل عرض جديد. الحفظ سيستبدل بيانات تريمايند فقط.",
                    )}
              </Status>
            </div>
          )}
          <AppRoutes />
        </>
      )}
      <footer className="footer container">
        <div>
          <Link to="/">
            <Wordmark />
          </Link>
          <p>
            {t(
              "Learn a little. Make something matter.",
              "تعلّم قليلاً. واصنع شيئاً له معنى.",
            )}
          </p>
        </div>
        <div className="footer-links">
          <Link to="/profile">{t("Profile & progress", "الملف والتقدم")}</Link>
          <Link to="/login">{t("Account preview", "معاينة الحساب")}</Link>
          <span>
            {t("Phase 1 · Local guest demo", "المرحلة الأولى · عرض ضيف محلي")}
          </span>
        </div>
      </footer>
      <div
        className={`toast ${notice ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice}
      </div>
    </>
  );
}
export default function App() {
  return (
    <Provider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </Provider>
  );
}
