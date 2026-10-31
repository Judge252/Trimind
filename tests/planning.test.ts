import { test } from "node:test";
import assert from "node:assert/strict";
import { assessmentQuestions } from "../src/content/assessment";
import { courses } from "../src/content/courses";
import {
  newAssessment,
  setAssessmentAnswer,
  questionsFor,
  missingAnswers,
  scoreAssessment,
  submitAssessment,
} from "../src/logic/assessment";
import {
  buildDemoPlan,
  validatePlanResult,
  activityComplete,
} from "../src/logic/planning";
import { createDemoPlanningService } from "./fixtures/demo-planning";
import {
  LocalRepository,
  defaults,
  STORAGE_KEY,
} from "../src/services/repository";
import {
  validateAccount,
  intendedDestination,
  authService,
} from "../src/services/auth";
import type { AnswerValue, AssessmentDraft } from "../src/models";
const storage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) || null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
};
function draft(
  patch: Record<string, AnswerValue> = {},
  knowledge: "unknown" | "correct" = "unknown",
) {
  let d = newAssessment("assessment-1");
  const values: Record<string, AnswerValue> = {
    goal: "build",
    paths: ["builder"],
    "experience-builder": "new",
    "experience-founder": "new",
    "experience-investor": "new",
    minutes: "10",
    days: "2",
    weeks: "4",
    formats: ["reading"],
    aspiration: "A study tool",
    connectivity: "steady",
    confidence: "low",
    difficulty: "review",
    support: "guided",
    ...patch,
  };
  for (const [id, value] of Object.entries(values))
    d = setAssessmentAnswer(d, id, value);
  for (const q of questionsFor(d).filter((q) => q.section === "knowledge"))
    d = setAssessmentAnswer(
      d,
      q.id,
      knowledge === "correct" ? q.correctOptionId! : "unknown",
    );
  return d;
}
const generate = (d: AssessmentDraft) =>
  buildDemoPlan({
    assessment: submitAssessment(d),
    contentCatalog: courses,
    locale: "en",
  });
