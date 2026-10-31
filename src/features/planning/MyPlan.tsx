import { currentUser } from "../../services/session";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../../app/context";
import { assessmentQuestions } from "../../content/assessment";
import { tracks } from "../../content/scenarios";
import {
  activePlan,
  activityComplete,
  validatePlanResult,
} from "../../logic/planning";
import { missingAnswers } from "../../logic/assessment";
import { repository } from "../../services/repository";
import {
  Button,
  Empty,
  Go,
  Metric,
  Modal,
  Page,
  Progress,
  Status,
  TrackPill,
} from "../../components/ui";
import { usePlanPreparation } from "./usePlanPreparation";
import { PreparationStatus } from "./Assessment";
import type { LearnerProfile, PlanActivity } from "../../models";
export function PlanProfileSummary() {
  const { data, t, catalog: courses } = useApp();
  const result = activePlan(data);
  return (
    <section className="panel plan-profile-summary">
      <h2>{t("Assessment and saved plans", "التقييم والخطط المحفوظة")}</h2>
      <p>
        {result
          ? t(
              `Active plan: version ${result.learningPlan.version}. ${data.planning.plans.length} saved version(s).`,
              `الخطة النشطة: النسخة ${result.learningPlan.version}. ${data.planning.plans.length} نسخة محفوظة.`,
            )
          : data.planning.draft
            ? t(
                "Assessment in progress. Your saved answers can be resumed.",
                "التقييم قيد الإكمال. يمكنك استئناف إجاباتك المحفوظة.",
              )
            : t(
                "Assessment not started. You can personalise learning or continue browsing.",
                "لم يبدأ التقييم. يمكنك تخصيص التعلم أو متابعة التصفح.",
              )}
      </p>
      {result && <StartingSummary profile={result.learnerProfile} />}
      <div className="actions">
        <Go to="/assessment">
          {result
            ? t("Edit assessment / retake", "تعديل التقييم / إعادته")
            : t("Start / resume assessment", "ابدأ / استأنف التقييم")}
        </Go>
        <Go secondary to="/my-plan">
          {t("Saved plans and versions", "الخطط والنسخ المحفوظة")}
        </Go>
      </div>
    </section>
  );
}
export function StartingSummary({ profile }: { profile: LearnerProfile }) {
  const { t, text, catalog: courses } = useApp();
  return (
    <div className="starting-grid">
      {profile.startingPoints
        .filter((s) => profile.selectedPaths.includes(s.track))
        .map((s) => (
          <div className="panel" key={s.track}>
            <TrackPill track={s.track} />
            <h3>
              {s.level === "ready"
                ? t("Try practice, then review", "جرّب التدريب ثم راجع")
                : s.level === "review"
                  ? t("Start with the essentials", "ابدأ بالأساسيات")
                  : t("Explore from the beginning", "استكشف من البداية")}
            </h3>
            <p>
              {s.correct}/{s.total}{" "}
              {t(
                "correct across this small question set",
                "إجابة صحيحة في هذه المجموعة الصغيرة",
              )}
            </p>
            <small>
              {s.answered} {t("answered", "تمت الإجابة عنها")} · {s.unknown}{" "}
              {t("unknown or skipped", "غير معروف أو متخطى")}
            </small>
            <p className="meta">
              {s.unknown
                ? t(
                    "There is not enough evidence to assume familiarity. Start gently; all content stays open.",
                    "لا يوجد دليل كافٍ لافتراض المعرفة. ابدأ بهدوء؛ كل المحتوى يظل متاحاً.",
                  )
                : t(
                    "This is a small starting-point check, not a validated proficiency measure.",
                    "هذه أسئلة قليلة لتحديد البداية وليست مقياساً معتمداً للإتقان.",
                  )}
            </p>
            <small>{text(tracks[s.track].description)}</small>
          </div>
        ))}
    </div>
  );
}
export function PlanDashboard({ compact = false }: { compact?: boolean }) {
  const { data, t, text, catalog: courses } = useApp();
  const result = activePlan(data);
  if (!result)
    return (
      <div className="panel plan-callout">
        <div>
          <h2>{t("Where would you like to start?", "من أين تحب أن تبدأ؟")}</h2>
          <p>
            {data.planning.draft
              ? t(
                  "Your assessment is saved. Resume it to prepare a personal plan.",
                  "تقييمك محفوظ. استأنفه لإعداد خطة شخصية.",
                )
              : t(
                  "Choose your goals, check your starting knowledge and fit a plan around your available time. Assessment is optional.",
                  "اختر أهدافك وتحقق من معرفتك المبدئية وضع خطة تناسب وقتك المتاح. التقييم اختياري.",
                )}
          </p>
        </div>
        <Go to="/assessment">
          {data.planning.draft
            ? t("Resume assessment", "استئناف التقييم")
            : t("Personalise my learning", "خصّص تعلّمي")}
        </Go>
      </div>
    );
  const p = result.learningPlan,
    complete = p.activities.filter((a) => activityComplete(a, data)).length,
    next = p.activities.find((a) => !activityComplete(a, data));
  return (
    <section className="panel plan-callout" data-track={p.primaryPath}>
      <div>
        <p className="eyebrow">
          {t("YOUR PERSONAL PLAN", "خطتك الشخصية")} · {t("VERSION", "النسخة")}{" "}
          {p.version}
        </p>
        <h2>
          {next
            ? text(next.title)
            : t("You completed this plan.", "أكملت هذه الخطة.")}
        </h2>
        <p>
          {t(
            "A saved plan based on your answers.",
            "خطة محفوظة مبنية على إجاباتك.",
          )}
        </p>
        <Progress
          value={complete}
          max={p.activities.length}
          label={t("Activities completed", "الأنشطة المكتملة")}
        />
        {next && (
          <p>
            {t("Next scheduled activity: ", "النشاط المجدول التالي: ")}
            {t("week", "الأسبوع")} {next.segments[0].week} · {t("day", "اليوم")}{" "}
            {next.segments[0].day} · {text(tracks[next.track].name)}
          </p>
        )}
        <div className="actions">
          {next && <Go to={next.url}>{t("Continue learning", "تابع التعلم")}</Go>}
          <Go secondary to="/my-plan">
            {t("My plan", "خطتي")}
          </Go>
          {!compact && (
            <Go secondary to="/assessment">
              {t("Personalise my learning", "خصّص تعلّمي")}
            </Go>
          )}
        </div>
      </div>
    </section>
  );
}
export default function MyPlan() {
  const { data, t, text, act, toast, catalog: courses } = useApp(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [regenerate, setRegenerate] = useState(false),
    [restore, setRestore] = useState<string | null>(null);
  const preparation = usePlanPreparation();
  const result = activePlan(data);
  if (!result)
    return (
      <Page title={t("Your next chapter, planned.", "فصلك التالي بخطة.")}>
        <Empty
          title={t("Start with your answers.", "ابدأ بإجاباتك.")}
          action={
            <Go to="/assessment">
              {data.planning.draft
                ? t("Resume assessment", "استئناف التقييم")
                : t("Personalise my learning", "خصّص تعلّمي")}
            </Go>
          }
        >
          {t(
            "A short assessment connects your goals, starting point and available time to the existing catalog. You can keep browsing without a plan.",
            "يربط تقييم قصير أهدافك ونقطة البداية ووقتك المتاح بالمحتوى الحالي. يمكنك الاستمرار في التصفح دون خطة.",
          )}
        </Empty>
        <Go secondary to="/learn">
          {t("Browse the library", "تصفح المكتبة")}
        </Go>
      </Page>
    );
  if (!validatePlanResult(result, courses))
    return (
      <Page
        title={t(
          "This plan needs to be refreshed.",
          "تحتاج هذه الخطة إلى تحديث.",
        )}
      >
        <Status error>
          {t(
            "A plan referenced unavailable content. Your completed work is preserved.",
            "أشارت خطة إلى محتوى غير متاح. عملك المكتمل محفوظ.",
          )}
        </Status>
        <Go to="/assessment">{t("Review assessment", "راجع التقييم")}</Go>
      </Page>
    );
  const p = result.learningPlan,
    profile = result.learnerProfile,
    done = p.activities.filter((a) => activityComplete(a, data)),
    next = p.activities.find((a) => !activityComplete(a, data));
  const label = (id: string, value: string) => {
    const option = assessmentQuestions
      .find((q) => q.id === id)
      ?.options?.find((o) => o.id === value);
    return option ? text(option.label) : value;
  };
  const sessions = new Map<
    number,
    { activity: PlanActivity; part: PlanActivity["segments"][number] }[]
  >();
  for (const a of p.activities)
    for (const part of a.segments)
      sessions.set(part.session, [
        ...(sessions.get(part.session) || []),
        { activity: a, part },
      ]);
  return (
    <Page
      title={t("Your TriMind journey", "رحلتك مع تريمايند")}
      eyebrow={`${t("MY PLAN / VERSION", "خطتي / النسخة")} ${p.version}`}
      description={t(
        "Your saved learning plan. AI-supported plans are checked against the available catalog and your time limits.",
        "خطتك التعليمية المحفوظة. تُراجع الخطط المدعومة بالذكاء الاصطناعي مقابل المحتوى المتاح وحدود وقتك.",
      )}
      actions={
        <Go secondary to="/assessment">
          {t("Edit answers", "تعديل الإجابات")}
        </Go>
      }
    >
      <section className="journey-start" data-track={p.primaryPath}>
        <p className="eyebrow">{t('YOUR RECOMMENDED START','بدايتك المقترحة')}</p>
        <TrackPill track={p.primaryPath}/>
        <h2>{next ? text(next.title) : t('A journey worth continuing.','رحلة تستحق أن تستمر.')}</h2>
        <p>{t(`Your weekly rhythm: ${p.sessionMinutes} minutes × ${p.daysPerWeek} days. Start with the essentials, then put them into practice.`,`إيقاعك الأسبوعي: ${p.sessionMinutes} دقيقة × ${p.daysPerWeek} أيام. ابدأ بالأساسيات ثم طبّقها عملياً.`)}</p>
        {profile.discovery && <small>{t('Starting level: foundations. Your experience is self-reported; one scenario does not establish proficiency. Lesson checks help you calibrate as you go.','مستوى البداية: الأساسيات. الخبرة معلومة ذاتية وسيناريو واحد لا يثبت الإتقان. تساعدك أسئلة الدروس على تقييم فهمك أثناء التقدم.')}</small>}
        {next && <div className="actions"><Go to={next.url}>{t('Start my journey','ابدأ رحلتي')}</Go></div>}
      </section>
      {p.source === "demo" && (
        <Status>
          {t(
            "This is a previously saved local plan. Sign in to prepare an AI-assisted plan.",
            "هذه خطة محلية محفوظة سابقاً. سجّل الدخول لإعداد خطة مدعومة بالذكاء الاصطناعي.",
          )}
        </Status>
      )}
      {(params.has("prepared") || preparation.state === "success") && (
        <Status>
          {t(
            "Your personal plan is ready. Choose your first activity below.",
            "خطتك الشخصية جاهزة. اختر نشاطك الأول أدناه.",
          )}
        </Status>
      )}
      {p.personalisation && (
        <section className="panel plan-profile-summary">
          <h2>{t("Your learning direction", "اتجاه تعلمك")}</h2>
          <p>{text(p.personalisation.summary)}</p>
          <ul>
            {p.personalisation.reasons.map((reason, i) => (
              <li key={i}>{text(reason)}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="metrics">
        <Metric
          label={t("Activity progress", "تقدم الأنشطة")}
          value={`${done.length}/${p.activities.length}`}
        />
        <Metric
          label={t("Minutes per session", "دقائق الجلسة")}
          value={p.sessionMinutes}
        />
        <Metric
          label={t("Days per week", "أيام الأسبوع")}
          value={p.daysPerWeek}
        />
        <Metric
          label={t("Estimated catalog weeks", "أسابيع المحتوى المقدرة")}
          value={p.scheduledWeeks}
        />
      </div>
      <details className="progress-details"><summary>{t('Plan details and starting point','تفاصيل الخطة ونقطة البداية')}</summary><div className="plan-overview">
        <div>
          <TrackPill track={profile.primaryPath} />
          <h2>{label("goal", profile.goal)}</h2>
          {profile.aspiration && (
            <p className="preserve-lines">{profile.aspiration}</p>
          )}
          <p>
            {t("Supporting paths: ", "المسارات الداعمة: ")}
            {profile.supportingPaths.length
              ? profile.supportingPaths
                  .map((k) => text(tracks[k].name))
                  .join("، ")
              : t(
                  "None selected — focus on one path.",
                  "لم تحدد مسارات إضافية — ركّز على مسار واحد.",
                )}
          </p>
          <Go secondary to="/assessment">
            {t("Edit goals and preferences", "تعديل الأهداف والتفضيلات")}
          </Go>
        </div>
        <div className="panel">
          <h3>{t("Why this plan?", "لماذا هذه الخطة؟")}</h3>
          <ul className="plan-reasons">
            <li>
              {t(
                "Your goal and selected interests put ",
                "هدفك واهتماماتك المختارة جعلا ",
              )}
              {text(tracks[profile.primaryPath].name)}
              {t(
                " first. Unselected paths are not added.",
                " أولاً. لم تُضف مسارات غير مختارة.",
              )}
            </li>
            <li>
              {profile.startingPoints.find(
                (s) => s.track === profile.primaryPath,
              )?.level === "ready"
                ? t(
                    "Your short knowledge check supports starting with practice, followed by lesson review. Nothing is skipped or locked.",
                    "تدعم إجاباتك البدء بالتدريب ثم مراجعة الدروس. لا شيء يُحذف أو يُقفل.",
                  )
                : t(
                    "Unknown or developing knowledge starts with the beginner lessons before practice.",
                    "المعرفة غير المعروفة أو النامية تبدأ بدروس المبتدئين قبل التدريب.",
                  )}
            </li>
            <li>
              {t(
                `Sessions use at most ${p.sessionMinutes} minutes across ${p.daysPerWeek} days per week. Longer activities are split into parts.`,
                `الجلسة بحد أقصى ${p.sessionMinutes} دقيقة عبر ${p.daysPerWeek} أيام أسبوعياً. الأنشطة الأطول مقسمة إلى أجزاء.`,
              )}
            </li>
            <li>
              {profile.discovery ? t('Your stated learning preference guides this journey. Every lesson includes an explanation, a worked example and a short check.','يوجّه تفضيلك المعلن هذه الرحلة. يحتوي كل درس على شرح ومثال محلول وسؤال قصير.') : profile.formats.includes("examples") ||
              profile.difficulty === "example"
                ? t(
                    "Your preference for examples links lessons directly to their worked example. Read the full article when useful.",
                    "تفضيلك للأمثلة يربط الدروس مباشرة بالمثال المحلول. اقرأ المقال كاملاً عند الحاجة.",
                  )
                : profile.formats.includes("practice")
                  ? t(
                      "Your practice preference opens lesson knowledge checks first; explanations remain available above them.",
                      "تفضيلك للتدريب يفتح أسئلة التحقق أولاً، ويظل الشرح متاحاً أعلاها.",
                    )
                  : t(
                      "Your reading preference keeps lesson articles as the first view.",
                      "تفضيلك للقراءة يجعل المقال أول ما يظهر في الدرس.",
                    )}
            </li>
          </ul>
          {!profile.discovery && <p>{label("confidence", profile.confidence)}. {label("support", profile.support)}.</p>}
          <p>
            {profile.confidence === "low"
              ? t(
                  "Take one small step at a time; use Previous, examples and retry whenever needed.",
                  "خذ خطوة صغيرة في كل مرة؛ استخدم الرجوع والأمثلة وإعادة المحاولة عند الحاجة.",
                )
              : profile.support === "reflection"
                ? t(
                    "After each scenario, write what changed, why it happened and what you would try next in your project.",
                    "بعد كل سيناريو اكتب ما تغير ولماذا وماذا ستجرب لاحقاً في مشروعك.",
                  )
                : profile.support === "independent"
                  ? t(
                      "Use the ordered list as a guide; you can explore every activity in any order.",
                      "استخدم القائمة المرتبة دليلاً؛ يمكنك استكشاف كل نشاط بأي ترتيب.",
                    )
                  : t(
                      "Follow the ordered checklist below. Completion is based on actual activity, not the schedule alone.",
                      "اتبع القائمة المرتبة أدناه. يعتمد الإنجاز على النشاط الفعلي وليس الجدول وحده.",
                    )}
          </p>
          {profile.connectivity === "limited" && (
            <p>
              {t(
                "Load the app before a session. Save drafts explicitly. Your data stays on this browser; offline reload is not guaranteed.",
                "حمّل التطبيق قبل الجلسة واحفظ المسودات صراحة. تبقى بياناتك على هذا المتصفح؛ لا نضمن إعادة التحميل دون اتصال.",
              )}
            </p>
          )}
        </div>
      </div>
      <section className="plan-section">
        <h2>{t("Your starting point", "نقطة بدايتك")}</h2>
        <StartingSummary profile={profile} />
      </section>
      <Status>
        {profile.discovery ? t(`The available activities take about ${p.scheduledWeeks} weeks at your chosen pace.`,`تستغرق الأنشطة المتاحة نحو ${p.scheduledWeeks} أسبوعاً بإيقاعك المختار.`) : p.scheduledWeeks > p.targetWeeks
          ? t(
              `Your chosen activities need about ${p.scheduledWeeks} weeks at this pace, beyond your ${p.targetWeeks}-week target. The first ${p.targetWeeks} weeks fit your target; later sessions are clearly marked. Select fewer paths or allow more time if you prefer.`,
              `تحتاج الأنشطة المختارة نحو ${p.scheduledWeeks} أسبوعاً بهذا الإيقاع، أكثر من هدفك البالغ ${p.targetWeeks} أسبوعاً. الأسابيع الأولى ضمن الهدف؛ الجلسات اللاحقة موضحة. اختر مسارات أقل أو وقتاً أطول إذا أردت.`,
            )
          : t(
              `This catalog takes about ${p.scheduledWeeks} weeks at your pace, within your ${p.targetWeeks}-week target. We do not fill the remaining time with invented modules.`,
              `يحتاج هذا المحتوى نحو ${p.scheduledWeeks} أسبوعاً بإيقاعك ضمن هدف ${p.targetWeeks} أسبوعاً. لا نملأ المدة المتبقية بوحدات مختلقة.`,
            )}{" "}
        {t(
          `Total activity estimate: ${p.totalMinutes} minutes. Reading time comes from lessons; practice, quiz and project times are planning estimates, not deadlines.`,
          `إجمالي الوقت المقدّر: ${p.totalMinutes} دقيقة. وقت القراءة من الدروس؛ أوقات التدريب والاختبار والمشروع تقديرات للتخطيط وليست مواعيد إلزامية.`,
        )}
      </Status>
      </details><section className="plan-section">
        <div className="split">
          <h2>{t("Your ordered activities", "أنشطتك بالترتيب")}</h2>
          {next && (
            <Go to={next.url}>{t("Start / continue", "ابدأ / تابع")}</Go>
          )}
        </div>
        <Progress
          value={done.length}
          max={p.activities.length}
          label={t("Actual activity completion", "الإنجاز الفعلي للأنشطة")}
        />
        <p className="meta">
          {t(
            "Lessons: mark complete. Quizzes: submit an attempt. Simulations: finish a run. Projects: save a titled draft with problem, audience and solution. Existing completed work counts across plan versions.",
            "الدروس: حدّد اكتمالها. الاختبارات: أرسل محاولة. المحاكيات: أكمل جولة محاكاة. المشاريع: احفظ عنواناً ومشكلة وجمهوراً وحلاً. يُحتسب العمل المكتمل عبر نسخ الخطط.",
          )}
        </p>
        <ol className="plan-activities">
          {p.activities.map((a) => (
            <li key={a.id} data-track={a.track} data-state={activityComplete(a,data) ? 'complete' : next?.id===a.id ? 'current' : 'upcoming'} aria-current={next?.id===a.id ? 'step' : undefined}>
              <div>
                <TrackPill track={a.track} />
                <h3>{text(a.title)}</h3>
                <p className="meta">
                  {a.minutes} {t("estimated minutes", "دقيقة تقديرية")} ·{" "}
                  {t("week", "الأسبوع")} {a.segments[0].week}{" "}
                  {a.review &&
                    `· ${t("Review after practice", "مراجعة بعد التدريب")}`}
                </p>
              </div>
              <div className="activity-action">
                <span>
                  {activityComplete(a, data)
                    ? t("Completed", "مكتمل")
                    : t("Not completed yet", "لم يكتمل بعد")}
                </span>
                <Go secondary to={a.url}>
                  {activityComplete(a, data)
                    ? t("Revisit", "راجع")
                    : t("Open activity", "افتح النشاط")}
                </Go>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="plan-section">
        <h2>{t("A schedule that fits your time", "جدول يناسب وقتك")}</h2>
        <p>
          {t(
            "Days are relative learning days, not appointments. Pick the calendar days that suit you. A split activity is completed once its whole task is done.",
            "الأيام أيام تعلم نسبية وليست مواعيد محددة. اختر الأيام التي تناسبك. لا يكتمل النشاط المقسم إلا بعد إنجاز مهمته كاملة.",
          )}
        </p>
        <div className="session-grid">
          {[...sessions].map(([number, parts]) => (
            <article className="panel" key={number}>
              <p className="eyebrow">
                {t("WEEK", "الأسبوع")} {parts[0].part.week} ·{" "}
                {t("DAY", "اليوم")} {parts[0].part.day}
              </p>
              <h3>
                {t("Session", "جلسة")} {number} ·{" "}
                {parts.reduce((n, p) => n + p.part.minutes, 0)}/
                {p.sessionMinutes} {t("min", "دقيقة")}
              </h3>
              {parts[0].part.week > p.targetWeeks && (
                <small>
                  {t("Beyond your target timeframe", "بعد المدة المستهدفة")}
                </small>
              )}
              <ul>
                {parts.map(({ activity: a, part }, i) => (
                  <li key={i}>
                    {text(a.title)} — {part.minutes} {t("min", "دقيقة")}
                    {part.parts > 1 &&
                      ` · ${t("part", "الجزء")} ${part.part}/${part.parts}`}{" "}
                    ·{" "}
                    {activityComplete(a, data)
                      ? t("Completed", "مكتمل")
                      : t("Planned", "مخطط")}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="plan-section">
        <h2>
          {t("Outcomes within this catalog", "نتائج التعلم ضمن المحتوى المتاح")}
        </h2>
        <ul>
          {courses
            .filter((c) => profile.selectedPaths.includes(c.track))
            .flatMap((c) =>
              c.outcomes.map((o, i) => <li key={c.id + i}>{text(o)}</li>),
            )}
        </ul>
        <p>
          {t(
            "These are practice goals, not guaranteed mastery. The catalog contains three beginner courses, three simulators and editable projects.",
            "هذه أهداف تدريب وليست ضماناً للإتقان. يتضمن المحتوى ثلاث دورات للمبتدئين وثلاثة محاكيات ومشاريع قابلة للتعديل.",
          )}
        </p>
      </section>
      <section className="plan-section">
        <h2>{t("Saved plan versions", "نسخ الخطط المحفوظة")}</h2>
        <PreparationStatus preparation={preparation} />
        <div className="actions">
          <Button
            onClick={() => setRegenerate(true)}
            loading={preparation.state === "preparing"}
          >
            {preparation.state === "error"
              ? t("Retry regeneration", "إعادة محاولة التجديد")
              : t("Regenerate plan", "إعادة إعداد الخطة")}
          </Button>
          <Go secondary to="/assessment">
            {t("Edit assessment", "تعديل التقييم")}
          </Go>
        </div>
        <ul className="plan-history">
          {[...data.planning.plans].reverse().map((r) => (
            <li key={r.learningPlan.id}>
              <span>
                {t("Version", "النسخة")} {r.learningPlan.version} ·{" "}
                {new Date(r.learningPlan.createdAt).toLocaleString(
                  data.preferences.language === "ar" ? "ar-EG" : "en-GB",
                )}{" "}
                ·{" "}
                {r.learningPlan.source === "demo"
                  ? t("Saved locally", "محفوظة محلياً")
                  : t("Personal plan", "خطة شخصية")}
              </span>
              {r.learningPlan.id === p.id ? (
                <b>{t("Current", "الحالية")}</b>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setRestore(r.learningPlan.id)}
                >
                  {t("Use this version", "استخدم هذه النسخة")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
      {regenerate && (
        <Modal
          title={t("Regenerate your plan?", "إعادة إعداد خطتك؟")}
          confirmLabel={t("Regenerate plan", "إعادة إعداد الخطة")}
          onClose={() => setRegenerate(false)}
          onConfirm={() => {
            setRegenerate(false);
            if (!currentUser()) {
              navigate("/login?next=%2Fmy-plan");
              return;
            }
            const draft = data.planning.draft;
            if (!draft || missingAnswers(draft).length) {
              navigate("/assessment");
              return;
            }
            void preparation.generate(draft, true);
          }}
        >
          {t(
            "A new version will use your latest saved answers. Completed work and all older plans remain. If answers are incomplete, you will return to assessment.",
            "تستخدم النسخة الجديدة أحدث إجاباتك المحفوظة. يبقى العمل المكتمل وكل الخطط السابقة. إذا كانت الإجابات ناقصة ستعود إلى التقييم.",
          )}
        </Modal>
      )}
      {restore && (
        <Modal
          title={t("Use an older plan?", "استخدام خطة سابقة؟")}
          confirmLabel={t("Use this version", "استخدم هذه النسخة")}
          onClose={() => setRestore(null)}
          onConfirm={async () => {
            await act(repository.activatePlan(restore));
            setRestore(null);
            toast(
              t(
                "Plan version selected. Completed work is unchanged.",
                "تم اختيار نسخة الخطة. لم يتغير العمل المكتمل.",
              ),
            );
          }}
        >
          {t(
            "Only the active plan changes. Your answers and completed learning stay saved.",
            "تتغير الخطة النشطة فقط. تبقى الإجابات والتعلم المكتمل محفوظة.",
          )}
        </Modal>
      )}
    </Page>
  );
}
