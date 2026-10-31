import { currentUser } from "../../services/session";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../app/context";
import { sections } from "../../content/assessment";
import {
  answerList,
  answerString,
  answerValue,
  missingAnswers,
  newAssessment,
  questionsFor,
  setAssessmentAnswer,
  validAnswer,
} from "../../logic/assessment";
import { repository } from "../../services/repository";
import {
  Button,
  Field,
  Go,
  Modal,
  Page,
  Progress,
  Status,
} from "../../components/ui";
import type { AnswerValue, AssessmentQuestion } from "../../models";
import { usePlanPreparation } from "./usePlanPreparation";
export function QuestionControl({
  question,
  value,
  onChange,
  error,
}: {
  question: AssessmentQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  error?: string;
}) {
  const { t, text } = useApp();
  const errorId = `${question.id}-error`;
  if (question.kind === "select")
    return (
      <Field
        error={error}
        label={text(question.title)}
        hint={text(
          question.hint || {
            en: "Choose one option.",
            ar: "اختر إجابة واحدة.",
          },
        )}
      >
        <select
          value={typeof value === "string" ? value : ""}
          aria-invalid={!!error}
          aria-errormessage={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {t("Choose an option", "اختر إجابة")}
          </option>
          {question.options?.map((o) => (
            <option key={o.id} value={o.id}>
              {text(o.label)}
            </option>
          ))}
        </select>
      </Field>
    );
  if (question.kind === "text")
    return (
      <Field
        label={text(question.title)}
        hint={question.hint && text(question.hint)}
      >
        <textarea
          rows={4}
          maxLength={300}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  return (
    <fieldset
      className="choices"
      aria-describedby={question.hint ? `${question.id}-hint` : undefined}
      aria-invalid={!!error}
      aria-errormessage={error ? errorId : undefined}
    >
      <legend>{text(question.title)}</legend>
      {question.hint && <p id={`${question.id}-hint`}>{text(question.hint)}</p>}
      {question.options?.map((o) => {
        const selected = Array.isArray(value)
          ? value.includes(o.id)
          : value === o.id;
        return (
          <label className={`choice ${selected ? "selected" : ""}`} key={o.id}>
            <input
              type={question.kind === "multi" ? "checkbox" : "radio"}
              name={question.id}
              value={o.id}
              checked={selected}
              onChange={(e) =>
                onChange(
                  question.kind === "multi"
                    ? e.target.checked
                      ? [...(Array.isArray(value) ? value : []), o.id]
                      : (Array.isArray(value) ? value : []).filter(
                          (v) => v !== o.id,
                        )
                    : o.id,
                )
              }
            />
            {text(o.label)}
          </label>
        );
      })}
    </fieldset>
  );
}
export function PreparationStatus({
  preparation,
}: {
  preparation: ReturnType<typeof usePlanPreparation>;
}) {
  const { t } = useApp();
  return (
    <>
      {preparation.state === "preparing" && (
        <div className="panel" aria-busy="true">
          <Status>
            {t(
              "Preparing your personal plan from your answers and the available learning activities…",
              "جارٍ إعداد خطتك الشخصية من إجاباتك وأنشطة التعلم المتاحة…",
            )}
          </Status>
          <Button variant="secondary" onClick={preparation.cancel}>
            {t("Cancel preparation", "إلغاء الإعداد")}
          </Button>
        </div>
      )}
      {preparation.state === "cancelled" && (
        <Status>
          {t(
            "You stopped waiting. Your answers are kept. Check My plan before starting another request.",
            "توقفت عن الانتظار. إجاباتك محفوظة. تحقق من خطتي قبل بدء طلب آخر.",
          )}
        </Status>
      )}
      {preparation.state === "error" && (
        <Status error>
          {preparation.error === "authentication-required" ||
          preparation.error === "session-expired"
            ? t(
                "Sign in to prepare your plan. Your assessment is saved.",
                "سجّل الدخول لإعداد خطتك. تقييمك محفوظ.",
              )
            : preparation.error === "generation-in-progress"
              ? t(
                  "A plan is still being prepared. Wait, then retry; a duplicate request was not started.",
                  "لا يزال إعداد الخطة جارياً. انتظر ثم أعد المحاولة؛ لم يبدأ طلب مكرر.",
                )
              : preparation.error === "rate-limit"
                ? t(
                    "Too many planning requests. Please try again later. Your last plan is safe.",
                    "طلبات إعداد الخطط كثيرة. حاول لاحقاً. آخر خطة محفوظة.",
                  )
                : preparation.error === "invalid-output"
                  ? t(
                      "The returned plan did not meet the learning rules. Your previous plan is safe. Try again later.",
                      "لم تستوفِ الخطة قواعد التعلم. خطتك السابقة محفوظة. حاول لاحقاً.",
                    )
                  : preparation.error === "insufficient-credits"
                    ? t(
                        "Planning has reached its service allowance. Try again later; your work is saved.",
                        "بلغت خدمة التخطيط حد الاستخدام. حاول لاحقاً؛ عملك محفوظ.",
                      )
                    : preparation.error === "stale-assessment"
                      ? t(
                          "Your answers changed during preparation. Review the latest answers and try again.",
                          "تغيرت إجاباتك أثناء الإعداد. راجع أحدث الإجابات وحاول مجدداً.",
                        )
                      : preparation.error === "incomplete-assessment"
                        ? t(
                            "Some required preferences are missing. Finish the assessment first.",
                            "بعض التفضيلات المطلوبة ناقصة. أكمل التقييم أولاً.",
                          )
                        : t(
                            "Your plan could not be prepared. Your answers and last valid plan are safe. Retry later or edit your answers.",
                            "تعذر إعداد خطتك. إجاباتك وآخر خطة صالحة محفوظة. حاول لاحقاً أو عدّل إجاباتك.",
                          )}
        </Status>
      )}
      {preparation.state === "success" && (
        <Status>
          {t("Your personal plan is ready.", "خطتك الشخصية جاهزة.")}
        </Status>
      )}
    </>
  );
}
export default function Assessment() {
  const { data, t, text, act, toast } = useApp(),
    navigate = useNavigate();
  const [draft, setDraft] = useState(
      () => data.planning.draft || newAssessment(),
    ),
    [error, setError] = useState(false),
    [discard, setDiscard] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveSequence = useRef(0);
  const current = useRef(draft);
  current.current = draft;
  const preparation = usePlanPreparation(() => navigate("/my-plan?prepared=1"));
  const questions = questionsFor(draft),
    index = Math.max(
      0,
      questions.findIndex((q) => q.id === draft.currentQuestionId),
    ),
    q = questions[index];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [draft.currentQuestionId, draft.stage]);
  const persist = async (next: typeof draft) => {
    const ticket = ++saveSequence.current;
    setSaved(false);
    current.current = next;
    setDraft(next);
    try {
      await act(repository.saveAssessment(next));
      if (ticket === saveSequence.current) setSaved(true);
      return true;
    } catch {
      if (ticket === saveSequence.current) setSaved(false);
      return false;
    }
  };
  const change = (v: AnswerValue) => {
    setError(false);
    void persist(setAssessmentAnswer(current.current, q.id, v));
  };
  const move = (i: number) => {
    setError(false);
    void persist({
      ...current.current,
      stage: "questions",
      currentQuestionId: questions[i].id,
    });
  };
  const next = () => {
    if (
      q.required &&
      (!validAnswer(q, answerValue(draft, q.id)) ||
        (Array.isArray(answerValue(draft, q.id)) &&
          !answerList(draft, q.id).length))
    ) {
      setError(true);
      return;
    }
    if (index === questions.length - 1)
      void persist({ ...current.current, stage: "review" });
    else move(index + 1);
  };
  const generate = () => {
    if (!currentUser()) {
      navigate("/login?next=%2Fassessment");
      return;
    }
    if (data.planning.plans.length) setConfirm(true);
    else void preparation.generate(current.current, false);
  };
  const answered = questions.filter((q) => {
    const v = answerValue(draft, q.id);
    return validAnswer(q, v) && v !== "" && (!Array.isArray(v) || v.length > 0);
  }).length;
  return (
    <Page
      eyebrow={t("YOUR STARTING POINT", "نقطة بدايتك")}
      title={t("Find your next direction.", "اكتشف خطوتك القادمة.")}
      description={t(
        draft.assessmentVersion === 'assessment-1' ? 'Your previously saved assessment. Continue with the original questions and answers.' : 'Seven questions. About 90 seconds. A practical journey shaped around you.',
        draft.assessmentVersion === 'assessment-1' ? 'تقييمك المحفوظ سابقاً. تابع بالأسئلة والإجابات الأصلية.' : 'سبعة أسئلة. نحو 90 ثانية. رحلة عملية تناسبك.',
      )}
    >
      <div className="assessment-layout">
        <aside className="assessment-sidebar">
          <nav aria-label={t("Assessment sections", "أقسام التقييم")}>
            {draft.assessmentVersion === 'assessment-1' ? Object.entries(sections).map(([key, label]) => (
              <p
                className={
                  draft.stage === "questions" && q.section === key
                    ? "current"
                    : ""
                }
                key={key}
              >
                {text(label)}
              </p>
            )) : <p className="current">{t('YOUR DISCOVERY','رحلة الاكتشاف')}</p>}
          </nav>
          <Progress
            value={answered}
            max={questions.length}
            label={t("Answers saved", "الإجابات المحفوظة")}
          />
          <small>
            {t(
              currentUser() ? 'Your answers are saved to your account.' : 'Your answers are saved here. Sign in when you are ready to create your AI journey.',
              currentUser() ? 'إجاباتك محفوظة في حسابك.' : 'إجاباتك محفوظة هنا. سجّل الدخول عندما تكون مستعداً لإنشاء رحلتك بالذكاء الاصطناعي.',
            )}
          </small>
          <Link className="text-link" to="/learn">
            {t("Browse without assessment", "تصفّح دون تقييم")}
          </Link>
        </aside>
        <div className="assessment-body">
          {draft.stage === "intro" ? (
            <div className="panel">
              <h2 ref={heading} tabIndex={-1}>
                {t(
                  "Let’s find a useful starting point.",
                  "لنكتشف نقطة بداية مفيدة.",
                )}
              </h2>
              <p>
                {t(
                  "There are 20 short questions in three sections, plus up to three beginner-friendly follow-ups if you report prior practice. Take the time you need, save and return later, or browse without a plan.",
                  "هناك 20 سؤالاً قصيراً في ثلاثة أقسام، مع ثلاثة أسئلة متابعة كحد أقصى إذا ذكرت ممارسة سابقة. خذ وقتك واحفظ للعودة لاحقاً أو تصفح دون خطة.",
                )}
              </p>
              <p>
                {t(
                  "Preferences are never marked right or wrong. Six short knowledge scenarios help suggest a starting point; “I don’t know yet” and skipped questions do not imply proficiency.",
                  "لا تُقيّم التفضيلات بصح أو خطأ. تساعد ستة سيناريوهات معرفية قصيرة في اقتراح البداية؛ عدم المعرفة وتخطي السؤال لا يعنيان الإتقان.",
                )}
              </p>
              <p>
                {t(
                  "AI supports your personal learning plan. Your learning preferences and objective starting-point scores are processed by an external AI service. Names, email and optional free text are not sent.",
                  "يساعد الذكاء الاصطناعي في خطتك الشخصية. تعالج خدمة ذكاء اصطناعي خارجية تفضيلات التعلم ودرجات نقطة البداية الموضوعية. لا تُرسل الأسماء أو البريد أو النص الاختياري.",
                )}
              </p>
              <div className="actions">
                <Button
                  onClick={() => void persist({ ...draft, stage: "questions" })}
                >
                  {t("Begin assessment", "ابدأ التقييم")}
                </Button>
                <Go secondary to="/dashboard">
                  {t("Browse as guest", "التصفح كضيف")}
                </Go>
                <Go secondary to="/signup?next=%2Fassessment">
                  {t("Account options", "خيارات الحساب")}
                </Go>
              </div>
            </div>
          ) : draft.stage === "questions" ? (
            <form
              className="panel"
              noValidate
              data-assessment-question={q.id}
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <p className="eyebrow">
                {text(sections[q.section])} · {index + 1}/{questions.length}
              </p>
              <h2 ref={heading} tabIndex={-1}>
                {q.kind === "scenario"
                  ? t("Try a small scenario.", "جرّب سيناريو صغيراً.")
                  : t("A little about your plans.", "قليل عن خططك.")}
              </h2>
              <QuestionControl
                question={q}
                value={answerValue(draft, q.id)}
                onChange={change}
                error={
                  error
                    ? t("Choose an answer to continue.", "اختر إجابة للمتابعة.")
                    : undefined
                }
              />
              {error && (
                <div id={`${q.id}-error`}>
                  <Status error>
                    {t(
                      "Choose at least one valid answer to continue.",
                      "اختر إجابة صالحة واحدة على الأقل للمتابعة.",
                    )}
                  </Status>
                </div>
              )}
              <div className="actions">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    index
                      ? move(index - 1)
                      : draft.assessmentVersion === 'assessment-1' ? void persist({ ...draft, stage: "intro" }) : navigate('/')
                  }
                >
                  {t("Previous", "السابق")}
                </Button>
                <Button type="submit">
                  {index === questions.length - 1
                    ? t("Review answers", "مراجعة الإجابات")
                    : t("Next", "التالي")}
                </Button>
                {q.section === "knowledge" && (
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => {
                      const nextDraft = setAssessmentAnswer(
                        current.current,
                        q.id,
                        "unknown",
                      );
                      void persist({
                        ...nextDraft,
                        stage:
                          index === questions.length - 1
                            ? "review"
                            : "questions",
                        currentQuestionId:
                          questions[Math.min(index + 1, questions.length - 1)]
                            .id,
                      });
                    }}
                  >
                    {t("Skip — I’m not sure", "تخطَّ — لست متأكداً")}
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="text"
                onClick={() =>
                  void persist({ ...current.current, stage: "review" })
                }
              >
                {t("Review saved answers", "راجع الإجابات المحفوظة")}
              </Button>
            </form>
          ) : (
            <div className="panel">
              <h2 ref={heading} tabIndex={-1}>
                {t(
                  "Review before preparing your plan.",
                  "راجع قبل إعداد خطتك.",
                )}
              </h2>
              <p>
                {t(
                  "Only starting-knowledge scenarios are scored. Your interests and support preferences have no right or wrong answers.",
                  "تُحسب نتائج سيناريوهات المعرفة المبدئية فقط. ليس للاهتمامات وتفضيلات الدعم إجابة صحيحة أو خاطئة.",
                )}
              </p>
              {missingAnswers(draft).length > 0 && (
                <Status error>
                  {t(
                    "Some preferences still need answers. Use Edit to complete them.",
                    "بعض التفضيلات تحتاج إجابات. استخدم تعديل لإكمالها.",
                  )}
                </Status>
              )}
              {Object.entries(sections).map(([section, label]) => (
                <section key={section}>
                  <h3>{text(label)}</h3>
                  {questions
                    .filter((q) => q.section === section)
                    .map((question) => {
                      const value = answerValue(draft, question.id);
                      const values = Array.isArray(value) ? value : [value];
                      return (
                        <div className="answer-review" key={question.id}>
                          <div>
                            <b>{text(question.title)}</b>
                            <p>
                              {question.kind === "text"
                                ? answerString(draft, question.id) ||
                                  t(
                                    "Not provided (optional)",
                                    "غير محدد (اختياري)",
                                  )
                                : values
                                    .filter(Boolean)
                                    .map((v) =>
                                      question.options?.find((o) => o.id === v),
                                    )
                                    .filter(Boolean)
                                    .map((o) => text(o!.label))
                                    .join("، ") ||
                                  t("Not answered", "بلا إجابة")}
                            </p>
                          </div>
                          <Button
                            variant="text"
                            onClick={() =>
                              move(
                                questions.findIndex(
                                  (q) => q.id === question.id,
                                ),
                              )
                            }
                            aria-label={`${t("Edit", "تعديل")}: ${text(question.title)}`}
                          >
                            {t("Edit", "تعديل")}
                          </Button>
                        </div>
                      );
                    })}
                </section>
              ))}
              <PreparationStatus preparation={preparation} />
              <p className="meta">{t('Your validated learning choices and the available catalog are sent to an external AI service to create this journey. Names, email and project data are excluded.','تُرسل اختيارات التعلّم بعد التحقق منها والمحتوى المتاح إلى خدمة ذكاء اصطناعي خارجية لإنشاء الرحلة. لا تُرسل الأسماء أو البريد الإلكتروني أو بيانات المشاريع.')}</p>
              {!saved && (
                <Status>
                  {t(
                    "Saving changes, or waiting for a connection. Use Save answers to retry.",
                    "جارٍ حفظ التغييرات أو انتظار الاتصال. استخدم حفظ الإجابات لإعادة المحاولة.",
                  )}
                </Status>
              )}
              {!saved && (
                <Button
                  variant="secondary"
                  onClick={() => void persist(current.current)}
                >
                  {t("Save answers", "حفظ الإجابات")}
                </Button>
              )}
              <div className="actions">
                <Button
                  loading={preparation.state === "preparing"}
                  disabled={missingAnswers(draft).length > 0 || !saved}
                  onClick={generate}
                >
                  {preparation.state === "error"
                    ? t("Retry plan preparation", "إعادة محاولة إعداد الخطة")
                    : t("Prepare my personal plan", "إعداد خطتي الشخصية")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => move(questions.length - 1)}
                  disabled={preparation.state === "preparing"}
                >
                  {t("Previous", "السابق")}
                </Button>
              </div>
            </div>
          )}
          {draft.stage !== "intro" && (
            <div className="assessment-save">
              <Status>
                {repository.status === "unavailable"
                  ? t(
                      "Answers are kept in this session only; browser storage is unavailable.",
                      "الإجابات محفوظة في هذه الجلسة فقط؛ تخزين المتصفح غير متاح.",
                    )
                  : t(
                      currentUser()
                        ? "Answers saved to your account."
                        : "Answers saved on this browser.",
                      currentUser()
                        ? "الإجابات محفوظة في حسابك."
                        : "الإجابات محفوظة على هذا المتصفح.",
                    )}
              </Status>
              <div className="actions">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    preparation.cancel();
                    if (!(await persist(current.current))) return;
                    toast(
                      t(
                        "Assessment saved. Resume whenever you are ready.",
                        "حُفظ التقييم. استأنف عندما تكون مستعداً.",
                      ),
                    );
                    navigate("/dashboard");
                  }}
                >
                  {t("Save and exit", "حفظ وخروج")}
                </Button>
                <Button variant="text" onClick={() => setDiscard(true)}>
                  {t("Discard answers", "تجاهل الإجابات")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {discard && (
        <Modal
          title={t("Discard this assessment draft?", "تجاهل مسودة التقييم؟")}
          onClose={() => setDiscard(false)}
          confirmLabel={t("Discard answers", "تجاهل الإجابات")}
          onConfirm={async () => {
            preparation.cancel();
            await act(repository.discardAssessment());
            navigate("/dashboard");
          }}
        >
          {t(
            "Current draft answers will be removed. Completed learning and previously saved plans remain.",
            "ستُحذف إجابات المسودة الحالية. يبقى التعلم المكتمل والخطط المحفوظة سابقاً.",
          )}
        </Modal>
      )}
      {confirm && (
        <Modal
          title={t("Prepare a new plan version?", "إعداد نسخة جديدة من الخطة؟")}
          onClose={() => setConfirm(false)}
          confirmLabel={t("Prepare new version", "إعداد نسخة جديدة")}
          onConfirm={() => {
            setConfirm(false);
            void preparation.generate(current.current, true);
          }}
        >
          {t(
            "Your current plan stays available until a new valid plan is saved. Completed work is retained.",
            "تبقى خطتك الحالية متاحة حتى حفظ خطة جديدة صالحة. يُحتفظ بالعمل المكتمل.",
          )}
        </Modal>
      )}
    </Page>
  );
}
