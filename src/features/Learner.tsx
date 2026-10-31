import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../app/context";
import { courses } from "../content/courses";
import { tracks } from "../content/scenarios";
import { recommend, courseProgress } from "../logic/learning";
import { repository } from "../services/repository";
import {
  Button,
  Field,
  Go,
  Metric,
  Modal,
  Page,
  Progress,
  Status,
  TrackPill,
} from "../components/ui";
import { PlanDashboard, PlanProfileSummary } from "./planning/MyPlan";
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
      <PlanDashboard />
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
  useEffect(
    () => setP((prev) => ({ ...prev, language: data.preferences.language })),
    [data.preferences.language],
  );
  return (
    <Page
      title={t("Your learning, your way.", "تعلّمك بطريقتك.")}
      eyebrow={t("PROFILE & PROGRESS", "الملف والتقدم")}
      description={t(
        "This is a guest profile. Information stays on this browser, not online.",
        "هذا ملف ضيف. المعلومات على هذا المتصفح وليست محفوظة على الإنترنت.",
      )}
    >
      <PlanProfileSummary />
      <div className="content-sidebar">
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            await act(
              repository.savePreferences({
                ...data.preferences,
                name: p.name,
                language: p.language,
              }),
            );
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
          <p>
            {t(
              "Goals, paths, experience and time are edited once in your assessment. Update them there to prepare a new plan version.",
              "تُعدّل الأهداف والمسارات والخبرة والوقت في التقييم فقط. حدّثها هناك لإعداد نسخة جديدة من الخطة.",
            )}
          </p>
          <Go secondary to="/assessment">
            {t("Edit assessment", "تعديل التقييم")}
          </Go>
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
