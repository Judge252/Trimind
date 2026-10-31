import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { useApp } from "../app/context";
import { courses } from "../content/courses";
import { tracks } from "../content/scenarios";
import { repository } from "../services/repository";
import { courseProgress, scoreQuiz } from "../logic/learning";
import {
  Button,
  CourseCard,
  Empty,
  Go,
  Page,
  Progress,
  Status,
  TrackPill,
  Tabs,
  Breadcrumb,
} from "../components/ui";
import type { Track, QuizAttempt } from "../models";
export function NotFound() {
  const { t } = useApp();
  return (
    <Page
      title={t("A little off track.", "خرجنا قليلاً عن المسار.")}
      eyebrow="404"
    >
      <Empty
        title={t("This page doesn’t exist", "هذه الصفحة غير موجودة")}
        action={<Go to="/">{t("Back home", "العودة للرئيسية")}</Go>}
      >
        {t(
          "Try the library or return to your learning dashboard.",
          "جرّب المكتبة أو ارجع إلى لوحة التعلم.",
        )}
      </Empty>
    </Page>
  );
}
export function Library() {
  const { t, text } = useApp();
  const [params, setParams] = useSearchParams();
  const value = params.get("track") || "all";
  const filtered = courses.filter((c) => value === "all" || c.track === value);
  return (
    <Page
      eyebrow={t("THE LEARNING LIBRARY", "مكتبة التعلم")}
      title={t("Start curious. Leave capable.", "ابدأ بفضول. واخرج بقدرة.")}
      description={t(
        "Three beginner courses. Practical ideas you can use today.",
        "ثلاث دورات للمبتدئين. أفكار عملية يمكنك استخدامها اليوم.",
      )}
    >
      <Tabs
        value={value}
        onChange={(v) => setParams(v === "all" ? {} : { track: v })}
        label={t("Filter by path", "تصفية حسب المسار")}
        values={[
          { id: "all", label: t("All paths", "كل المسارات") },
          ...(Object.keys(tracks) as Track[]).map((id) => ({
            id,
            label: text(tracks[id].name),
          })),
        ]}
      />
      <div
        role="tabpanel"
        id="tab-panel"
        aria-labelledby={`tab-${value}`}
        className="three-grid"
      >
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title={t("No course on this path", "لا توجد دورة لهذا المسار")}
          action={
            <Button onClick={() => setParams({})}>
              {t("Show all courses", "عرض كل الدورات")}
            </Button>
          }
        >
          {t("Try another path.", "جرّب مساراً آخر.")}
        </Empty>
      )}
    </Page>
  );
}
export function CoursePage() {
  const { courseId } = useParams();
  const { data, t, text } = useApp();
  const c = courses.find((c) => c.id === courseId);
  if (!c) return <NotFound />;
  const count = courseProgress(c, data.lessons),
    next = c.lessons.find(
      (l) =>
        !data.lessons.some((p) => p.courseId === c.id && p.lessonId === l.id),
    );
  return (
    <Page
      title={text(c.title)}
      description={text(c.description)}
      eyebrow={text(tracks[c.track].name)}
    >
      <Breadcrumb
        items={[
          { label: t("Learn", "تعلّم"), to: "/learn" },
          { label: text(c.title) },
        ]}
      />
      <div className="content-sidebar">
        <div>
          <TrackPill track={c.track} />
          <h2>{t("What you’ll take away", "ما ستتعلمه")}</h2>
          <ul className="outcomes">
            {c.outcomes.map((v, i) => (
              <li key={i}>
                <Check size={18} />
                {text(v)}
              </li>
            ))}
          </ul>
          <h2>{t("Your curriculum", "منهجك")}</h2>
          <div className="lesson-list">
            {c.lessons.map((l, i) => (
              <Link
                key={l.id}
                to={`/learn/${c.id}/${l.id}`}
                className="lesson-row"
              >
                <span className="lesson-number">
                  {data.lessons.some(
                    (p) => p.courseId === c.id && p.lessonId === l.id,
                  ) ? (
                    <Check size={18} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>
                  {text(l.title)}
                  <small>
                    {l.minutes} {t("min reading", "دقيقة قراءة")}
                  </small>
                </span>
                <ArrowRight size={18} />
              </Link>
            ))}
            <Link className="lesson-row" to={`/learn/${c.id}/quiz`}>
              <span className="lesson-number">?</span>
              <span>
                {t("Put it together: course quiz", "اختبر ما تعلمته")}
                <small>
                  {c.quiz.length} {t("questions", "أسئلة")}
                </small>
              </span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <aside className="panel">
          <h3>{t("Your next small step", "خطوتك الصغيرة التالية")}</h3>
          <p>
            {t("Beginner · Read, try, reflect", "مبتدئ · اقرأ وجرّب وتأمل")}
          </p>
          <Progress
            value={count}
            max={c.lessons.length}
            label={t("Lessons complete", "الدروس المكتملة")}
          />
          <Go to={`/learn/${c.id}/${next?.id || "quiz"}`}>
            {t(
              count ? "Continue learning" : "Start learning",
              count ? "تابع التعلم" : "ابدأ التعلم",
            )}
          </Go>
        </aside>
      </div>
    </Page>
  );
}
export function LessonPage() {
  const { courseId, lessonId } = useParams();
  const { data, t, text, act, toast } = useApp();
  const [answer, setAnswer] = useState<number | null>(null),
    [checked, setChecked] = useState(false);
  const c = courses.find((c) => c.id === courseId),
    l = c?.lessons.find((l) => l.id === lessonId);
  if (!c || !l) return <NotFound />;
  const idx = c.lessons.indexOf(l),
    done = data.lessons.some((p) => p.courseId === c.id && p.lessonId === l.id);
  return (
    <Page
      title={text(l.title)}
      eyebrow={`${text(tracks[c.track].name)} / ${idx + 1} ${t("of", "من")} ${c.lessons.length}`}
    >
      <Breadcrumb
        items={[
          { label: t("Learn", "تعلّم"), to: "/learn" },
          { label: text(c.title), to: `/learn/${c.id}` },
          { label: text(l.title) },
        ]}
      />
      <div className="content-sidebar">
        <article className="lesson-article">
          <p className="meta">
            {l.minutes} {t("min reading", "دقيقة قراءة")}
          </p>
          {l.paragraphs.map((p, i) => (
            <p key={i}>{text(p)}</p>
          ))}
          <div className="worked-example" id="worked-example">
            <span className="eyebrow">{t("WORKED EXAMPLE", "مثال محلول")}</span>
            <p>{text(l.example)}</p>
          </div>
          <form
            className="panel"
            id="knowledge-check"
            onSubmit={(e) => {
              e.preventDefault();
              setChecked(true);
            }}
          >
            <h2>{t("Pause and try", "توقف وجرّب")}</h2>
            <fieldset className="choices">
              <legend>{text(l.check.question)}</legend>
              {l.check.choices.map((a, i) => (
                <label
                  key={i}
                  className={`choice ${answer === i ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="check"
                    required
                    checked={answer === i}
                    onChange={() => {
                      setAnswer(i);
                      setChecked(false);
                    }}
                  />
                  {text(a)}
                </label>
              ))}
            </fieldset>
            <Button variant="secondary" type="submit">
              {t("Check answer", "تحقق من الإجابة")}
            </Button>
            {checked && (
              <Status>
                {answer === l.check.answer
                  ? t("That’s right. ", "صحيح. ")
                  : t(
                      "Try thinking about it this way. ",
                      "فكّر فيها بهذه الطريقة. ",
                    )}
                {text(l.check.explanation)}
              </Status>
            )}
          </form>
          <div className="actions">
            <Button
              disabled={done}
              onClick={async () => {
                await act(
                  repository.completeLesson({
                    courseId: c.id,
                    lessonId: l.id,
                    completedAt: new Date().toISOString(),
                  }),
                );
                toast(
                  t(
                    "Lesson completed. A good step forward.",
                    "اكتمل الدرس. خطوة جيدة للأمام.",
                  ),
                );
              }}
            >
              {done
                ? t("Lesson completed", "الدرس مكتمل")
                : t("Mark lesson complete", "تحديد الدرس كمكتمل")}
            </Button>
            <Go
              secondary
              to={`/learn/${c.id}/${c.lessons[idx + 1]?.id || "quiz"}`}
            >
              {t(
                idx === 2 ? "Take the quiz" : "Next lesson",
                idx === 2 ? "ابدأ الاختبار" : "الدرس التالي",
              )}
            </Go>
          </div>
          {idx > 0 && (
            <Link
              className="text-link"
              to={`/learn/${c.id}/${c.lessons[idx - 1].id}`}
            >
              {t("Previous lesson", "الدرس السابق")}
            </Link>
          )}
        </article>
        <aside className="panel">
          <h3>{t("In this course", "في هذه الدورة")}</h3>
          {c.lessons.map((v, i) => (
            <Link
              className={`sidebar-lesson ${v.id === l.id ? "current" : ""}`}
              to={`/learn/${c.id}/${v.id}`}
              key={v.id}
            >
              {i + 1}. {text(v.title)}
            </Link>
          ))}
          <Link className="text-link" to={`/learn/${c.id}/quiz`}>
            {t("Course quiz", "اختبار الدورة")}
          </Link>
        </aside>
      </div>
    </Page>
  );
}
export function QuizPage() {
  const { courseId } = useParams();
  const { data, t, text, act } = useApp();
  const c = courses.find((c) => c.id === courseId);
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1)),
    [index, setIndex] = useState(0),
    [result, setResult] = useState<QuizAttempt | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!c) return <NotFound />;
  const submit = async () => {
    if (busy || result) return;
    try {
      const score = scoreQuiz(c.quiz, answers);
      setBusy(true);
      const attempt = {
        id: crypto.randomUUID(),
        courseId: c.id,
        answers,
        score,
        total: c.quiz.length,
        completedAt: new Date().toISOString(),
      };
      await act(repository.saveAttempt(attempt));
      setResult(attempt);
      setError("");
    } catch {
      setError(
        t(
          "Answer every question before submitting.",
          "أجب عن كل الأسئلة قبل الإرسال.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const question = c.quiz[index];
  return (
    <Page
      title={t("Put your knowledge to work.", "طبّق ما تعلمته.")}
      eyebrow={text(c.title)}
    >
      <div className="quiz-container">
        {result ? (
          <>
            <div className="result-header">
              <span className="brand-flower">✳</span>
              <h2>{t("You made it through.", "أكملت الاختبار.")}</h2>
              <strong className="score">
                {result.score}/{result.total}
              </strong>
              <p>
                {t(
                  "Every answer is a chance to learn. Review the reasoning below.",
                  "كل إجابة فرصة للتعلم. راجع التفسيرات أدناه.",
                )}
              </p>
            </div>
            {c.quiz.map((q, i) => (
              <div className="review-row" key={q.id}>
                <b>
                  {i + 1}. {text(q.question)}
                </b>
                <p>
                  {t("Your answer: ", "إجابتك: ")}
                  {text(q.choices[answers[i]])} ·{" "}
                  {answers[i] === q.answer
                    ? t("Correct", "صحيح")
                    : t("Review", "راجع")}
                </p>
                <p>
                  {t("Correct answer: ", "الإجابة الصحيحة: ")}
                  {text(q.choices[q.answer])}. {text(q.explanation)}
                </p>
              </div>
            ))}
            <div className="actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null);
                  setAnswers(Array(5).fill(-1));
                  setIndex(0);
                }}
              >
                {t("Try again", "حاول مجدداً")}
              </Button>
              <Go to={`/practice/${c.track}`}>
                {t("Try the simulator", "جرّب المحاكي")}
              </Go>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (index < 4) {
                if (answers[index] < 0) {
                  setError(t("Choose an answer first.", "اختر إجابة أولاً."));
                  return;
                }
                setIndex(index + 1);
                setError("");
              } else void submit();
            }}
          >
            <Progress
              value={answers.filter((a) => a >= 0).length}
              max={c.quiz.length}
              label={t("Answers selected", "الإجابات المختارة")}
            />
            <p className="eyebrow">
              {t("QUESTION", "السؤال")} {index + 1} / {c.quiz.length}
            </p>
            <fieldset className="choices">
              <legend className="question-title">
                {text(question.question)}
              </legend>
              {question.choices.map((a, i) => (
                <label
                  className={`choice ${answers[index] === i ? "selected" : ""}`}
                  key={i}
                >
                  <input
                    type="radio"
                    name={`q${index}`}
                    checked={answers[index] === i}
                    onChange={() => {
                      setAnswers(answers.map((v, j) => (j === index ? i : v)));
                      setError("");
                    }}
                  />
                  {text(a)}
                </label>
              ))}
            </fieldset>
            {error && <Status error>{error}</Status>}
            <div className="actions">
              {index > 0 && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIndex(index - 1)}
                >
                  {t("Previous", "السابق")}
                </Button>
              )}
              <Button loading={busy} type="submit">
                {index === 4
                  ? t("Submit quiz", "إرسال الاختبار")
                  : t("Next question", "السؤال التالي")}
              </Button>
            </div>
            <p className="meta">
              {t(
                "No time limit. Answers are saved when you submit.",
                "لا حد زمني. تُحفظ الإجابات عند الإرسال.",
              )}
            </p>
          </form>
        )}
        <p className="meta">
          {t(
            "Completed attempts on this browser: ",
            "المحاولات المكتملة على هذا المتصفح: ",
          )}
          {data.attempts.filter((a) => a.courseId === c.id).length}
        </p>
      </div>
    </Page>
  );
}
