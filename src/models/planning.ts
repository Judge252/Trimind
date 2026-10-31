import type { Localized, Track } from "./index";
export const ASSESSMENT_VERSION = "assessment-1";
export type AnswerValue = string | string[];
export interface AssessmentQuestion {
  id: string;
  section: "goals" | "knowledge" | "support";
  kind: "single" | "multi" | "select" | "text" | "scenario";
  title: Localized;
  hint?: Localized;
  options?: { id: string; label: Localized }[];
  required: boolean;
  track?: Track;
  correctOptionId?: string;
  followUpFor?: Track;
}
export interface AssessmentAnswer {
  questionId: string;
  value: AnswerValue;
  updatedAt: string;
}
export interface AssessmentDraft {
  id: string;
  schemaVersion: 1;
  assessmentVersion: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  stage: "intro" | "questions" | "review";
  currentQuestionId: string;
  answers: Record<string, AssessmentAnswer>;
}
export interface AssessmentSubmission {
  id: string;
  schemaVersion: 1;
  assessmentVersion: string;
  draftId: string;
  draftRevision: number;
  submittedAt: string;
  answers: Record<string, AssessmentAnswer>;
}
export interface StartingPoint {
  track: Track;
  correct: number;
  answered: number;
  unknown: number;
  total: number;
  level: "explore" | "review" | "ready";
}
export interface LearnerProfile {
  id: string;
  schemaVersion: 1;
  assessmentVersion: string;
  assessmentId: string;
  createdAt: string;
  goal: string;
  selectedPaths: Track[];
  primaryPath: Track;
  supportingPaths: Track[];
  sessionMinutes: number;
  daysPerWeek: number;
  targetWeeks: number;
  formats: string[];
  connectivity: string;
  confidence: string;
  difficulty: string;
  support: string;
  aspiration: string;
  startingPoints: StartingPoint[];
}
export interface PlanActivity {
  id: string;
  kind: "lesson" | "quiz" | "simulation" | "project";
  track: Track;
  courseId?: string;
  lessonId?: string;
  title: Localized;
  url: string;
  minutes: number;
  presentation: "standard" | "example-first" | "practice-first";
  review: boolean;
  segments: {
    week: number;
    day: number;
    session: number;
    minutes: number;
    part: number;
    parts: number;
  }[];
}
export interface LearningPlan {
  id: string;
  schemaVersion: 1;
  version: number;
  assessmentVersion: string;
  assessmentId: string;
  createdAt: string;
  source: "demo" | "server";
  locale: "en" | "ar";
  primaryPath: Track;
  supportingPaths: Track[];
  activities: PlanActivity[];
  totalMinutes: number;
  scheduledWeeks: number;
  targetWeeks: number;
  sessionMinutes: number;
  daysPerWeek: number;
}
export interface PlanGenerationResult {
  learnerProfile: LearnerProfile;
  learningPlan: LearningPlan;
}
export interface PlanningData {
  schemaVersion: 1;
  draft?: AssessmentDraft;
  submissions: AssessmentSubmission[];
  plans: PlanGenerationResult[];
  activePlanId?: string;
}
