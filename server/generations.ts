import fs from "node:fs/promises";
import type {
  AssessmentSubmission,
  PlanGenerationResult,
} from "../src/models/index.js";
import { submitAssessment } from "../src/logic/assessment.js";
import { parse, planRequestSchema } from "./validation.js";
import { validatePlanResult } from "../src/logic/planning.js";
import { courses } from "../src/content/courses.js";
import { ApiError } from "./errors.js";
import { saveSubmission, snapshot, Store } from "./store.js";
import { callModel, type AiChoice, type AiOutput } from "./ai.js";
export type AiEngine = (
  assessment: AssessmentSubmission,
  locale: "en" | "ar",
) => Promise<AiOutput>;
export async function configuredEngine(
  assessment: AssessmentSubmission,
  locale: "en" | "ar",
) {
  if (!process.env.OPENROUTER_API_KEY)
    throw new ApiError("planning-unavailable", 503);
  let registry: any;
  try {
    registry = JSON.parse(
      await fs.readFile("server/model-selection.json", "utf8"),
    );
  } catch {
    throw new ApiError("model-not-evaluated", 503);
  }
  const selected = registry.selected as AiChoice | undefined,
    fallback = registry.fallback as AiChoice | undefined;
  if (
    !selected ||
    (process.env.OPENROUTER_MODEL &&
      process.env.OPENROUTER_MODEL !== selected.id) ||
    (process.env.OPENROUTER_FALLBACK_MODEL &&
      process.env.OPENROUTER_FALLBACK_MODEL !== fallback?.id)
  )
    throw new ApiError("model-not-evaluated", 503);
  const maxCost = Math.min(
      Number(process.env.OPENROUTER_MAX_COST_USD) || 0.05,
      0.1,
    ),
    options = {
      key: process.env.OPENROUTER_API_KEY,
      timeoutMs: Math.min(
        Number(process.env.OPENROUTER_TIMEOUT_MS) || 25000,
        process.env.VERCEL ? 22000 : 45000,
      ),
      maxCost: maxCost / 2,
    };
  try {
    return await callModel(assessment, locale, selected, options);
  } catch (e) {
    // Retry only explicit refusal/rate/unavailability. Never retry an ambiguous timeout/invalid body.
    if (
      fallback &&
      e instanceof ApiError &&
      ["provider-rate-limit", "provider-unavailable"].includes(e.code)
    )
      return callModel(assessment, locale, fallback, options);
    throw e;
  }
}
export class Generations {
  constructor(
    private store: Store,
    private engine: AiEngine = configuredEngine,
  ) {}
  async generate(user: string, raw: unknown) {
    const request = parse(planRequestSchema, raw);
    const reserved = await this.store.database.transaction(user, async (db) => {
      const old = (
        await db.query(
          "select * from ai_generations where user_id=$1 and id=$2",
          [user, request.requestId],
        )
      ).rows[0];
      if (
        old?.status === "pending" &&
        Date.now() - new Date(old.created_at).getTime() > 120000
      ) {
        await db.query(
          "update ai_generations set status='interrupted',error_code='generation-interrupted' where user_id=$1 and id=$2",
          [user, request.requestId],
        );
        return { interrupted: true };
      }
      if (old) {
        if (
          old.draft_id !== request.assessment.draftId ||
          old.draft_revision !== request.assessment.draftRevision
        )
          throw new ApiError("idempotency-conflict", 409);
        if (old.status === "complete")
          return {
            result: (
              await db.query(
                "select data from learning_plans where user_id=$1 and generation_id=$2",
                [user, request.requestId],
              )
            ).rows[0]?.data as PlanGenerationResult,
          };
        throw new ApiError(
          old.status === "pending"
            ? "generation-in-progress"
            : old.error_code || "generation-interrupted",
          old.status === "pending" ? 202 : 409,
        );
      }
      await db.query(
        "update ai_generations set status='interrupted',error_code='generation-interrupted',finished_at=now() where user_id=$1 and status='pending' and created_at<now()-interval '2 minutes'",
        [user],
      );
      const active = (
        await db.query(
          "select data from assessment_drafts where user_id=$1 and active",
          [user],
        )
      ).rows[0]?.data;
      if (
        !active ||
        active.id !== request.assessment.draftId ||
        active.revision !== request.assessment.draftRevision
      )
        throw new ApiError("stale-assessment", 409);
      if (!request.regenerate) {
        const cached = (
          await db.query(
            "select p.data from learning_plans p join ai_generations g on g.user_id=p.user_id and g.id=p.generation_id where g.user_id=$1 and g.draft_id=$2 and g.draft_revision=$3 and g.status='complete' order by p.version desc limit 1",
            [user, active.id, active.revision],
          )
        ).rows[0];
        if (cached) return { result: cached.data as PlanGenerationResult };
      }
      const pending = (
        await db.query(
          "select 1 from ai_generations where user_id=$1 and status='pending'",
          [user],
        )
      ).rows.length;
      if (pending) throw new ApiError("generation-in-progress", 202);
      const count = (
        await db.query(
          "select count(*) as n from ai_generations where user_id=$1 and created_at>now()-interval '1 hour'",
          [user],
        )
      ).rows[0].n;
      if (Number(count) >= 3) throw new ApiError("rate-limit", 429);
      let submission: AssessmentSubmission;
      try {
        submission = submitAssessment(active);
      } catch {
        throw new ApiError("incomplete-assessment", 422);
      }
      await saveSubmission(db, user, submission);
      await db.query(
        "insert into ai_generations(user_id,id,assessment_id,draft_id,draft_revision,status) values($1,$2,$3,$4,$5,'pending')",
        [user, request.requestId, submission.id, active.id, active.revision],
      );
      return { submission };
    });
    if (reserved.interrupted) throw new ApiError("generation-interrupted", 409);
    if (reserved.result) return reserved.result;
    try {
      const ai = await this.engine(reserved.submission!, request.locale);
      if (
        !validatePlanResult(ai.result, courses) ||
        ai.result.learningPlan.source !== "server" ||
        ai.result.learningPlan.assessmentId !== reserved.submission!.id
      )
        throw new ApiError("invalid-output", 502);
      return await this.store.database.transaction(user, async (db) => {
        const current = (
          await db.query(
            "select id,revision from assessment_drafts where user_id=$1 and active",
            [user],
          )
        ).rows[0];
        if (
          !current ||
          current.id !== request.assessment.draftId ||
          current.revision !== request.assessment.draftRevision
        )
          throw new ApiError("stale-assessment", 409);
        const generation = (
          await db.query(
            "select status from ai_generations where user_id=$1 and id=$2",
            [user, request.requestId],
          )
        ).rows[0];
        if (generation.status !== "pending")
          throw new ApiError("generation-interrupted", 409);
        const version = Number(
            (
              await db.query(
                "select coalesce(max(version),0)+1 as n from learning_plans where user_id=$1",
                [user],
              )
            ).rows[0].n,
          ),
          result = ai.result;
        result.learningPlan.version = version;
        await db.query(
          "insert into learning_plans(user_id,id,assessment_id,generation_id,version,data) values($1,$2,$3,$4,$5,$6)",
          [
            user,
            result.learningPlan.id,
            reserved.submission!.id,
            request.requestId,
            version,
            JSON.stringify(result),
          ],
        );
        await db.query(
          "insert into active_plans values($1,$2) on conflict(user_id) do update set plan_id=excluded.plan_id",
          [user, result.learningPlan.id],
        );
        const preferences = (await snapshot(db, user)).preferences;
        preferences.track = result.learnerProfile.primaryPath;
        preferences.goal =
          result.learnerProfile.goal === "money"
            ? "money"
            : result.learnerProfile.goal === "explore"
              ? "explore"
              : "create";
        preferences.onboarded = true;
        await db.query(
          "insert into learner_preferences(user_id,data) values($1,$2) on conflict(user_id) do update set data=excluded.data",
          [user, JSON.stringify(preferences)],
        );
        await db.query(
          "update ai_generations set status='complete',finished_at=now(),model=$3,prompt_tokens=$4,completion_tokens=$5,cost=$6 where user_id=$1 and id=$2",
          [
            user,
            request.requestId,
            ai.model,
            ai.promptTokens,
            ai.completionTokens,
            ai.cost,
          ],
        );
        return result;
      });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "planning-unavailable";
      const usage = e instanceof ApiError ? e.usage : undefined;
      await this.store.database.transaction(user, (db) =>
        db.query(
          "update ai_generations set status='failed',error_code=$3,finished_at=now(),model=$4,prompt_tokens=$5,completion_tokens=$6,cost=$7 where user_id=$1 and id=$2 and status='pending'",
          [
            user,
            request.requestId,
            code,
            usage?.model || null,
            usage?.promptTokens ?? null,
            usage?.completionTokens ?? null,
            usage?.cost ?? null,
          ],
        ),
      );
      throw e instanceof ApiError
        ? e
        : new ApiError("planning-unavailable", 503);
    }
  }
}
