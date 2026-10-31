import type {
  AssessmentDraft,
  AssessmentSubmission,
  PlanningData,
} from "../models";
import { ASSESSMENT_VERSION } from "../models/planning";
import { assessmentQuestions } from "../content/assessment";
import { validAnswer, missingAnswers } from "../logic/assessment";
import { validatePlanResult } from "../logic/planning";
import { courses } from "../content/courses";
export const emptyPlanning = (): PlanningData => ({
  schemaVersion: 1,
  submissions: [],
  plans: [],
});
const obj = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function validAnswers(v: unknown) {
  return (
    obj(v) &&
    Object.entries(v).every(([id, a]) => {
      const q = assessmentQuestions.find((q) => q.id === id);
      return (
        q &&
        obj(a) &&
        a.questionId === id &&
        typeof a.updatedAt === "string" &&
        validAnswer(q, a.value)
      );
    })
  );
}
export function validDraft(v: unknown): v is AssessmentDraft {
  return (
    obj(v) &&
    v.schemaVersion === 1 &&
    v.assessmentVersion === ASSESSMENT_VERSION &&
    ["id", "createdAt", "updatedAt", "currentQuestionId"].every(
      (k) => typeof v[k] === "string",
    ) &&
    assessmentQuestions.some((q) => q.id === v.currentQuestionId) &&
    ["intro", "questions", "review"].includes(v.stage) &&
    Number.isInteger(v.revision) &&
    v.revision >= 0 &&
    validAnswers(v.answers)
  );
}
export function validSubmission(v: unknown): v is AssessmentSubmission {
  return (
    obj(v) &&
    v.schemaVersion === 1 &&
    v.assessmentVersion === ASSESSMENT_VERSION &&
    ["id", "draftId", "submittedAt"].every((k) => typeof v[k] === "string") &&
    Number.isInteger(v.draftRevision) &&
    v.draftRevision >= 0 &&
    validAnswers(v.answers) &&
    missingAnswers(v as AssessmentSubmission).length === 0
  );
}
export function hydratePlanning(v: unknown): PlanningData {
  if (!obj(v) || v.schemaVersion !== 1) return emptyPlanning();
  const submissions = Array.isArray(v.submissions)
    ? v.submissions.filter(validSubmission)
    : [];
  const plans = Array.isArray(v.plans)
    ? v.plans.filter(
        (p) =>
          validatePlanResult(p, courses) &&
          submissions.some((s) => s.id === p.learningPlan.assessmentId),
      )
    : [];
  return {
    schemaVersion: 1,
    ...(validDraft(v.draft) ? { draft: v.draft } : {}),
    submissions,
    plans,
    activePlanId: plans.some((p) => p.learningPlan.id === v.activePlanId)
      ? v.activePlanId
      : plans.at(-1)?.learningPlan.id,
  };
}
