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
              "Preparing your local demo plan from your answers and the available catalog…",
              "جارٍ إعداد خطتك التجريبية محلياً من إجاباتك والمحتوى المتاح…",
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
            "Preparation cancelled. Your answers and last valid plan are unchanged.",
            "أُلغي الإعداد. لم تتغير إجاباتك أو آخر خطة صالحة.",
          )}
        </Status>
      )}
      {preparation.state === "error" && (
        <Status error>
          {preparation.error === "stale-assessment"
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
                  "The demo plan could not be prepared. Your answers and last valid plan are safe. Retry or edit your answers.",
                  "تعذر إعداد الخطة التجريبية. إجاباتك وآخر خطة صالحة محفوظة. أعد المحاولة أو عدّل إجاباتك.",
                )}
        </Status>
      )}
      {preparation.state === "success" && (
        <Status>
          {t("Your demo plan is ready.", "خطتك التجريبية جاهزة.")}
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
    [confirm, setConfirm] = useState(false),
    [previewFailure, setPreviewFailure] = useState(false);
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
    current.current = next;
    setDraft(next);
    await act(repository.saveAssessment(next));
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
    if (data.planning.plans.length) setConfirm(true);
    else void preparation.generate(current.current, previewFailure);
  };
  const answered = questions.filter((q) => {
    const v = answerValue(draft, q.id);
    return validAnswer(q, v) && v !== "" && (!Array.isArray(v) || v.length > 0);
  }).length;
  return (
    <Page
      eyebrow={t("YOUR STARTING POINT", "نقطة بدايتك")}
      title={t("A plan that starts with your answers.", "خطة تبدأ بإجاباتك.")}
      description={t(
        "A local demo assessment, not a diagnosis. Browse freely at any point.",
        "تقييم تجريبي محلي وليس تشخيصاً. يمكنك التصفح بحرية في أي وقت.",
      )}
    >
      <div className="assessment-layout">
        <aside className="assessment-sidebar">
          <nav aria-label={t("Assessment sections", "أقسام التقييم")}>
            {Object.entries(sections).map(([key, label]) => (
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
            ))}
          </nav>
          <Progress
            value={answered}
            max={questions.length}
            label={t("Answers saved", "الإجابات المحفوظة")}
          />
          <small>
            {t(
              "Your answers stay on this browser. No account information is included.",
              "إجاباتك على هذا المتصفح. لا تتضمن بيانات الحساب.",
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
                  "A deterministic local adapter will prepare a demo plan. Gemini has not analysed your answers. Server-based personalisation is a Phase 2 feature.",
                  "يُعد محوّل محلي بقواعد ثابتة خطة تجريبية. لم يحلل Gemini إجاباتك. التخصيص عبر الخادم ميزة للمرحلة الثانية.",
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
                      : void persist({ ...draft, stage: "intro" })
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
              <div className="actions">
                <Button
                  loading={preparation.state === "preparing"}
                  disabled={missingAnswers(draft).length > 0}
                  onClick={generate}
                >
                  {preparation.state === "error"
                    ? t("Retry plan preparation", "إعادة محاولة إعداد الخطة")
                    : t("Prepare my demo plan", "إعداد خطتي التجريبية")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => move(questions.length - 1)}
                  disabled={preparation.state === "preparing"}
                >
                  {t("Previous", "السابق")}
                </Button>
              </div>
              <details>
                <summary>
                  {t(
                    "Preview service error handling",
                    "معاينة التعامل مع خطأ الخدمة",
                  )}
                </summary>
                <label className="choice">
                  <input
                    type="checkbox"
                    checked={previewFailure}
                    onChange={(e) => setPreviewFailure(e.target.checked)}
                  />
                  {t(
                    "Use an explicit demo failure for this attempt. Existing plans are preserved.",
                    "استخدم إخفاقاً تجريبياً صريحاً لهذه المحاولة. تبقى الخطط الحالية محفوظة.",
                  )}
                </label>
              </details>
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
                      "Answers saved on this browser.",
                      "الإجابات محفوظة على هذا المتصفح.",
                    )}
              </Status>
              <div className="actions">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    preparation.cancel();
                    await act(repository.saveAssessment(current.current));
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
            void preparation.generate(current.current, previewFailure);
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
