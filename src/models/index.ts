export type Language = "en" | "ar";
export type Localized = { en: string; ar: string };
export type Track = "builder" | "founder" | "investor";
export type Goal = "explore" | "create" | "money";
export type Experience = "new" | "some" | "practiced";
export interface LearnerPreferences {
  name: string;
  goal: Goal;
  experience: Experience;
  track: Track;
  language: Language;
  onboarded: boolean;
}
export interface Lesson {
  id: string;
  title: Localized;
  minutes: number;
  paragraphs: Localized[];
  example: Localized;
  check: {
    question: Localized;
    choices: Localized[];
    answer: number;
    explanation: Localized;
  };
}
export interface QuizQuestion {
  id: string;
  question: Localized;
  choices: Localized[];
  answer: number;
  explanation: Localized;
}
export interface Course {
  id: string;
  track: Track;
  title: Localized;
  description: Localized;
  outcomes: Localized[];
  lessons: Lesson[];
  quiz: QuizQuestion[];
}
export interface QuizAttempt {
  id: string;
  courseId: string;
  answers: number[];
  score: number;
  total: number;
  completedAt: string;
}
export interface LessonProgress {
  courseId: string;
  lessonId: string;
  completedAt: string;
}
export interface SimulationResult {
  id: string;
  track: Track;
  completedAt: string;
  summary: Record<string, number | string>;
}
export interface InvestorState {
  round: number;
  cash: number;
  holdings: Record<string, number>;
  history: { round: number; cash: number; total: number }[];
  log: string[];
}
export interface FounderRound {
  round: number;
  price: number;
  marketing: number;
  capacity: number;
  demand: number;
  sold: number;
  revenue: number;
  costs: number;
  profit: number;
  cash: number;
}
export interface FounderState {
  round: number;
  cash: number;
  history: FounderRound[];
}
export interface BuilderState {
  features: string[];
  technical: "local" | "cloud";
  evaluated: boolean;
}
export interface SimulationSession {
  id: string;
  track: Track;
  state: InvestorState | FounderState | BuilderState;
  finalized: boolean;
}
export interface Project {
  id: string;
  title: string;
  track: Track;
  problem: string;
  audience: string;
  solution: string;
  businessModel: string;
  features: string[];
  updatedAt: string;
}
export interface AppData {
  version: 1;
  preferences: LearnerPreferences;
  lessons: LessonProgress[];
  attempts: QuizAttempt[];
  sessions: Partial<Record<Track, SimulationSession>>;
  results: SimulationResult[];
  projects: Project[];
  planning: import("./planning").PlanningData;
}
export type {
  AssessmentQuestion,
  AssessmentAnswer,
  AssessmentDraft,
  AssessmentSubmission,
  LearnerProfile,
  LearningPlan,
  PlanActivity,
  PlanGenerationResult,
  PlanningData,
  AnswerValue,
  StartingPoint,
} from "./planning";
