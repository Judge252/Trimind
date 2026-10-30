import type {
  AppData,
  LearnerPreferences,
  LessonProgress,
  QuizAttempt,
  SimulationSession,
  SimulationResult,
  Project,
  Course,
} from "../models";
import { courses } from "../content/courses";
export const STORAGE_KEY = "trimind:phase1:v1";
export const defaults = (): AppData => ({
  version: 1,
  preferences: {
    name: "",
    goal: "explore",
    experience: "new",
    track: "builder",
    language: "en",
    onboarded: false,
  },
  lessons: [],
  attempts: [],
  sessions: {},
  results: [],
  projects: [],
});
export interface Repository {
  read(): Promise<AppData>;
  getCourses(): Promise<Course[]>;
  savePreferences(p: LearnerPreferences): Promise<AppData>;
  completeLesson(p: LessonProgress): Promise<AppData>;
  saveAttempt(a: QuizAttempt): Promise<AppData>;
  saveSession(
    s: SimulationSession,
    result?: SimulationResult,
  ): Promise<AppData>;
  saveProject(p: Project): Promise<AppData>;
  deleteProject(id: string): Promise<AppData>;
  reset(): Promise<AppData>;
}
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const record = (x: unknown): x is Record<string, any> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const strings = (x: unknown) =>
  Array.isArray(x) && x.every((v) => typeof v === "string");
const track = (x: unknown) =>
  ["builder", "founder", "investor"].includes(String(x));
const finite = (x: unknown) => typeof x === "number" && Number.isFinite(x);
export function validData(x: unknown): x is AppData {
  if (!record(x) || x.version !== 1 || !record(x.preferences)) return false;
  const p = x.preferences;
  if (
    typeof p.name !== "string" ||
    !track(p.track) ||
    !["en", "ar"].includes(p.language) ||
    !["explore", "create", "money"].includes(p.goal) ||
    !["new", "some", "practiced"].includes(p.experience) ||
    typeof p.onboarded !== "boolean"
  )
    return false;
  if (
    !Array.isArray(x.lessons) ||
    !x.lessons.every(
      (v) =>
        record(v) &&
        typeof v.completedAt === "string" &&
        courses.some(
          (c) =>
            c.id === v.courseId && c.lessons.some((l) => l.id === v.lessonId),
        ),
    )
  )
    return false;
  if (
    !Array.isArray(x.attempts) ||
    !x.attempts.every(
      (v) =>
        record(v) &&
        typeof v.id === "string" &&
        typeof v.completedAt === "string" &&
        courses.some((c) => c.id === v.courseId) &&
        Array.isArray(v.answers) &&
        v.answers.length === 5 &&
        v.answers.every(
          (a: unknown) =>
            Number.isInteger(a) && Number(a) >= 0 && Number(a) < 3,
        ) &&
        Number.isInteger(v.score) &&
        v.score >= 0 &&
        v.score <= 5 &&
        v.total === 5,
    )
  )
    return false;
  if (
    !Array.isArray(x.projects) ||
    !x.projects.every(
      (v) =>
        record(v) &&
        [
          "id",
          "title",
          "problem",
          "audience",
          "solution",
          "businessModel",
          "updatedAt",
        ].every((k) => typeof v[k] === "string") &&
        track(v.track) &&
        strings(v.features),
    )
  )
    return false;
  if (
    !Array.isArray(x.results) ||
    !x.results.every(
      (v) =>
        record(v) &&
        typeof v.id === "string" &&
        track(v.track) &&
        typeof v.completedAt === "string" &&
        record(v.summary),
    )
  )
    return false;
  if (!record(x.sessions)) return false;
  return Object.entries(x.sessions).every(([k, v]) => {
    if (
      !track(k) ||
      !record(v) ||
      v.track !== k ||
      typeof v.id !== "string" ||
      typeof v.finalized !== "boolean" ||
      !record(v.state)
    )
      return false;
    const s = v.state;
    if (k === "builder")
      return (
        strings(s.features) &&
        s.features.every((id: string) =>
          ["entry", "list", "done", "test", "calendar", "theme"].includes(id),
        ) &&
        ["local", "cloud"].includes(s.technical) &&
        typeof s.evaluated === "boolean"
      );
    if (
      !Number.isInteger(s.round) ||
      s.round < 0 ||
      s.round > 4 ||
      !finite(s.cash) ||
      s.cash < 0 ||
      !Array.isArray(s.history)
    )
      return false;
    if (k === "investor")
      return (
        record(s.holdings) &&
        ["steady", "local", "spark"].every(
          (id) => Number.isInteger(s.holdings[id]) && s.holdings[id] >= 0,
        ) &&
        strings(s.log) &&
        s.history.every(
          (h: unknown) =>
            record(h) && finite(h.round) && finite(h.cash) && finite(h.total),
        )
      );
    return s.history.every(
      (h: unknown) =>
        record(h) &&
        [
          "round",
          "price",
          "marketing",
          "capacity",
          "demand",
          "sold",
          "revenue",
          "costs",
          "profit",
          "cash",
        ].every((key) => finite(h[key])),
    );
  });
}
export class LocalRepository implements Repository {
  private data = defaults();
  private loaded = false;
  status: "persistent" | "unavailable" | "malformed" = "persistent";
  constructor(private storage?: StorageLike) {}
  async read() {
    if (!this.loaded) {
      this.loaded = true;
      try {
        const raw = this.storage?.getItem(STORAGE_KEY);
        if (raw) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
          } catch {
            this.status = "malformed";
          }
          if (validData(parsed)) this.data = parsed;
          else this.status = "malformed";
        }
        if (!this.storage) this.status = "unavailable";
      } catch {
        this.status = "unavailable";
      }
    }
    return structuredClone(this.data);
  }
  private async update(fn: (d: AppData) => void) {
    await this.read();
    const next = structuredClone(this.data);
    fn(next);
    this.data = next;
    try {
      if (!this.storage) throw Error();
      this.storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      this.status = "unavailable";
    }
    return structuredClone(next);
  }
  async getCourses() {
    return courses;
  }
  savePreferences(p: LearnerPreferences) {
    return this.update((d) => {
      d.preferences = p;
    });
  }
  completeLesson(p: LessonProgress) {
    return this.update((d) => {
      if (
        !d.lessons.some(
          (l) => l.courseId === p.courseId && l.lessonId === p.lessonId,
        )
      )
        d.lessons.push(p);
    });
  }
  saveAttempt(a: QuizAttempt) {
    return this.update((d) => {
      if (!d.attempts.some((v) => v.id === a.id)) d.attempts.push(a);
    });
  }
  saveSession(s: SimulationSession, result?: SimulationResult) {
    return this.update((d) => {
      d.sessions[s.track] = s;
      if (result && !d.results.some((r) => r.id === result.id))
        d.results.push(result);
    });
  }
  saveProject(p: Project) {
    return this.update((d) => {
      d.projects = [p, ...d.projects.filter((v) => v.id !== p.id)];
    });
  }
  deleteProject(id: string) {
    return this.update((d) => {
      d.projects = d.projects.filter((p) => p.id !== id);
    });
  }
  async reset() {
    this.data = defaults();
    this.loaded = true;
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      this.status = "unavailable";
    }
    return structuredClone(this.data);
  }
}
let storage: StorageLike | undefined;
try {
  storage = window.localStorage;
} catch {
  /* memory mode */
}
export const repository = new LocalRepository(storage);
