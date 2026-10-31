import type {
  AppData,
  AssessmentSubmission,
  Course,
  Language,
  LearningPlan,
  LearnerProfile,
  PlanActivity,
  PlanGenerationResult,
  Track,
} from "../models";
import {
  answerList,
  answerString,
  pathIds,
  scoreAssessment,
  missingAnswers,
} from "./assessment";
import { bi } from "../content/courses";
import { ASSESSMENT_VERSION } from "../models/planning";
export function buildDemoPlan({
  assessment,
  contentCatalog,
  locale,
}: {
  assessment: AssessmentSubmission;
  contentCatalog: Course[];
  locale: Language;
}): PlanGenerationResult {
  if (
    assessment.assessmentVersion !== ASSESSMENT_VERSION ||
    missingAnswers(assessment).length
  )
    throw Error("invalid-assessment");
  const selectedPaths = pathIds.filter((t) =>
    answerList(assessment, "paths").includes(t),
  );
  const goal = answerString(assessment, "goal");
  const wanted = (
    { build: "builder", business: "founder", money: "investor" } as Record<
      string,
      Track
    >
  )[goal];
  const primaryPath = selectedPaths.includes(wanted)
    ? wanted
    : selectedPaths[0];
  const supportingPaths = selectedPaths.filter((t) => t !== primaryPath);
  const sessionMinutes = Number(answerString(assessment, "minutes")),
    daysPerWeek = Number(answerString(assessment, "days")),
    targetWeeks = Number(answerString(assessment, "weeks"));
  const startingPoints = scoreAssessment(assessment),
    formats = answerList(assessment, "formats");
  const profile: LearnerProfile = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    assessmentVersion: ASSESSMENT_VERSION,
    assessmentId: assessment.id,
    createdAt: new Date().toISOString(),
    goal,
    selectedPaths,
    primaryPath,
    supportingPaths,
    sessionMinutes,
    daysPerWeek,
    targetWeeks,
    formats,
    connectivity: answerString(assessment, "connectivity"),
    confidence: answerString(assessment, "confidence"),
    difficulty: answerString(assessment, "difficulty"),
    support: answerString(assessment, "support"),
    aspiration: answerString(assessment, "aspiration"),
    startingPoints,
  };
  const activities: PlanActivity[] = [];
  for (const track of [primaryPath, ...supportingPaths]) {
    const c = contentCatalog.find((c) => c.track === track);
    if (!c) throw Error("catalog-unavailable");
    const ready =
      startingPoints.find((p) => p.track === track)?.level === "ready";
    const presentation =
      profile.difficulty === "example" || formats.includes("examples")
        ? "example-first"
        : formats.includes("practice")
          ? "practice-first"
          : "standard";
    const sim: PlanActivity = {
      id: `simulation:${track}`,
      kind: "simulation",
      track,
      title: bi("Practise the scenario", "تدرّب على السيناريو"),
      url: `/practice/${track}`,
      minutes: track === "builder" ? 20 : 25,
      presentation: "standard",
      review: false,
      segments: [],
    };
    if (ready) activities.push(sim);
    for (const l of c.lessons)
      activities.push({
        id: `lesson:${c.id}:${l.id}`,
        kind: "lesson",
        track,
        courseId: c.id,
        lessonId: l.id,
        title: l.title,
        url: `/learn/${c.id}/${l.id}${presentation === "example-first" ? "#worked-example" : presentation === "practice-first" ? "#knowledge-check" : ""}`,
        minutes: l.minutes,
        presentation,
        review: ready,
        segments: [],
      });
    activities.push({
      id: `quiz:${c.id}`,
      kind: "quiz",
      track,
      courseId: c.id,
      title: bi(
        "Course quiz and answer review",
        "اختبار الدورة ومراجعة الإجابات",
      ),
      url: `/learn/${c.id}/quiz`,
      minutes: 10,
      presentation: "standard",
      review: false,
      segments: [],
    });
    if (!ready) activities.push(sim);
    activities.push({
      id: `project:${track}`,
      kind: "project",
      track,
      title: bi(
        "Create or refine a project draft",
        "أنشئ مسودة مشروع أو طوّرها",
      ),
      url: `/projects?track=${track}`,
      minutes: 20,
      presentation: "standard",
      review: false,
      segments: [],
    });
  }
  // Fill each session up to the learner's budget; an activity may occupy several parts.
  let session = 1,
    used = 0;
  for (const activity of activities) {
    // Keep a short task together. Only tasks longer than a whole session split.
    if (used > 0 && activity.minutes > sessionMinutes - used) {
      session++;
      used = 0;
    }
    let remaining = activity.minutes;
    while (remaining > 0) {
      if (used === sessionMinutes) {
        session++;
        used = 0;
      }
      const minutes = Math.min(sessionMinutes - used, remaining);
      activity.segments.push({
        session,
        week: Math.floor((session - 1) / daysPerWeek) + 1,
        day: ((session - 1) % daysPerWeek) + 1,
        minutes,
        part: 0,
        parts: 0,
      });
      used += minutes;
      remaining -= minutes;
    }
    activity.segments.forEach((s, i) => {
      s.part = i + 1;
      s.parts = activity.segments.length;
    });
  }
  const plan: LearningPlan = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    version: 1,
    assessmentVersion: ASSESSMENT_VERSION,
    assessmentId: assessment.id,
    createdAt: new Date().toISOString(),
    source: "demo",
    locale,
    primaryPath,
    supportingPaths,
    activities,
    totalMinutes: activities.reduce((n, a) => n + a.minutes, 0),
    scheduledWeeks: Math.ceil(session / daysPerWeek),
    targetWeeks,
    sessionMinutes,
    daysPerWeek,
  };
  const result = { learnerProfile: profile, learningPlan: plan };
  if (!validatePlanResult(result, contentCatalog)) throw Error("invalid-plan");
  return result;
}
const obj = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validatePlanResult(
  v: unknown,
  catalog: Course[],
): v is PlanGenerationResult {
  if (!obj(v) || !obj(v.learnerProfile) || !obj(v.learningPlan)) return false;
  const p = v.learningPlan,
    l = v.learnerProfile;
  if (
    p.schemaVersion !== 1 ||
    l.schemaVersion !== 1 ||
    p.assessmentVersion !== ASSESSMENT_VERSION ||
    l.assessmentVersion !== ASSESSMENT_VERSION ||
    !["demo", "server"].includes(p.source) ||
    !["en", "ar"].includes(p.locale) ||
    !Number.isInteger(p.version) ||
    p.version < 1
  )
    return false;
  if (
    ![
      p.id,
      p.assessmentId,
      p.createdAt,
      l.id,
      l.assessmentId,
      l.createdAt,
      l.goal,
      l.confidence,
      l.support,
      l.difficulty,
      l.connectivity,
      l.aspiration,
    ].every((x) => typeof x === "string") ||
    p.assessmentId !== l.assessmentId
  )
    return false;
  if (
    !pathIds.includes(l.primaryPath) ||
    p.primaryPath !== l.primaryPath ||
    !Array.isArray(l.selectedPaths) ||
    !l.selectedPaths.length ||
    !l.selectedPaths.every((t: unknown) => pathIds.includes(t as Track)) ||
    new Set(l.selectedPaths).size !== l.selectedPaths.length ||
    !Array.isArray(l.supportingPaths) ||
    !Array.isArray(p.supportingPaths) ||
    l.supportingPaths.length !== l.selectedPaths.length - 1 ||
    new Set(l.supportingPaths).size !== l.supportingPaths.length ||
    !l.supportingPaths.every(
      (t: unknown) =>
        pathIds.includes(t as Track) &&
        t !== l.primaryPath &&
        l.selectedPaths.includes(t),
    ) ||
    JSON.stringify(p.supportingPaths) !== JSON.stringify(l.supportingPaths) ||
    !l.selectedPaths.includes(l.primaryPath)
  )
    return false;
  if (
    !["build", "business", "money", "explore"].includes(l.goal) ||
    !["low", "middle", "high"].includes(l.confidence) ||
    !["example", "retry", "review"].includes(l.difficulty) ||
    !["guided", "independent", "reflection"].includes(l.support) ||
    !["steady", "limited"].includes(l.connectivity) ||
    !Array.isArray(l.formats) ||
    !l.formats.length ||
    !l.formats.every((x: unknown) =>
      ["reading", "examples", "practice"].includes(String(x)),
    ) ||
    !Array.isArray(l.startingPoints) ||
    l.startingPoints.length !== 3 ||
    !l.startingPoints.every(
      (s: unknown) =>
        obj(s) &&
        pathIds.includes(s.track) &&
        ["explore", "review", "ready"].includes(s.level) &&
        ["correct", "answered", "unknown", "total"].every(
          (k) => Number.isInteger(s[k]) && s[k] >= 0,
        ) &&
        s.correct <= s.answered &&
        [2, 3].includes(s.total) &&
        s.answered + s.unknown === s.total,
    ) ||
    new Set(l.startingPoints.map((s: any) => s.track)).size !== 3
  )
    return false;
  if (
    ![10, 20, 30, 45].includes(p.sessionMinutes) ||
    ![1, 2, 3, 4, 5].includes(p.daysPerWeek) ||
    ![2, 4, 8, 12].includes(p.targetWeeks) ||
    l.sessionMinutes !== p.sessionMinutes ||
    l.daysPerWeek !== p.daysPerWeek ||
    l.targetWeeks !== p.targetWeeks ||
    !Array.isArray(p.activities) ||
    !p.activities.length ||
    p.activities.length > 18 ||
    !p.activities.every(obj) ||
    new Set(p.activities.map((a: any) => a.id)).size !== p.activities.length
  )
    return false;
  const sessions = new Map<number, number>();
  let lastSession = 1;
  for (const a of p.activities) {
    if (
      !obj(a) ||
      !l.selectedPaths.includes(a.track) ||
      !obj(a.title) ||
      typeof a.title.en !== "string" ||
      typeof a.title.ar !== "string" ||
      !Number.isInteger(a.minutes) ||
      a.minutes <= 0 ||
      !["standard", "example-first", "practice-first"].includes(
        a.presentation,
      ) ||
      typeof a.review !== "boolean"
    )
      return false;
    const c = catalog.find((c) => c.id === a.courseId && c.track === a.track);
    let expected = "";
    if (a.kind === "lesson") {
      const lesson = c?.lessons.find((l) => l.id === a.lessonId);
      if (!lesson || a.id !== `lesson:${c!.id}:${lesson.id}`) return false;
      expected = `/learn/${c!.id}/${lesson.id}`;
      if (
        ![
          expected,
          expected + "#worked-example",
          expected + "#knowledge-check",
        ].includes(a.url)
      )
        return false;
    } else if (a.kind === "quiz") {
      if (!c || a.id !== `quiz:${c.id}`) return false;
      expected = `/learn/${c.id}/quiz`;
      if (a.url !== expected) return false;
    } else if (a.kind === "simulation") {
      if (a.id !== `simulation:${a.track}` || a.url !== `/practice/${a.track}`)
        return false;
    } else if (a.kind === "project") {
      if (
        a.id !== `project:${a.track}` ||
        a.url !== `/projects?track=${a.track}`
      )
        return false;
    } else return false;
    if (
      !Array.isArray(a.segments) ||
      !a.segments.length ||
      a.segments.reduce((n: number, s: any) => n + (s?.minutes || 0), 0) !==
        a.minutes
    )
      return false;
    for (let i = 0; i < a.segments.length; i++) {
      const s = a.segments[i];
      if (
        !obj(s) ||
        !Number.isInteger(s.session) ||
        s.session < lastSession ||
        s.session > 500 ||
        !Number.isInteger(s.minutes) ||
        s.minutes <= 0 ||
        s.minutes > p.sessionMinutes ||
        s.week !== Math.floor((s.session - 1) / p.daysPerWeek) + 1 ||
        s.day !== ((s.session - 1) % p.daysPerWeek) + 1 ||
        s.part !== i + 1 ||
        s.parts !== a.segments.length
      )
        return false;
      lastSession = s.session;
      sessions.set(s.session, (sessions.get(s.session) || 0) + s.minutes);
    }
  }
  return (
    [...sessions.values()].every((n) => n <= p.sessionMinutes) &&
    p.totalMinutes ===
      p.activities.reduce((n: number, a: any) => n + a.minutes, 0) &&
    p.scheduledWeeks === Math.ceil(Math.max(...sessions.keys()) / p.daysPerWeek)
  );
}
export function activityComplete(a: PlanActivity, data: AppData): boolean {
  if (a.kind === "lesson")
    return data.lessons.some(
      (p) => p.courseId === a.courseId && p.lessonId === a.lessonId,
    );
  if (a.kind === "quiz")
    return data.attempts.some((p) => p.courseId === a.courseId);
  if (a.kind === "simulation")
    return data.results.some((r) => r.track === a.track);
  return data.projects.some(
    (p) =>
      p.track === a.track &&
      !!p.title.trim() &&
      !!p.problem.trim() &&
      !!p.audience.trim() &&
      !!p.solution.trim(),
  );
}
export const activePlan = (data: AppData) =>
  data.planning.plans.find(
    (p) => p.learningPlan.id === data.planning.activePlanId,
  );
