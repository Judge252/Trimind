import type {
  AppData,
  AssessmentDraft,
  AssessmentSubmission,
  Course,
  LearnerPreferences,
  LessonProgress,
  PlanGenerationResult,
  Project,
  QuizAttempt,
  SimulationSession,
  SimulationResult,
} from "../models";
import type { SimulationCommand } from "../models/actions";
import type { Repository } from "./local-repository";
import { api } from "./api";
export class RemoteRepository implements Repository {
  private mutate(body: unknown, id: string = crypto.randomUUID()) {
    return api<AppData>("/api/mutations", { body, id });
  }
  read() {
    return api<AppData>("/api/state");
  }
  async getCourses() {
    return (
      await api<{ courses: Course[] }>("/api/catalog", { publicRead: true })
    ).courses;
  }
  savePreferences(preferences: LearnerPreferences) {
    return this.mutate({ type: "preferences", preferences });
  }
  completeLesson(p: LessonProgress) {
    return this.mutate({
      type: "lesson",
      courseId: p.courseId,
      lessonId: p.lessonId,
    });
  }
  saveAttempt(a: QuizAttempt) {
    return this.mutate(
      { type: "quiz", id: a.id, courseId: a.courseId, answers: a.answers },
      a.id,
    );
  }
  saveSession(_s: SimulationSession, _r?: SimulationResult): Promise<AppData> {
    return Promise.reject(Error("decision-required"));
  }
  simulationAction(command: SimulationCommand, id = crypto.randomUUID()) {
    return this.mutate({ type: "simulation", ...command }, id);
  }
  saveProject(project: Project) {
    return this.mutate({ type: "project", project });
  }
  deleteProject(id: string) {
    return this.mutate({ type: "delete-project", id });
  }
  saveAssessment(draft: AssessmentDraft) {
    return this.mutate({ type: "assessment", draft });
  }
  discardAssessment() {
    return this.mutate({ type: "discard-assessment" });
  }
  saveGeneratedPlan(
    _submission: AssessmentSubmission,
    _result: PlanGenerationResult,
  ) {
    return this.read();
  }
  activatePlan(id: string) {
    return this.mutate({ type: "activate-plan", id });
  }
  reset() {
    return this.mutate({ type: "reset" });
  }
}