test("question bank contains 20 core bilingual questions with experience-based follow-ups", () => {
  assert.equal(questionsFor(newAssessment("assessment-1")).length, 20);
  const d = draft({ "experience-builder": "practiced" });
  assert.equal(questionsFor(d).length, 21);
  assert.equal(
    questionsFor(d).filter(
      (q) => q.section === "knowledge" && q.track === "builder",
    ).length,
    3,
  );
  for (const q of assessmentQuestions) {
    assert.ok(q.title.en && q.title.ar);
    assert.equal(q.section === "knowledge", !!q.correctOptionId);
  }
});
test("required preferences validate and empty multi-select is resumable, not submittable", () => {
  let d = newAssessment("assessment-1");
  assert.ok(missingAnswers(d).length);
  assert.throws(() => submitAssessment(d));
  d = setAssessmentAnswer(d, "paths", []);
  assert.ok(missingAnswers(d).some((q) => q.id === "paths"));
  assert.throws(() => setAssessmentAnswer(d, "paths", ["invalid"]));
  assert.throws(() => setAssessmentAnswer(d, "aspiration", "a".repeat(301)));
  assert.throws(() => setAssessmentAnswer(d, "email", "private"));
  assert.equal(missingAnswers(draft()).length, 0);
});
test("knowledge unknown/skipped does not imply proficiency or score interests", () => {
  const d = draft();
  for (const s of scoreAssessment(d)) {
    assert.equal(s.level, "explore");
    assert.equal(s.answered, 0);
    assert.equal(s.correct, 0);
  }
  const correct = draft({}, "correct");
  assert.ok(scoreAssessment(correct).every((s) => s.level === "ready"));
  const interest = setAssessmentAnswer(correct, "goal", "money");
  assert.deepEqual(scoreAssessment(interest), scoreAssessment(correct));
  const partial = setAssessmentAnswer(d, "builder-task", "test");
  assert.equal(scoreAssessment(partial)[0].level, "review");
  assert.equal(scoreAssessment(partial)[0].answered, 1);
});
test("no hidden harder answer contributes after experience is changed", () => {
  let d = draft({ "experience-builder": "practiced" }, "correct");
  assert.equal(scoreAssessment(d)[0].total, 3);
  d = setAssessmentAnswer(d, "experience-builder", "new");
  assert.equal(scoreAssessment(d)[0].total, 2);
  assert.ok(!submitAssessment(d).answers["builder-followup"]);
});
test("different interests and knowledge change track priority, ordering and presentation", () => {
  const b = generate(
    draft({ paths: ["builder", "founder"], formats: ["examples"] }),
  );
  const f = generate(
    draft(
      {
        paths: ["builder", "founder"],
        goal: "business",
        formats: ["practice"],
      },
      "correct",
    ),
  );
  assert.equal(b.learningPlan.primaryPath, "builder");
  assert.equal(f.learningPlan.primaryPath, "founder");
  assert.equal(b.learningPlan.activities[0].kind, "lesson");
  assert.equal(f.learningPlan.activities[0].kind, "simulation");
  assert.ok(b.learningPlan.activities[0].url.endsWith("#worked-example"));
  assert.ok(
    f.learningPlan.activities
      .filter((a) => a.kind === "lesson")
      .every((a) => a.review && a.url.endsWith("#knowledge-check")),
  );
  assert.equal(b.learningPlan.activities.length, 12);
});
test("schedule splits long tasks and never exceeds minutes or days in a week", () => {
  const slow = generate(
    draft({
      minutes: "10",
      days: "1",
      paths: ["builder", "founder", "investor"],
    }),
  ).learningPlan;
  const fast = generate(
    draft({
      minutes: "45",
      days: "5",
      paths: ["builder", "founder", "investor"],
    }),
  ).learningPlan;
  assert.ok(slow.scheduledWeeks > fast.scheduledWeeks);
  assert.ok(slow.activities.some((a) => a.segments.length > 1));
  const sums = new Map<number, number>();
  for (const a of slow.activities)
    for (const s of a.segments) {
      assert.ok(s.day <= slow.daysPerWeek);
      sums.set(s.session, (sums.get(s.session) || 0) + s.minutes);
    }
  assert.ok([...sums.values()].every((v) => v <= 10));
  assert.equal(
    [...sums.values()].reduce((n, v) => n + v, 0),
    slow.totalMinutes,
  );
  assert.ok(slow.scheduledWeeks > slow.targetWeeks);
});
test("every generated route references actual catalog content; invalid output is rejected", () => {
  const result = generate(draft({ paths: ["builder", "founder", "investor"] }));
  assert.ok(validatePlanResult(result, courses));
  for (const corrupt of [
    () => {
      result.learningPlan.activities[0].url = "/learn/missing/nope";
    },
    () => {
      result.learningPlan.activities[0].segments[0].minutes = 999;
    },
    () => {
      result.learningPlan.activities[0].id = "unknown";
    },
    () => {
      result.learningPlan.activities[0] = null as any;
    },
    () => {
      result.learnerProfile.supportingPaths = ["missing"] as any;
      result.learningPlan.supportingPaths = ["missing"] as any;
    },
    () => {
      result.learnerProfile.startingPoints[0] = null as any;
    },
  ]) {
    const copy = structuredClone(result);
    corrupt();
    assert.equal(validatePlanResult(result, courses), false);
    Object.assign(result, copy);
  }
  assert.throws(() =>
    buildDemoPlan({
      assessment: submitAssessment(draft()),
      contentCatalog: [],
      locale: "ar",
    }),
  );
});
test("legacy version-one storage migrates without losing learning or unrelated storage", async () => {
  const s = storage(),
    old = defaults();
  delete (old as any).planning;
  old.lessons = [
    {
      courseId: courses[0].id,
      lessonId: courses[0].lessons[0].id,
      completedAt: "now",
    },
  ];
  s.setItem(STORAGE_KEY, JSON.stringify(old));
  s.setItem("other-app", "keep");
  const r = new LocalRepository(s);
  const data = await r.read();
  assert.equal(data.lessons.length, 1);
  assert.deepEqual(data.planning.plans, []);
  await r.saveAssessment(draft());
  const refreshed = await new LocalRepository(s).read();
  assert.equal(refreshed.planning.draft?.answers.goal.value, "build");
  assert.equal(refreshed.lessons.length, 1);
  assert.equal(s.getItem("other-app"), "keep");
});
test("draft revision and answer persistence survive locale changes", async () => {
  const s = storage(),
    r = new LocalRepository(s),
    d = draft();
  await r.saveAssessment(d);
  await r.savePreferences({ ...defaults().preferences, language: "ar" });
  const refreshed = await new LocalRepository(s).read();
  assert.deepEqual(refreshed.planning.draft, d);
  assert.equal(refreshed.preferences.language, "ar");
});
test("plan versions and idempotent publication retain completed work", async () => {
  const s = storage(),
    r = new LocalRepository(s),
    d = draft();
  await r.saveAssessment(d);
  const sub = submitAssessment(d);
  const result = buildDemoPlan({
    assessment: sub,
    contentCatalog: courses,
    locale: "en",
  });
  await r.saveGeneratedPlan(sub, result);
  await r.saveGeneratedPlan(sub, result);
  assert.equal((await r.read()).planning.plans.length, 1);
  const lesson = result.learningPlan.activities.find(
    (a) => a.kind === "lesson",
  )!;
  await r.completeLesson({
    courseId: lesson.courseId!,
    lessonId: lesson.lessonId!,
    completedAt: "now",
  });
  const second = submitAssessment(d);
  await r.saveGeneratedPlan(
    second,
    buildDemoPlan({
      assessment: second,
      contentCatalog: courses,
      locale: "ar",
    }),
  );
  const data = await new LocalRepository(s).read();
  assert.equal(data.planning.plans.length, 2);
  assert.equal(data.planning.plans[1].learningPlan.version, 2);
  assert.equal(data.lessons.length, 1);
  assert.equal(activityComplete(lesson, data), true);
  await r.activatePlan(result.learningPlan.id);
  assert.equal((await r.read()).planning.activePlanId, result.learningPlan.id);
});
test("stale responses cannot overwrite a newer assessment or the last plan", async () => {
  const r = new LocalRepository(storage()),
    d = draft();
  await r.saveAssessment(d);
  const sub = submitAssessment(d),
    result = buildDemoPlan({
      assessment: sub,
      contentCatalog: courses,
      locale: "en",
    });
  await r.saveGeneratedPlan(sub, result);
  await r.saveAssessment(setAssessmentAnswer(d, "goal", "money"));
  await assert.rejects(r.saveGeneratedPlan(sub, result), /stale-assessment/);
  assert.equal((await r.read()).planning.activePlanId, result.learningPlan.id);
});
test("planning failure and cancellation retain last valid plan and resumable answers", async () => {
  const r = new LocalRepository(storage()),
    d = draft();
  await r.saveAssessment(d);
  const sub = submitAssessment(d),
    request = {
      assessment: sub,
      contentCatalog: courses,
      locale: "en" as const,
    };
  const result = await createDemoPlanningService().generatePlan(request);
  await r.saveGeneratedPlan(sub, result);
  const failed = createDemoPlanningService(() => {
    throw Error("unavailable");
  });
  await assert.rejects(failed.generatePlan(request));
  const abort = new AbortController();
  const pending = createDemoPlanningService().generatePlan(request, {
    signal: abort.signal,
  });
  abort.abort();
  await assert.rejects(pending, /cancelled/);
  assert.equal((await r.read()).planning.activePlanId, result.learningPlan.id);
  assert.deepEqual((await r.read()).planning.draft, d);
});
test("invalid stored plans are quarantined while valid core progress is retained", async () => {
  const s = storage(),
    data = defaults();
  data.preferences.name = "Keep";
  (data.planning.plans as any[]).push({ learningPlan: { id: "bad" } });
  s.setItem(STORAGE_KEY, JSON.stringify(data));
  const read = await new LocalRepository(s).read();
  assert.equal(read.preferences.name, "Keep");
  assert.deepEqual(read.planning.plans, []);
});
test("reset includes planning data and retains unrelated apps", async () => {
  const s = storage(),
    r = new LocalRepository(s);
  s.setItem("other", "keep");
  await r.saveAssessment(draft());
  await r.reset();
  assert.equal(s.getItem(STORAGE_KEY), null);
  assert.equal(s.getItem("other"), "keep");
  assert.deepEqual((await r.read()).planning, {
    schemaVersion: 1,
    submissions: [],
    plans: [],
  });
});
test("account validation and destination guards never imply authentication", async () => {
  const fields = {
    name: "Learner",
    email: "judge@example.test",
    password: "placeholder",
    confirmation: "placeholder",
  };
  assert.deepEqual(validateAccount("signup", fields), {});
  assert.ok(
    validateAccount("signup", { ...fields, confirmation: "different" })
      .confirmation,
  );
  assert.ok(validateAccount("login", { ...fields, email: "bad" }).email);
  assert.ok(
    validateAccount("reset", { ...fields, password: "short" }).password,
  );
  assert.equal(intendedDestination("https://elsewhere.test"), "/assessment");
  assert.equal(intendedDestination("//elsewhere.test"), "/assessment");
  assert.equal(intendedDestination("/my-plan"), "/my-plan");
  await assert.rejects(
    authService.submit({
      kind: "recovery",
      email: fields.email,
      returnTo: "/my-plan",
    }),
    /service-unconfigured/,
  );
});
