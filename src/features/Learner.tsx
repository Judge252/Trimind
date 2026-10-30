import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useApp } from "../app/context";
import { courses } from "../content/courses";
import { tracks } from "../content/scenarios";
import { recommend, courseProgress } from "../logic/learning";
import { repository } from "../services/repository";
import {
  Button,
  Empty,
  Field,
  Go,
  Metric,
  Modal,
  Page,
  Progress,
  Status,
  TrackPill,
  TrackSelect,
} from "../components/ui";
import type { Goal, Experience } from "../models";
export function Onboarding() {
  const { data, t, text, act } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0),
    [p, setP] = useState(data.preferences);
  const rec = recommend(courses, p);
  const finish = async () => {
    await act(repository.savePreferences({ ...p, onboarded: true }));
    navigate("/dashboard");
  };
  const goals = [
    ["explore", t("Explore something new", "استكشف شيئاً جديداً")],
    ["create", t("Create a practical project", "أنشئ مشروعاً عملياً")],
    ["money", t("Understand money decisions", "افهم القرارات المالية")],
  ];
  return (
    <Page
      title={t("A starting point that feels like you.", "نقطة بداية تناسبك.")}
      description={t(
        "Three short steps. You can change these anytime in your profile.",
        "ثلاث خطوات قصيرة. يمكنك تغييرها لاحقاً في ملفك.",
      )}
    >
      <div className="onboarding">
        <Progress
          value={step + 1}
          max={3}
          label={t("Getting started", "البداية")}
        />
        {step === 0 ? (
          <fieldset className="choices">
            <legend className="question-title">
              {t("What brings you here?", "ما الذي جاء بك إلى هنا؟")}
            </legend>
            {goals.map(([id, label]) => (
              <label
                className={`choice ${p.goal === id ? "selected" : ""}`}
                key={id}
              >
                <input
                  type="radio"
                  name="goal"
                  checked={p.goal === id}
                  onChange={() =>
                    setP({
                      ...p,
                      goal: id as Goal,
                      track:
                        id === "money"
                          ? "investor"
                          : id === "create"
                            ? "founder"
                            : p.track,
                    })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
        ) : step === 1 ? (
          <fieldset className="choices">
            <legend className="question-title">
              {t("How familiar does this feel?", "ما مدى خبرتك؟")}
            </legend>
            {[
              ["new", t("I’m starting fresh", "أبدأ من الصفر")],
              ["some", t("I know a little", "لدي معرفة بسيطة")],
              [
                "practiced",
                t("I’ve tried a project before", "جرّبت مشروعاً من قبل"),
              ],
            ].map(([id, label]) => (
              <label
                className={`choice ${p.experience === id ? "selected" : ""}`}
                key={id}
              >
                <input
                  type="radio"
                  name="experience"
                  checked={p.experience === id}
                  onChange={() => setP({ ...p, experience: id as Experience })}
                />
                {label}
              </label>
            ))}
          </fieldset>
        ) : (
          <>
            <TrackSelect
              value={p.track}
              onChange={(track) => setP({ ...p, track })}
            />
            <div className="panel">
              <span className="eyebrow">
                {t("YOUR SUGGESTED FIRST COURSE", "دورتك الأولى المقترحة")}
              </span>
              <h3>{text(rec.title)}</h3>
              <p>
                {t(
                  "We recommend the beginner course matching your chosen path. Your experience helps you choose your pace; it does not lock content.",
                  "نقترح دورة المبتدئين المطابقة لمسارك المختار. خبرتك تساعدك على اختيار الإيقاع ولا تقفل أي محتوى.",
                )}
              </p>
            </div>
          </>
        )}
        <div className="actions">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              {t("Back", "رجوع")}
            </Button>
          )}
          <Button
            onClick={() => (step < 2 ? setStep(step + 1) : void finish())}
          >
            {t(
              step < 2 ? "Continue" : "Go to My learning",
              step < 2 ? "تابع" : "انتقل إلى تعلّمي",
            )}
          </Button>
          <Button variant="text" onClick={() => void finish()}>
            {t("Skip for now", "تخطَّ الآن")}
          </Button>
        </div>
        <p className="meta">
          {t(
            "Guest demo · Progress is stored on this browser only.",
            "عرض ضيف · التقدم محفوظ على هذا المتصفح فقط.",
          )}
        </p>
      </div>
    </Page>
  );
}
export function Dashboard() {
  const { data, t, text } = useApp();
  const c = recommend(courses, data.preferences),
    next = c.lessons.find(
      (l) =>
        !data.lessons.some((p) => p.courseId === c.id && p.lessonId === l.id),
    );
  const total = courses.reduce((n, c) => n + c.lessons.length, 0);
  const recent = [
    ...data.lessons.map((p) => ({
      time: p.completedAt,
      label: text(
        courses
          .find((c) => c.id === p.courseId)!
          .lessons.find((l) => l.id === p.lessonId)!.title,
      ),
    })),
    ...data.attempts.map((a) => ({
      time: a.completedAt,
      label: `${t("Quiz", "اختبار")}: ${a.score}/${a.total}`,
    })),
    ...data.results.map((r) => ({
      time: r.completedAt,
      label: `${text(tracks[r.track].name)} — ${t("simulation completed", "محاكاة مكتملة")}`,
    })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);
  return (
    <Page
      eyebrow={t("MY LEARNING", "تعلّمي")}
      title={
        data.preferences.name
          ? `${t("Welcome back,", "أهلاً بعودتك،")} ${data.preferences.name}.`
          : t("Your next chapter starts here.", "فصلك التالي يبدأ هنا.")
      }
      description={t(
        "Your work, saved on this browser. Every small step counts.",
        "عملك محفوظ على هذا المتصفح. كل خطوة صغيرة تُحدث فرقاً.",
      )}
      actions={
        <Go secondary to="/profile">
          {t("Edit profile", "تعديل الملف")}
        </Go>
      }
    >
      <div className="metrics">
        <Metric
          label={t("Lessons complete", "دروس مكتملة")}
          value={`${data.lessons.length}/${total}`}
        />
        <Metric
          label={t("Quiz attempts", "محاولات الاختبار")}
          value={data.attempts.length}
        />
        <Metric
          label={t("Simulations finished", "محاكاة مكتملة")}
          value={data.results.length}
        />
        <Metric
          label={t("Project drafts", "مسودات مشاريع")}
          value={data.projects.length}
        />
      </div>
      <div className="dashboard-grid">
        <div className="panel continue-panel">
          <TrackPill track={c.track} />
          <h2>{text(c.title)}</h2>
          <p>
            {t("Your goal: ", "هدفك: ")}
            {data.preferences.goal === "money"
              ? t("Understand money decisions", "فهم القرارات المالية")
              : data.preferences.goal === "create"
                ? t("Create a practical project", "إنشاء مشروع عملي")
                : t("Explore something new", "استكشاف شيء جديد")}
          </p>
          <Progress
            value={courseProgress(c, data.lessons)}
            max={c.lessons.length}
            label={t("Course progress", "تقدم الدورة")}
          />
          <Go to={`/learn/${c.id}/${next?.id || "quiz"}`}>
            {t(
              next ? "Continue learning" : "Take the quiz",
              next ? "تابع التعلم" : "ابدأ الاختبار",
            )}
          </Go>
        </div>
        <div className="panel">
          <p className="eyebrow">{t("YOUR NEXT CHALLENGE", "تحديك التالي")}</p>
          <h2>{text(tracks[c.track].tag)}</h2>
          <p>
            {t(
              "Try a decision and see its consequences in the practice lab. Scenarios are fictional.",
              "جرّب قراراً وشاهد نتائجه في مختبر التدريب. السيناريوهات خيالية.",
            )}
          </p>
          <Go secondary to={`/practice/${c.track}`}>
            {t("Open simulator", "افتح المحاكي")}
          </Go>
        </div>
        <div>
          <h2>{t("Recent activity", "النشاط الأخير")}</h2>
          {recent.length ? (
            <ul className="data-list">
              {recent.map((r, i) => (
                <li key={i}>
                  <span>{r.label}</span>
                  <time>
                    {new Date(r.time).toLocaleDateString(
                      data.preferences.language === "ar" ? "ar-EG" : "en-GB",
                    )}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {t(
                "A fresh start. Complete a lesson to begin your activity story.",
                "بداية جديدة. أكمل درساً لبدء سجل نشاطك.",
              )}
            </p>
          )}
        </div>
        <div>
          <h2>{t("Make room for an idea.", "امنح فكرتك مساحة.")}</h2>
          <p>
            {t(
              "Collect the problem, solution and features in a project draft.",
              "اجمع المشكلة والحل والميزات في مسودة مشروع.",
            )}
          </p>
          <Go secondary to="/projects">
            {t("Your projects", "مشاريعك")}
          </Go>
        </div>
      </div>
    </Page>
  );
}
export function Profile() {
  const { data, t, text, act, toast } = useApp();
  const [p, setP] = useState(data.preferences),
    [reset, setReset] = useState(false);
  const navigate = useNavigate();
  return (
    <Page
      title={t("Your learning, your way.", "تعلّمك بطريقتك.")}
      eyebrow={t("PROFILE & PROGRESS", "الملف والتقدم")}
      description={t(
        "This is a guest profile. Information stays on this browser, not online.",
        "هذا ملف ضيف. المعلومات على هذا المتصفح وليست محفوظة على الإنترنت.",
      )}
    >
      <div className="content-sidebar">
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            await act(repository.savePreferences(p));
            toast(t("Preferences saved.", "حُفظت التفضيلات."));
          }}
        >
          <Field
            label={t("Demo display name", "اسم العرض التجريبي")}
            hint={t(
              "Optional. No personal details needed.",
              "اختياري. لا حاجة لبيانات شخصية.",
            )}
          >
            <input
              maxLength={40}
              value={p.name}
              onChange={(e) => setP({ ...p, name: e.target.value })}
            />
          </Field>
          <Field label={t("Your goal", "هدفك")}>
            <select
              value={p.goal}
              onChange={(e) =>
                setP({ ...p, goal: e.target.value as typeof p.goal })
              }
            >
              <option value="explore">
                {t("Explore something new", "استكشف شيئاً جديداً")}
              </option>
              <option value="create">
                {t("Create a project", "أنشئ مشروعاً")}
              </option>
              <option value="money">
                {t("Understand money", "افهم المال")}
              </option>
            </select>
          </Field>
          <Field label={t("Experience", "الخبرة")}>
            <select
              value={p.experience}
              onChange={(e) =>
                setP({
                  ...p,
                  experience: e.target.value as typeof p.experience,
                })
              }
            >
              <option value="new">
                {t("Starting fresh", "أبدأ من الصفر")}
              </option>
              <option value="some">
                {t("A little experience", "خبرة بسيطة")}
              </option>
              <option value="practiced">
                {t("Tried a project", "جرّبت مشروعاً")}
              </option>
            </select>
          </Field>
          <TrackSelect
            value={p.track}
            onChange={(track) => setP({ ...p, track })}
          />
          <Field label={t("Language", "اللغة")}>
            <select
              value={p.language}
              onChange={(e) =>
                setP({ ...p, language: e.target.value as typeof p.language })
              }
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </Field>
          <Button type="submit">
            {t("Save preferences", "حفظ التفضيلات")}
          </Button>
        </form>
        <aside>
          <h2>{t("Completed lessons", "الدروس المكتملة")}</h2>
          {data.lessons.length ? (
            data.lessons.map((l) => (
              <p key={l.courseId + l.lessonId}>
                <Link to={`/learn/${l.courseId}/${l.lessonId}`}>
                  {text(
                    courses
                      .find((c) => c.id === l.courseId)!
                      .lessons.find((v) => v.id === l.lessonId)!.title,
                  )}
                </Link>
              </p>
            ))
          ) : (
            <p>{t("No completed lessons yet.", "لا دروس مكتملة بعد.")}</p>
          )}
          <h2>{t("Quiz history", "سجل الاختبارات")}</h2>
          {data.attempts.length ? (
            data.attempts.map((a) => (
              <div className="review-row" key={a.id}>
                {text(courses.find((c) => c.id === a.courseId)!.title)} —{" "}
                {a.score}/{a.total}
                <small>
                  {new Date(a.completedAt).toLocaleString(
                    p.language === "ar" ? "ar-EG" : "en-GB",
                  )}
                </small>
              </div>
            ))
          ) : (
            <p>{t("No attempts yet.", "لا محاولات بعد.")}</p>
          )}
          <h2>{t("Simulation history", "سجل المحاكاة")}</h2>
          {data.results.length ? (
            data.results.map((r) => (
              <div className="review-row" key={r.id}>
                <b>{text(tracks[r.track].name)}</b>
                <p>
                  {Object.entries(r.summary)
                    .map(
                      ([k, v]) =>
                        `${({ total: t("Total EGP", "الإجمالي بالجنيه"), profit: t("Profit EGP", "الربح بالجنيه"), hours: t("Hours", "الساعات"), cost: t("Cost EGP", "التكلفة بالجنيه"), feasible: t("Feasible (1 = yes)", "قابل للتنفيذ (1 = نعم)") } as Record<string, string>)[k] || k}: ${v}`,
                    )
                    .join(" · ")}
                </p>
              </div>
            ))
          ) : (
            <p>{t("No completed simulations yet.", "لا محاكاة مكتملة بعد.")}</p>
          )}
          <Go secondary to="/projects">
            {t("Open projects", "افتح المشاريع")}
          </Go>
        </aside>
      </div>
      <div className="danger-zone">
        <h2>{t("Start fresh", "ابدأ من جديد")}</h2>
        <p>
          {t(
            "Reset removes TRIMIND progress, preferences, sessions and drafts from this browser.",
            "إعادة الضبط تزيل تقدم تريمايند وتفضيلاته وجلساته ومسوداته من المتصفح.",
          )}
        </p>
        <Button variant="secondary" onClick={() => setReset(true)}>
          {t("Reset demo", "إعادة ضبط العرض")}
        </Button>
      </div>
      {reset && (
        <Modal
          title={t("Reset this demo?", "إعادة ضبط العرض؟")}
          confirmLabel={t("Reset demo", "إعادة الضبط")}
          onClose={() => setReset(false)}
          onConfirm={async () => {
            await act(repository.reset());
            navigate("/dashboard");
          }}
        >
          {t(
            "This only removes TRIMIND’s namespaced data. This cannot be undone.",
            "يحذف هذا بيانات تريمايند فقط. لا يمكن التراجع عنه.",
          )}
        </Modal>
      )}
    </Page>
  );
}
export function Account({ signup = false }: { signup?: boolean }) {
  const { t } = useApp();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [status, setStatus] = useState(""),
    [invalid, setInvalid] = useState(false);
  return (
    <Page
      title={
        signup
          ? t("A space for what’s next.", "مساحة لما هو قادم.")
          : t("Welcome to TRIMIND.", "أهلاً بك في تريمايند.")
      }
      description={t(
        "Real accounts are coming in Phase 2. Explore everything now as a guest.",
        "الحسابات الحقيقية قادمة في المرحلة الثانية. استكشف كل شيء الآن كضيف.",
      )}
    >
      <div className="account-layout">
        <form
          className="panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
              password.length < 8
            ) {
              setInvalid(true);
              setStatus(
                t(
                  "Enter a valid email and a password of at least 8 characters.",
                  "أدخل بريداً إلكترونياً صالحاً وكلمة مرور من 8 أحرف على الأقل.",
                ),
              );
              return;
            }
            setInvalid(false);
            setStatus(
              t(
                "Accounts are not available in Phase 1. No authentication was performed and no credentials were saved. Continue as a guest.",
                "الحسابات غير متاحة في المرحلة الأولى. لم يتم تسجيل دخول أو حفظ بيانات اعتماد. تابع كضيف.",
              ),
            );
            setPassword("");
          }}
        >
          <h2>
            {signup
              ? t("Create an account", "إنشاء حساب")
              : t("Log in", "تسجيل الدخول")}
          </h2>
          <Status>
            {t(
              "Phase 2 preview — this form cannot create or access an account.",
              "معاينة المرحلة الثانية — لا ينشئ هذا النموذج حساباً ولا يتيح الوصول إليه.",
            )}
          </Status>
          <Field label={t("Email", "البريد الإلكتروني")}>
            <input
              type="email"
              required
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            label={t("Password", "كلمة المرور")}
            hint={t(
              "At least 8 characters. Do not use a real password in this preview.",
              "8 أحرف على الأقل. لا تستخدم كلمة مرور حقيقية في المعاينة.",
            )}
          >
            <span className="password-wrap">
              <input
                aria-label={t("Password", "كلمة المرور")}
                type={visible ? "text" : "password"}
                minLength={8}
                required
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="icon-button"
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
          <Button variant="secondary" type="submit">
            {t("Check account availability", "تحقق من توفر الحساب")}
          </Button>
          {status && <Status error={invalid}>{status}</Status>}
          <p>
            <Link to={signup ? "/login" : "/signup"}>
              {signup
                ? t("Log in preview", "معاينة تسجيل الدخول")
                : t("Sign up preview", "معاينة إنشاء حساب")}
            </Link>
          </p>
        </form>
        <div>
          <span className="brand-flower">✳</span>
          <h2>
            {t("Curiosity needs no password.", "الفضول لا يحتاج كلمة مرور.")}
          </h2>
          <p>
            {t(
              "Lessons, simulators and project drafts are open to every guest. Progress stays on this browser.",
              "الدروس والمحاكيات ومسودات المشاريع متاحة لكل ضيف. يبقى التقدم على هذا المتصفح.",
            )}
          </p>
          <Go to="/start">{t("Continue as guest", "المتابعة كضيف")}</Go>
        </div>
      </div>
    </Page>
  );
}
