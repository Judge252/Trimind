import { z } from "zod";
import { ApiError } from "./errors.js";
import { validDraft, validSubmission } from "../src/services/planning-storage.js";
export const uuid = z.string().uuid();
const draftInput = z
  .custom<import("../src/models/index.js").AssessmentDraft>(validDraft)
  .refine(
    (v) =>
      uuid.safeParse(v.id).success &&
      JSON.stringify(v).length < 32000 &&
      Object.keys(v).every((k) =>
        [
          "id",
          "schemaVersion",
          "assessmentVersion",
          "revision",
          "createdAt",
          "updatedAt",
          "stage",
          "currentQuestionId",
          "answers",
        ].includes(k),
      ),
  );
export const track = z.enum(["builder", "founder", "investor"]);
const text = (n: number) => z.string().max(n);
export const preferencesSchema = z
  .object({
    name: text(40),
    goal: z.enum(["explore", "create", "money"]),
    experience: z.enum(["new", "some", "practiced"]),
    track,
    language: z.enum(["en", "ar"]),
    onboarded: z.boolean(),
  })
  .strict();
export const projectSchema = z
  .object({
    id: uuid,
    title: z.string().trim().min(1).max(100),
    track,
    problem: text(2500),
    audience: text(2500),
    solution: text(2500),
    businessModel: text(2500),
    features: z.array(text(120)).max(6),
    updatedAt: text(40),
  })
  .strict();
const action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("reset") }).strict(),
  z
    .object({
      type: z.literal("trade"),
      assetId: z.enum(["steady", "local", "spark"]),
      quantity: z.number().int().positive().max(100000),
      side: z.enum(["buy", "sell"]),
    })
    .strict(),
  z.object({ type: z.literal("advance") }).strict(),
  z
    .object({
      type: z.literal("founder-round"),
      price: z.number().int().min(30).max(100),
      marketing: z.number().int().min(0).max(500),
      capacity: z.number().int().min(1).max(60),
    })
    .strict(),
  z
    .object({
      type: z.literal("builder-choices"),
      features: z
        .array(z.enum(["entry", "list", "done", "test", "calendar", "theme"]))
        .max(6),
      technical: z.enum(["local", "cloud"]),
    })
    .strict(),
  z.object({ type: z.literal("builder-evaluate") }).strict(),
  z.object({ type: z.literal("builder-revise") }).strict(),
]);
export const mutationSchema = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("preferences"), preferences: preferencesSchema })
    .strict(),
  z
    .object({
      type: z.literal("lesson"),
      courseId: text(100),
      lessonId: text(100),
    })
    .strict(),
  z
    .object({
      type: z.literal("quiz"),
      id: uuid,
      courseId: text(100),
      answers: z.array(z.number().int().min(0).max(2)).length(5),
    })
    .strict(),
  z.object({ type: z.literal("project"), project: projectSchema }).strict(),
  z.object({ type: z.literal("delete-project"), id: uuid }).strict(),
  z
    .object({
      type: z.literal("assessment"),
      draft: draftInput,
    })
    .strict(),
  z.object({ type: z.literal("discard-assessment") }).strict(),
  z.object({ type: z.literal("activate-plan"), id: uuid }).strict(),
  z
    .object({
      type: z.literal("simulation"),
      track,
      sessionId: uuid,
      expectedRevision: z.number().int().nonnegative(),
      action,
    })
    .strict(),
  z.object({ type: z.literal("reset") }).strict(),
]);
export const planRequestSchema = z
  .object({
    requestId: uuid,
    assessment:
      z.custom<import("../src/models/index.js").AssessmentSubmission>(
        validSubmission,
      ),
    locale: z.enum(["en", "ar"]),
    regenerate: z.boolean().default(false),
  })
  .strict();
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError("invalid-input", 422);
  return result.data;
}
export type Mutation = z.infer<typeof mutationSchema>;
