import { assessmentQuestions } from "../content/assessment";
import { ASSESSMENT_VERSION } from "../models/planning";
import type {
  AssessmentDraft,
  AssessmentQuestion,
  AssessmentSubmission,
  AnswerValue,
  StartingPoint,
  Track,
} from "../models";
export const pathIds: Track[] = ["builder", "founder", "investor"];
export const answerValue = (
  draft: Pick<AssessmentDraft, "answers">,
  id: string,
) => draft.answers[id]?.value;
export const answerString = (
  draft: Pick<AssessmentDraft, "answers">,
  id: string,
) => {
  const v = answerValue(draft, id);
  return typeof v === "string" ? v : "";
};
export const answerList = (
  draft: Pick<AssessmentDraft, "answers">,
  id: string,
) => {
  const v = answerValue(draft, id);
  return Array.isArray(v) ? v : [];
};
export function questionsFor(draft: Pick<AssessmentDraft, "answers">) {
  return assessmentQuestions
    .filter(
      (q) =>
        !q.followUpFor ||
        answerString(draft, `experience-${q.followUpFor}`) === "practiced",
    )
    .sort(
      (a, b) =>
        ["goals", "knowledge", "support"].indexOf(a.section) -
        ["goals", "knowledge", "support"].indexOf(b.section),
    );
}
export function validAnswer(
  q: AssessmentQuestion,
  value: unknown,
): value is AnswerValue {
  if (q.kind === "text")
    return typeof value === "string" && value.length <= 300;
  const ids = q.options?.map((o) => o.id) || [];
  if (q.kind === "multi")
    return (
      Array.isArray(value) &&
      new Set(value).size === value.length &&
      value.every((v) => typeof v === "string" && ids.includes(v))
    );
  return typeof value === "string" && ids.includes(value);
}
export function missingAnswers(draft: Pick<AssessmentDraft, "answers">) {
  return questionsFor(draft).filter((q) => {
    const value = answerValue(draft, q.id);
    return (
      q.required &&
      (!validAnswer(q, value) ||
        value === "" ||
        (Array.isArray(value) && !value.length))
    );
  });
}
export function scoreAssessment(
  draft: Pick<AssessmentDraft, "answers">,
): StartingPoint[] {
  return pathIds.map((track) => {
    const questions = questionsFor(draft).filter(
      (q) => q.section === "knowledge" && q.track === track,
    );
    const answered = questions.filter((q) => {
      const v = answerValue(draft, q.id);
      return validAnswer(q, v) && v !== "unknown";
    });
    const correct = answered.filter(
      (q) => answerValue(draft, q.id) === q.correctOptionId,
    ).length;
    const unknown = questions.length - answered.length;
    return {
      track,
      correct,
      answered: answered.length,
      unknown,
      total: questions.length,
      level:
        unknown === 0 &&
        answered.length >= 2 &&
        correct / answered.length >= 0.66
          ? "ready"
          : answered.length === 0
            ? "explore"
            : "review",
    };
  });
}
export function newAssessment(): AssessmentDraft {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    assessmentVersion: ASSESSMENT_VERSION,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    stage: "intro",
    currentQuestionId: "goal",
    answers: {},
  };
}
export function setAssessmentAnswer(
  draft: AssessmentDraft,
  id: string,
  value: AnswerValue,
): AssessmentDraft {
  const question = assessmentQuestions.find((q) => q.id === id);
  if (!question || !validAnswer(question, value)) throw Error("invalid-answer");
  const now = new Date().toISOString();
  return {
    ...draft,
    revision: draft.revision + 1,
    updatedAt: now,
    answers: {
      ...draft.answers,
      [id]: { questionId: id, value, updatedAt: now },
    },
  };
}
export function submitAssessment(draft: AssessmentDraft): AssessmentSubmission {
  if (missingAnswers(draft).length) throw Error("incomplete-assessment");
  const visibleIds = new Set(questionsFor(draft).map((q) => q.id));
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    assessmentVersion: ASSESSMENT_VERSION,
    draftId: draft.id,
    draftRevision: draft.revision,
    submittedAt: new Date().toISOString(),
    answers: Object.fromEntries(
      Object.entries(draft.answers).filter(([id]) => visibleIds.has(id)),
    ),
  };
}
