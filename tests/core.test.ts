import { test } from "node:test";
import assert from "node:assert/strict";
import { courses } from "../src/content/courses";
import { scoreQuiz, courseProgress, recommend } from "../src/logic/learning";
import {
  initialInvestor,
  trade,
  advanceInvestor,
  investorTotal,
  initialFounder,
  runFounder,
  initialBuilder,
  evaluateBuilder,
} from "../src/logic/simulations";
import {
  defaults,
  LocalRepository,
  STORAGE_KEY,
} from "../src/services/repository";
import type { StorageLike } from "../src/services/repository";
const memory = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  } satisfies StorageLike;
};
test("content has three coherent bilingual paths, nine lessons and fifteen questions", () => {
  assert.equal(courses.length, 3);
  for (const c of courses) {
    assert.equal(c.lessons.length, 3);
    assert.equal(c.quiz.length, 5);
    for (const l of c.lessons) {
      assert.ok(l.paragraphs.length >= 3);
      for (const p of l.paragraphs) {
        assert.ok(p.en.length > 80);
        assert.ok(p.ar.length > 60);
      }
    }
  }
});
test("scoring is deterministic and complete answers are mandatory", () => {
  for (const c of courses) {
    assert.equal(
      scoreQuiz(
        c.quiz,
        c.quiz.map((q) => q.answer),
      ),
      5,
    );
    assert.equal(
      scoreQuiz(
        c.quiz,
        c.quiz.map((q) => (q.answer + 1) % 3),
      ),
      0,
    );
    assert.throws(() => scoreQuiz(c.quiz, [-1, -1, -1, -1, -1]));
    assert.throws(() => scoreQuiz(c.quiz, [0]));
    assert.throws(() => scoreQuiz(c.quiz, [0, 0, 0, 0, NaN]));
  }
});
test("recommendation follows explicit chosen path", () => {
  const p = defaults().preferences;
  p.track = "investor";
  assert.equal(recommend(courses, p).track, "investor");
});
test("fresh lesson progress is zero and duplicate records do not inflate course progress", () => {
  const c = courses[0];
  assert.equal(courseProgress(c, []), 0);
  const p = { courseId: c.id, lessonId: c.lessons[0].id, completedAt: "now" };
  assert.equal(courseProgress(c, [p, p]), 1);
});
test("buying and selling at same price preserve total value", () => {
  const start = initialInvestor(),
    b = trade(start, "steady", 20, "buy");
  assert.equal(b.cash, 8000);
  assert.equal(b.holdings.steady, 20);
  assert.equal(investorTotal(b), 10000);
  const sold = trade(b, "steady", 20, "sell");
  assert.equal(sold.cash, 10000);
  assert.equal(investorTotal(sold), 10000);
  assert.equal(start.cash, 10000);
});
test("trading rejects negative, fractional, nonfinite and unaffordable quantities and overselling", () => {
  for (const n of [-1, 0, 1.2, NaN, Infinity])
    assert.throws(() => trade(initialInvestor(), "steady", n, "buy"));
  assert.throws(() => trade(initialInvestor(), "steady", 101, "buy"));
  assert.throws(() => trade(initialInvestor(), "steady", 1, "sell"));
  assert.throws(() => trade(initialInvestor(), "unknown", 1, "buy"));
});
test("fixed market sequence accounts for holdings and cash in final recap", () => {
  let s = trade(initialInvestor(), "spark", 50, "buy");
  s = advanceInvestor(s);
  assert.equal(investorTotal(s), 11000);
  s = advanceInvestor(s);
  assert.equal(investorTotal(s), 9000);
  s = advanceInvestor(advanceInvestor(s));
  assert.equal(investorTotal(s), 9600);
  assert.equal(s.history.length, 5);
  assert.equal(s.history.at(-1)?.cash, 5000);
  assert.throws(() => advanceInvestor(s));
  assert.throws(() => trade(s, "spark", 1, "sell"));
});
test("holding only cash through all rounds remains exactly 10,000", () => {
  let s = initialInvestor();
  for (let i = 0; i < 4; i++) s = advanceInvestor(s);
  assert.equal(investorTotal(s), 10000);
});
test("founder includes production of unsold stock, marketing and fixed costs", () => {
  const s = runFounder(initialFounder(), 60, 100, 40),
    r = s.history[0];
  assert.equal(r.demand, 36);
  assert.equal(r.sold, 36);
  assert.equal(r.costs, 1300);
  assert.equal(r.revenue, 2160);
  assert.equal(r.profit, 860);
  assert.equal(s.cash, 3860);
});
test("founder enforces ranges, upfront funding and round limit", () => {
  const s = initialFounder();
  for (const args of [
    [29, 100, 30],
    [101, 100, 30],
    [60, -1, 30],
    [60, 501, 30],
    [60, 100, 0],
    [60, 100, 61],
    [60.5, 100, 30],
    [NaN, 100, 30],
  ])
    assert.throws(() => runFounder(s, ...(args as [number, number, number])));
  assert.throws(() => runFounder({ ...s, cash: 500 }, 60, 100, 30));
  let f = s;
  for (let i = 0; i < 4; i++) f = runFounder(f, 60, 100, 30);
  assert.throws(() => runFounder(f, 60, 100, 30));
  assert.equal(f.cash, 3000 + f.history.reduce((n, r) => n + r.profit, 0));
});
test("founder price and marketing choices change demand and outcome", () => {
  const low = runFounder(initialFounder(), 40, 0, 40),
    high = runFounder(initialFounder(), 80, 0, 40);
  assert.notEqual(low.history[0].demand, high.history[0].demand);
  assert.notEqual(low.cash, high.cash);
});
test("founder can lose funding without making cash negative", () => {
  const first = runFounder(initialFounder(), 100, 0, 60);
  const second = runFounder(first, 100, 0, 40);
  assert.equal(second.cash, 100);
  assert.ok(second.cash < 225);
  assert.throws(() => runFounder(second, 30, 0, 1));
});
test("builder requires complete core within hours and budget", () => {
  assert.throws(() => evaluateBuilder(initialBuilder()));
  const s = {
    ...initialBuilder(),
    features: ["entry", "list", "done", "test"],
  };
  const r = evaluateBuilder(s);
  assert.equal(r.feasible, true);
  assert.equal(r.hours, 18);
  assert.equal(r.cost, 650);
  assert.equal(
    evaluateBuilder({ ...s, features: [...s.features, "calendar"] }).feasible,
    false,
  );
  assert.equal(evaluateBuilder({ ...s, technical: "cloud" }).hours, 24);
  assert.equal(
    evaluateBuilder({ ...s, features: ["entry"] }).missing.length,
    3,
  );
});
test("repository persists language and progress across instances, and deduplicates lesson completion", async () => {
  const storage = memory(),
    repo = new LocalRepository(storage);
  await repo.savePreferences({
    ...defaults().preferences,
    language: "ar",
    track: "founder",
  });
  const l = {
    courseId: courses[0].id,
    lessonId: courses[0].lessons[0].id,
    completedAt: new Date().toISOString(),
  };
  await repo.completeLesson(l);
  await repo.completeLesson(l);
  const refreshed = await new LocalRepository(storage).read();
  assert.equal(refreshed.lessons.length, 1);
  assert.equal(refreshed.preferences.language, "ar");
});
test("quiz attempts and finalisation are idempotent by stable identifiers", async () => {
  const storage = memory(),
    repo = new LocalRepository(storage);
  const a = {
    id: "attempt",
    courseId: courses[0].id,
    score: 5,
    total: 5,
    answers: courses[0].quiz.map((q) => q.answer),
    completedAt: "now",
  };
  await repo.saveAttempt(a);
  await repo.saveAttempt(a);
  const s = {
      id: "session",
      track: "investor" as const,
      state: initialInvestor(),
      finalized: true,
    },
    r = {
      id: "session",
      track: "investor" as const,
      completedAt: "now",
      summary: { total: 10000 },
    };
  await repo.saveSession(s, r);
  await repo.saveSession(s, r);
  const state = await new LocalRepository(storage).read();
  assert.equal(state.attempts.length, 1);
  assert.equal(state.results.length, 1);
});
test("projects create, update, reopen and delete persistently", async () => {
  const storage = memory(),
    r = new LocalRepository(storage);
  const p = {
    id: "p",
    title: "My project",
    track: "builder" as const,
    problem: "P",
    audience: "A",
    solution: "S",
    businessModel: "B",
    features: ["Task entry"],
    updatedAt: "now",
  };
  await r.saveProject(p);
  await r.saveProject({ ...p, title: "Revised" });
  assert.equal(
    (await new LocalRepository(storage).read()).projects[0].title,
    "Revised",
  );
  await r.deleteProject("p");
  assert.equal((await new LocalRepository(storage).read()).projects.length, 0);
});
test("reset removes only app data and leaves unrelated storage intact", async () => {
  const storage = memory();
  storage.setItem("other-app", "keep");
  const r = new LocalRepository(storage);
  await r.savePreferences({ ...defaults().preferences, name: "Demo" });
  await r.reset();
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem("other-app"), "keep");
  assert.equal((await r.read()).preferences.name, "");
});
test("malformed, wrong-schema and unavailable storage fall back without crashing", async () => {
  for (const raw of [
    "{broken",
    JSON.stringify({ version: 99 }),
    JSON.stringify({ ...defaults(), sessions: { investor: { bad: 1 } } }),
    JSON.stringify({ ...defaults(), projects: [{}] }),
  ]) {
    const storage = memory();
    storage.setItem(STORAGE_KEY, raw);
    const r = new LocalRepository(storage);
    assert.deepEqual(await r.read(), defaults());
  }
  const r = new LocalRepository({
    getItem: () => {
      throw Error();
    },
    setItem: () => {
      throw Error();
    },
    removeItem: () => {
      throw Error();
    },
  });
  await r.read();
  await r.savePreferences({ ...defaults().preferences, name: "Session only" });
  assert.equal(r.status, "unavailable");
  assert.equal((await r.read()).preferences.name, "Session only");
  await r.reset();
});
