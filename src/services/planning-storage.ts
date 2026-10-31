import type {
  AssessmentDraft,
  AssessmentSubmission,
  PlanningData,
} from "../models/index.js";
import { supportedAssessment } from "../models/planning.js";
import { legacyAssessmentQuestions, discoveryQuestions } from "../content/assessment.js";
import { validAnswer, missingAnswers } from "../logic/assessment.js";
import { validatePlanResult } from "../logic/planning.js";
import { courses } from "../content/courses.js";
export const emptyPlanning = (): PlanningData => ({
  schemaVersion: 1,
  submissions: [],
  plans: [],
});
const obj = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function validAnswers(v: unknown, version: string) {
  return (
    obj(v) &&
    Object.entries(v).every(([id, a]) => {
      const q = (version === 'assessment-2' ? discoveryQuestions : legacyAssessmentQuestions).find((q) => q.id === id);
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
    supportedAssessment(v.assessmentVersion) &&
    ["id", "createdAt", "updatedAt", "currentQuestionId"].every(
      (k) => typeof v[k] === "string",
    ) &&
    (v.assessmentVersion==='assessment-2' ? discoveryQuestions : legacyAssessmentQuestions).some((q) => q.id === v.currentQuestionId) &&
    ["intro", "questions", "review"].includes(v.stage) &&
    Number.isInteger(v.revision) &&
    v.revision >= 0 &&
    validAnswers(v.answers, v.assessmentVersion)
  );
}
export function validSubmission(v: unknown): v is AssessmentSubmission {
  return (
    obj(v) &&
    v.schemaVersion === 1 &&
    supportedAssessment(v.assessmentVersion) &&
    ["id", "draftId", "submittedAt"].every((k) => typeof v[k] === "string") &&
    Number.isInteger(v.draftRevision) &&
    v.draftRevision >= 0 &&
    validAnswers(v.answers, v.assessmentVersion) &&
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
