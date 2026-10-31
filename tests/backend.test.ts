import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { Store } from "../server/store";
import type { Database, Sql } from "../server/db";
import { createApi } from "../server/http";
import { Generations } from "../server/generations";
import { aiRequest, compileRecommendation, callModel } from "../server/ai";
import {
  newAssessment,
  setAssessmentAnswer,
  questionsFor,
  submitAssessment,
} from "../src/logic/assessment";
import { courses } from "../src/content/courses";
import { defaults } from "../src/services/local-repository";
import { AccountBoundary } from "../src/services/account-boundary";
const pg = new PGlite();
let queue: Promise<unknown> = Promise.resolve();
const database: Database = {
  transaction(user, fn) {
    const run = queue.then(async () => {
      await pg.exec("begin; set local role trimind_api;");
      try {
        await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [
          user,
        ]);
        const out = await fn(pg as unknown as Sql);
        await pg.exec("commit");
        return out;
      } catch (e) {
        await pg.exec("rollback");
        throw e;
      }
    });
    queue = run.catch(() => {});
    return run;
  },
  async health() {
    return true;
  },
};
const store = new Store(database);
const fresh = async () => {
  const id = crypto.randomUUID();
  await pg.query("insert into auth.users(id) values($1)", [id]);
  return id;
};
before(async () => {
  await pg.exec(
    "create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;",
  );
  await pg.exec(
    await fs.readFile("supabase/migrations/202610310001_core.sql", "utf8"),
  );
  await pg.exec('create table public.trimind_migrations(version text primary key)');
  await pg.exec(await fs.readFile('supabase/migrations/202610310002_catalog_permissions.sql','utf8'));
});
after(async () => {
  await pg.close();
});
const id = () => crypto.randomUUID();
test("account change and logout invalidate stale in-memory responses, including a later return to the same user", () => {
  const boundary = new AccountBoundary();
  boundary.switchTo("user-a");
  const a = boundary.scope;
  boundary.switchTo("user-b");
  assert.throws(() => boundary.assertCurrent(a), /account-changed/);
  const b = boundary.scope;
  boundary.switchTo(null);
  assert.throws(() => boundary.assertCurrent(b));
  boundary.switchTo("user-a");
  assert.throws(() => boundary.assertCurrent(a));
});
function assessment() {
  let d = newAssessment("assessment-1");
  const values: Record<string, string | string[]> = {
    goal: "build",
    paths: ["builder"],
    "experience-builder": "new",
    "experience-founder": "new",
    "experience-investor": "new",
    minutes: "10",
    days: "2",
    weeks: "4",
    formats: ["examples"],
    aspiration: "Private Person private@example.test",
    connectivity: "steady",
    confidence: "low",
    difficulty: "example",
    support: "guided",
  };
  for (const [k, v] of Object.entries(values)) d = setAssessmentAnswer(d, k, v);
  for (const q of questionsFor(d).filter((q) => q.section === "knowledge"))
    d = setAssessmentAnswer(d, q.id, "unknown");
  return d;
}
function output(a: ReturnType<typeof submitAssessment>) {
  const { base } = aiRequest(a, "en");
  return {
    result: compileRecommendation(base, {
      primaryPath: base.learningPlan.primaryPath,
      activityOrder: base.learningPlan.activities.map((a) => a.id),
      summary: {
        en: "Build a small useful tool through short practical sessions.",
        ar: "ابنِ أداة صغيرة مفيدة عبر جلسات عملية قصيرة.",
      },
      reasons: [
        {
          en: "Your selected goal starts with Builder skills.",
          ar: "يبدأ هدفك المختار بمهارات المطوّر.",
        },
        {
          en: "Short sessions fit the available weekly time.",
          ar: "تناسب الجلسات القصيرة الوقت الأسبوعي المتاح.",
        },
      ],
    }),
    model: "test-fixture",
    promptTokens: 100,
    completionTokens: 100,
    cost: 0,
    latencyMs: 1,
    estimate: 0,
  };
}
test("real PostgreSQL migration applies RLS and authenticated clients cannot forge server records", async () => {
  const a = await fresh(),
    b = await fresh();
  await store.mutate(a, id(), {
    type: "lesson",
    courseId: courses[0].id,
    lessonId: courses[0].lessons[0].id,
  });
  await store.mutate(b, id(), {
    type: "lesson",
    courseId: courses[1].id,
    lessonId: courses[1].lessons[0].id,
  });
  await pg.exec("begin;set local role authenticated;");
  await pg.query("select set_config('request.jwt.claim.sub',$1,true)", [a]);
  const own = await pg.query<any>("select user_id from lesson_completions");
  assert.equal(own.rows.length, 1);
  assert.equal(own.rows[0].user_id, a);
  await assert.rejects(
    pg.query(
      "insert into lesson_completions(user_id,course_id,lesson_id) values($1,$2,$3)",
      [a, courses[0].id, courses[0].lessons[1].id],
    ),
  );
  await pg.exec("rollback");
  await assert.rejects(
    database.transaction(a, (db) =>
      db.query("insert into learner_preferences(user_id,data) values($1,$2)", [
        b,
        JSON.stringify(defaults().preferences),
      ]),
    ),
  );
});
test("anonymous API requests, forged IDs and hostile origins are rejected", async () => {
  const user = await fresh(),
    app = createApi({
      store,
      origin: "http://127.0.0.1",
      verifier: {
        async verify(token) {
          if (token !== "test-token") throw Error();
          return { id: user };
        },
      },
    });
  await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
  const port = (app.address() as any).port,
    url = `http://127.0.0.1:${port}`;
  try {
    assert.equal((await fetch(url + "/api/state")).status, 401);
    assert.equal(
      (
        await fetch(url + "/api/state", {
          headers: { Authorization: "Bearer invalid" },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await fetch(url + "/api/state", {
          headers: {
            Authorization: "Bearer test-token",
            Origin: "https://hostile.test",
          },
        })
      ).status,
      403,
    );
    const r = await fetch(url + "/api/mutations", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
        "Idempotency-Key": id(),
      },
      body: JSON.stringify({
        type: "lesson",
        user_id: id(),
        courseId: courses[0].id,
        lessonId: "requirements",
      }),
    });
    assert.equal(r.status, 422);
    assert.equal((await fetch(url + "/api/catalog")).status, 200);
  } finally {
    app.closeAllConnections();
    await new Promise<void>((r) => app.close(() => r()));
  }
});
test("server recalculates quiz scores and mutation idempotency rejects body changes", async () => {
  const user = await fresh(),
    attempt = id(),
    request = id();
  const body = {
    type: "quiz",
    id: attempt,
    courseId: courses[0].id,
    answers: courses[0].quiz.map((q) => q.answer),
  };
  await store.mutate(user, request, body);
  await store.mutate(user, request, body);
  const state = await store.read(user);
  assert.equal(state.attempts.length, 1);
  assert.equal(state.attempts[0].score, 5);
  await assert.rejects(
    store.mutate(user, request, { ...body, answers: [0, 0, 0, 0, 0] }),
  );
  await assert.rejects(store.mutate(user, id(), { ...body, score: 999 }));
});
test("assessment navigation accepts unchanged answer revisions after JSONB canonicalisation and rejects stale replacement", async () => {
  const user = await fresh(),
    draft = assessment();
  await store.mutate(user, id(), { type: "assessment", draft });
  await store.mutate(user, id(), {
    type: "assessment",
    draft: { ...draft, stage: "review" },
  });
  const rekeyed = {
    ...draft,
    answers: Object.fromEntries(Object.entries(draft.answers).reverse()),
  };
  await store.mutate(user, id(), { type: "assessment", draft: rekeyed });
  await assert.rejects(
    store.mutate(user, id(), {
      type: "assessment",
      draft: { ...draft, id: id() },
    }),
    /stale-assessment/,
  );
  assert.equal((await store.read(user)).planning.draft?.id, draft.id);
});
test("server simulations account for trades, cash and holdings without accepting client totals", async () => {
  const user = await fresh(),
    sessionId = id();
  let state = await store.mutate(user, id(), {
    type: "simulation",
    track: "investor",
    sessionId,
    expectedRevision: 0,
    action: { type: "trade", assetId: "steady", quantity: 20, side: "buy" },
  });
  assert.equal((state.sessions.investor!.state as any).cash, 8000);
  for (let r = 1; r <= 4; r++)
    state = await store.mutate(user, id(), {
      type: "simulation",
      track: "investor",
      sessionId,
      expectedRevision: r,
      action: { type: "advance" },
    });
  assert.equal(state.results.length, 1);
  assert.equal(state.results[0].summary.total, 10060);
  await assert.rejects(
    store.mutate(user, id(), {
      type: "simulation",
      track: "investor",
      sessionId,
      expectedRevision: 5,
      action: {
        type: "trade",
        cash: 100000,
        assetId: "steady",
        quantity: 1,
        side: "buy",
      },
    }),
  );
});
test("duplicate and concurrent simulation advances cannot advance or finalize twice", async () => {
  const user = await fresh(),
    sessionId = id(),
    request = id(),
    body = {
      type: "simulation",
      track: "investor",
      sessionId,
      expectedRevision: 0,
      action: { type: "advance" },
    };
  await Promise.all([
    store.mutate(user, request, body),
    store.mutate(user, request, body),
  ]);
  assert.equal((await store.read(user)).sessions.investor?.revision, 1);
  const results = await Promise.allSettled([
    store.mutate(user, id(), { ...body, expectedRevision: 1 }),
    store.mutate(user, id(), { ...body, expectedRevision: 1 }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    ((await store.read(user)).sessions.investor!.state as any).round,
    2,
  );
});
test("authenticated Founder and Builder decisions use canonical costs and feasibility", async () => {
  const user = await fresh(),
    founder = id();
  let state = await store.mutate(user, id(), {
    type: "simulation",
    track: "founder",
    sessionId: founder,
    expectedRevision: 0,
    action: { type: "founder-round", price: 60, marketing: 100, capacity: 40 },
  });
  assert.equal((state.sessions.founder!.state as any).cash, 3860);
  const builder = id();
  state = await store.mutate(user, id(), {
    type: "simulation",
    track: "builder",
    sessionId: builder,
    expectedRevision: 0,
    action: {
      type: "builder-choices",
      features: ["entry", "list", "done", "test"],
      technical: "local",
    },
  });
  state = await store.mutate(user, id(), {
    type: "simulation",
    track: "builder",
    sessionId: builder,
    expectedRevision: 1,
    action: { type: "builder-evaluate" },
  });
  assert.equal(
    state.results.find((r) => r.track === "builder")?.summary.hours,
    18,
  );
  assert.equal(
    state.results.find((r) => r.track === "builder")?.summary.feasible,
    1,
  );
});
test("guest import previews and confirms idempotently, recomputes scores and rejects invented balances", async () => {
  const user = await fresh(),
    local = defaults();
  local.attempts = [
    {
      id: id(),
      courseId: courses[0].id,
      answers: [0, 0, 0, 0, 0],
      score: 5,
      total: 5,
      completedAt: "old",
    },
  ];
  local.results = [
    {
      id: id(),
      track: "investor",
      summary: { total: 999999 },
      completedAt: "old",
    },
  ];
  const request = id();
  const preview = await store.importGuest(user, request, local, true);
  assert.equal(preview.report.accepted.attempts, 1);
  assert.equal(preview.report.rejected.simulations, 1);
  assert.equal((await store.read(user)).attempts.length, 0);
  await store.importGuest(user, request, local);
  await store.importGuest(user, id(), local);
  const state = await store.read(user);
  assert.equal(state.attempts.length, 1);
  assert.notEqual(state.attempts[0].score, 5);
  assert.equal(state.results.length, 0);
  assert.equal(local.results[0].summary.total, 999999);
});
test("AI requests exclude personal/free text and invalid catalog/prerequisite output is rejected", () => {
  const a = submitAssessment(assessment()),
    request = aiRequest(a, "en");
  assert.ok(!JSON.stringify(request.messages).includes("private@example.test"));
  assert.ok(!JSON.stringify(request.messages).includes("Private Person"));
  const result = output(a);
  assert.equal(result.result.learningPlan.source, "server");
  const ids = request.base.learningPlan.activities.map((a) => a.id);
  assert.throws(() =>
    compileRecommendation(request.base, {
      primaryPath: "builder",
      activityOrder: ["invented", ...ids.slice(1)],
      summary: { en: "An explanation here", ar: "شرح مناسب هنا" },
      reasons: [],
    }),
  );
});
test("AI timeout, credits and invalid responses fail without pretending a local plan is AI", async () => {
  const a = submitAssessment(assessment()),
    choice = {
      id: "test",
      provider: "test",
      promptPrice: 0,
      completionPrice: 0,
    };
  await assert.rejects(
    callModel(a, "en", choice, {
      key: "test",
      fetcher: async () => {
        throw Error();
      },
    }),
    /provider-timeout/,
  );
  await assert.rejects(
    callModel(a, "en", choice, {
      key: "test",
      fetcher: async () => new Response("{}", { status: 402 }),
    }),
    /insufficient-credits/,
  );
  await assert.rejects(
    callModel(a, "en", choice, {
      key: "test",
      fetcher: async () =>
        Response.json({
          model: "test",
          choices: [{ message: { content: "not json" } }],
        }),
    }),
    /invalid-output/,
  );
});
test("AI plans commit atomically; retry IDs do not call the provider twice and failure keeps last plan", async () => {
  const user = await fresh(),
    draft = assessment();
  await store.mutate(user, id(), { type: "assessment", draft });
  let calls = 0;
  const gen = new Generations(store, async (a) => {
    calls++;
    return output(a);
  });
  const request = {
    requestId: id(),
    assessment: submitAssessment(draft),
    locale: "en",
  };
  const first = await gen.generate(user, request);
  await gen.generate(user, request);
  assert.equal(calls, 1);
  assert.equal((await store.read(user)).planning.plans.length, 1);
  const fail = new Generations(store, async () => {
    throw Error();
  });
  const failed = { ...request, requestId: id(), regenerate: true };
  await assert.rejects(fail.generate(user, failed));
  await assert.rejects(fail.generate(user, failed));
  assert.equal(
    (await store.read(user)).planning.activePlanId,
    first.learningPlan.id,
  );
});
test("stale assessment during provider work cannot publish a charged result over newer answers", async () => {
  const user = await fresh(),
    draft = assessment();
  await store.mutate(user, id(), { type: "assessment", draft });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let entered!: () => void;
  const started = new Promise<void>((r) => {
    entered = r;
  });
  const gen = new Generations(store, async (a) => {
    entered();
    await gate;
    return output(a);
  });
  const pending = gen.generate(user, {
    requestId: id(),
    assessment: submitAssessment(draft),
    locale: "en",
  });
  await started;
  await store.mutate(user, id(), {
    type: "assessment",
    draft: setAssessmentAnswer(draft, "goal", "money"),
  });
  release();
  await assert.rejects(pending, /stale-assessment/);
  assert.equal((await store.read(user)).planning.plans.length, 0);
});

