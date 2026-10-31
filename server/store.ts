import { createHash } from "node:crypto";
import type { Database, Sql } from "./db.js";
import type {
  AppData,
  AssessmentDraft,
  AssessmentSubmission,
  PlanGenerationResult,
  SimulationSession,
} from "../src/models/index.js";
import { defaults } from "../src/services/local-repository.js";
import { courses } from "../src/content/courses.js";
import { features } from "../src/content/scenarios.js";
import { scoreQuiz } from "../src/logic/learning.js";
import { SimulationError } from "../src/logic/simulations.js";
import { transition } from "./simulations.js";
import { ApiError } from "./errors.js";
import { parse, mutationSchema, type Mutation } from "./validation.js";
import { validDraft } from "../src/services/planning-storage.js";
import { projectSchema } from "./validation.js";
const canonical = (v: any): any =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical(v[k])]),
        )
      : v;
export const hash = (v: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(v)))
    .digest("hex");
const row = async (db: Sql, sql: string, args: any[] = []) =>
  (await db.query(sql, args)).rows[0];
async function put(
  db: Sql,
  table: string,
  user: string,
  id: string,
  data: unknown,
) {
  await db.query(
    `insert into public.${table}(user_id,id,data) values($1,$2,$3) on conflict(user_id,id) do update set data=excluded.data`,
    [user, id, JSON.stringify(data)],
  );
}
export async function snapshot(db: Sql, user: string): Promise<AppData> {
  const state = defaults();
  const prefs = await row(
    db,
    "select data from learner_preferences where user_id=$1",
    [user],
  );
  if (prefs) state.preferences = prefs.data;
  state.lessons = (
    await db.query(
      'select course_id as "courseId",lesson_id as "lessonId",completed_at as "completedAt" from lesson_completions where user_id=$1',
      [user],
    )
  ).rows.map((r: any) => ({
    ...r,
    completedAt: new Date(r.completedAt).toISOString(),
  }));
  for (const [table, key] of [
    ["quiz_attempts", "attempts"],
    ["simulation_results", "results"],
    ["projects", "projects"],
  ] as const)
    (state[key] as any) = (
      await db.query(
        `select data from ${table} where user_id=$1 order by ${table === "projects" ? "updated_at desc" : "id"}`,
        [user],
      )
    ).rows.map((r: any) => r.data);
  for (const r of (
    await db.query(
      "select data from simulation_sessions where user_id=$1 and active",
      [user],
    )
  ).rows)
    state.sessions[r.data.track as keyof typeof state.sessions] = r.data;
  const draft = await row(
    db,
    "select data from assessment_drafts where user_id=$1 and active",
    [user],
  );
  if (draft) state.planning.draft = draft.data;
  state.planning.submissions = (
    await db.query("select data from assessment_submissions where user_id=$1", [
      user,
    ])
  ).rows.map((r: any) => r.data);
  state.planning.plans = (
    await db.query(
      "select data from learning_plans where user_id=$1 order by version",
      [user],
    )
  ).rows.map((r: any) => r.data);
  state.planning.activePlanId = (
    await row(db, "select plan_id from active_plans where user_id=$1", [user])
  )?.plan_id;
  return state;
}
export async function saveDraft(db: Sql, user: string, draft: AssessmentDraft) {
  const current = await row(
    db,
    "select id,revision,data from assessment_drafts where user_id=$1 and active",
    [user],
  );
  if (current && current.id !== draft.id)
    throw new ApiError("stale-assessment", 409);
  const previous =
    current ||
    (await row(
      db,
      "select id,revision,data from assessment_drafts where user_id=$1 and id=$2",
      [user, draft.id],
    ));
  if (
    previous &&
    previous.id === draft.id &&
    (previous.revision > draft.revision ||
      (previous.revision === draft.revision &&
        hash(previous.data.answers) !== hash(draft.answers)))
  )
    throw new ApiError("stale-assessment", 409);
  await db.query(
    "update assessment_drafts set active=false where user_id=$1 and id<>$2",
    [user, draft.id],
  );
  await db.query(
    "insert into assessment_drafts(user_id,id,revision,data) values($1,$2,$3,$4) on conflict(user_id,id) do update set data=excluded.data,revision=excluded.revision,active=true",
    [user, draft.id, draft.revision, JSON.stringify(draft)],
  );
}
export async function saveSubmission(
  db: Sql,
  user: string,
  a: AssessmentSubmission,
) {
  await db.query(
    "insert into assessment_submissions(user_id,id,draft_id,data) values($1,$2,$3,$4) on conflict(user_id,id) do nothing",
    [user, a.id, a.draftId, JSON.stringify(a)],
  );
}
export class Store {
  constructor(public database: Database) {}
  read(user: string) {
    return this.database.transaction(user, (db) => snapshot(db, user));
  }
  async mutate(user: string, requestId: string, raw: unknown) {
    const m = parse(mutationSchema, raw),
      bodyHash = hash(m);
    return this.database.transaction(user, async (db) => {
      const receipt = await row(
        db,
        "select body_hash from mutation_receipts where user_id=$1 and id=$2",
        [user, requestId],
      );
      if (receipt) {
        if (receipt.body_hash !== bodyHash)
          throw new ApiError("idempotency-conflict", 409);
        return snapshot(db, user);
      }
      await applyMutation(db, user, m, requestId);
      await db.query(
        "insert into mutation_receipts(user_id,id,body_hash) values($1,$2,$3)",
        [user, requestId, bodyHash],
      );
      return snapshot(db, user);
    });
  }
  async importGuest(
    user: string,
    requestId: string,
    material: any,
    preview = false,
  ) {
    const bodyHash = hash(material);
    return this.database.transaction(user, async (db) => {
      const existing = await row(
        db,
        "select report from guest_imports where user_id=$1 and (id=$2 or body_hash=$3)",
        [user, requestId, bodyHash],
      );
      if (existing)
        return {
          report: existing.report,
          state: await snapshot(db, user),
          alreadyImported: true,
        };
      const report = {
        accepted: { lessons: 0, attempts: 0, projects: 0, assessment: 0 },
        rejected: {
          lessons: 0,
          attempts: 0,
          projects: 0,
          simulations: 0,
          plans: 0,
          assessment: 0,
        },
        reason:
          "Simulation balances/results and historical local plans are not authoritative. They stay on this browser.",
      };
      if (!material || typeof material !== "object" || material.version !== 1)
        throw new ApiError("invalid-import", 422);
      const limited = (v: any, max: number) => {
        if (!Array.isArray(v) || v.length > max)
          throw new ApiError("invalid-import", 422);
        return v;
      };
      for (const l of limited(material.lessons || [], 200)) {
        const c = courses.find((c) => c.id === l?.courseId);
        if (c?.lessons.some((v) => v.id === l.lessonId)) {
          report.accepted.lessons++;
          if (!preview)
            await applyMutation(
              db,
              user,
              { type: "lesson", courseId: l.courseId, lessonId: l.lessonId },
              requestId,
            );
        } else report.rejected.lessons++;
      }
      for (const a of limited(material.attempts || [], 500)) {
        const result = mutationSchema.safeParse({
          type: "quiz",
          id: a?.id,
          courseId: a?.courseId,
          answers: a?.answers,
        });
        if (result.success && courses.some((c) => c.id === a.courseId)) {
          report.accepted.attempts++;
          if (!preview) await applyMutation(db, user, result.data, requestId);
        } else report.rejected.attempts++;
      }
      for (const p of limited(material.projects || [], 100)) {
        const result = projectSchema.safeParse(p);
        if (result.success && p.features.every(validFeature)) {
          report.accepted.projects++;
          if (!preview) {
            const present = await row(
              db,
              "select id from projects where user_id=$1 and id=$2",
              [user, p.id],
            );
            if (!present)
              await applyMutation(
                db,
                user,
                { type: "project", project: result.data },
                requestId,
              );
          }
        } else report.rejected.projects++;
      }
      const draft = material.planning?.draft;
      if (draft) {
        const current = await row(
          db,
          "select id from assessment_drafts where user_id=$1 and active",
          [user],
        );
        if (validDraft(draft) && !current) {
          report.accepted.assessment++;
          if (!preview) await saveDraft(db, user, draft);
        } else report.rejected.assessment++;
      }
      report.rejected.simulations =
        Object.keys(material.sessions || {}).length +
        (Array.isArray(material.results) ? material.results.length : 0);
      report.rejected.plans = material.planning?.plans?.length || 0;
      if (!preview)
        await db.query(
          "insert into guest_imports(user_id,id,body_hash,report) values($1,$2,$3,$4)",
          [user, requestId, bodyHash, JSON.stringify(report)],
        );
      return {
        report,
        state: await snapshot(db, user),
        alreadyImported: false,
      };
    });
  }
}
function validFeature(v: string) {
  return features.some((f) => [f.id, f.name.en, f.name.ar].includes(v));
}
async function applyMutation(
  db: Sql,
  user: string,
  m: Mutation,
  requestId: string,
) {
  if (m.type === "preferences")
    await db.query(
      "insert into learner_preferences(user_id,data) values($1,$2) on conflict(user_id) do update set data=excluded.data",
      [user, JSON.stringify(m.preferences)],
    );
  else if (m.type === "lesson") {
    if (
      !courses.some(
        (c) =>
          c.id === m.courseId && c.lessons.some((l) => l.id === m.lessonId),
      )
    )
      throw new ApiError("unknown-lesson", 422);
    await db.query(
      "insert into lesson_completions(user_id,course_id,lesson_id) values($1,$2,$3) on conflict do nothing",
      [user, m.courseId, m.lessonId],
    );
  } else if (m.type === "quiz") {
    const c = courses.find((c) => c.id === m.courseId);
    if (!c) throw new ApiError("unknown-course", 422);
    const data = {
      id: m.id,
      courseId: m.courseId,
      answers: m.answers,
      score: scoreQuiz(c.quiz, m.answers),
      total: c.quiz.length,
      completedAt: new Date().toISOString(),
    };
    await db.query(
      "insert into quiz_attempts(user_id,id,course_id,score,data) values($1,$2,$3,$4,$5) on conflict(user_id,id) do nothing",
      [user, m.id, m.courseId, data.score, JSON.stringify(data)],
    );
  } else if (m.type === "project") {
    if (!m.project.features.every(validFeature))
      throw new ApiError("unknown-feature", 422);
    await put(db, "projects", user, m.project.id, {
      ...m.project,
      updatedAt: new Date().toISOString(),
    });
    await db.query(
      "update projects set updated_at=now() where user_id=$1 and id=$2",
      [user, m.project.id],
    );
  } else if (m.type === "delete-project")
    await db.query("delete from projects where user_id=$1 and id=$2", [
      user,
      m.id,
    ]);
  else if (m.type === "assessment") await saveDraft(db, user, m.draft);
  else if (m.type === "discard-assessment")
    await db.query(
      "update assessment_drafts set active=false where user_id=$1",
      [user],
    );
  else if (m.type === "activate-plan") {
    const present = await row(
      db,
      "select data from learning_plans where user_id=$1 and id=$2",
      [user, m.id],
    );
    if (!present) throw new ApiError("unknown-plan", 404);
    await db.query(
      "insert into active_plans values($1,$2) on conflict(user_id) do update set plan_id=excluded.plan_id",
      [user, m.id],
    );
  } else if (m.type === "simulation") {
    const current = await row(
      db,
      "select data from simulation_sessions where user_id=$1 and track=$2 and active",
      [user, m.track],
    );
    let changed;
    try {
      changed = transition(current?.data, m);
    } catch (e) {
      if (e instanceof SimulationError) throw new ApiError(e.code, 422);
      throw e;
    }
    const { session, result } = changed;
    if (m.action.type === "reset") {
      if (
        current &&
        (current.data.id !== m.sessionId ||
          (current.data.revision || 0) !== m.expectedRevision)
      )
        throw new ApiError("simulation-conflict", 409);
      await db.query(
        "update simulation_sessions set active=false where user_id=$1 and track=$2",
        [user, m.track],
      );
    }
    await db.query(
      "insert into simulation_sessions(user_id,id,track,revision,data) values($1,$2,$3,$4,$5) on conflict(user_id,id) do update set revision=excluded.revision,data=excluded.data",
      [
        user,
        session.id,
        m.track,
        session.revision || 0,
        JSON.stringify(session),
      ],
    );
    await db.query(
      "insert into simulation_decisions(user_id,session_id,revision,request_id,action) values($1,$2,$3,$4,$5)",
      [
        user,
        session.id,
        session.revision || 0,
        requestId,
        JSON.stringify(m.action),
      ],
    );
    if (result)
      await db.query(
        "insert into simulation_results(user_id,id,data) values($1,$2,$3) on conflict do nothing",
        [user, result.id, JSON.stringify(result)],
      );
  } else if (m.type === "reset") {
    for (const table of [
      "active_plans",
      "learning_plans",
      "ai_generations",
      "assessment_submissions",
      "assessment_drafts",
      "simulation_results",
      "simulation_decisions",
      "simulation_sessions",
      "lesson_completions",
      "quiz_attempts",
      "projects",
      "learner_preferences",
    ])
      await db.query(`delete from ${table} where user_id=$1`, [user]);
  }
}
