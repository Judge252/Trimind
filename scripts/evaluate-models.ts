import fs from "node:fs/promises";
import { callModel, type AiChoice } from "../server/ai";
import {
  newAssessment,
  setAssessmentAnswer,
  submitAssessment,
  questionsFor,
} from "../src/logic/assessment";
const ids = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash",
  "openai/gpt-4.1-mini",
];
const date = new Date().toISOString();
const key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.error("OPENROUTER_API_KEY is missing; no billable requests sent.");
  process.exit(1);
}
const catalog = (await (
  await fetch("https://openrouter.ai/api/v1/models")
).json()) as any;
const budgetPath = "server/.model-eval-budget.json";
let budget = { reserved: 0 };
try {
  budget = JSON.parse(await fs.readFile(budgetPath, "utf8"));
} catch {}
let previous: any[] = [];
try {
  const old = JSON.parse(
    await fs.readFile("server/model-selection.json", "utf8"),
  );
  previous = [...(old.previousAttempts || []), ...old.results];
} catch {}
const results: any[] = [];
for (const id of ids) {
  const model = catalog.data.find((m: any) => m.id === id);
  if (!model?.supported_parameters.includes("structured_outputs")) {
    results.push({ id, status: "unsupported" });
    continue;
  }
  const choice: AiChoice = {
    id,
    provider: id.startsWith("google/") ? "google-ai-studio" : "openai",
    promptPrice: Number(model.pricing.prompt),
    completionPrice: Number(model.pricing.completion),
  };
  for (const locale of ["en", "ar"] as const) {
    let d = newAssessment();
    const values: Record<string, string | string[]> = {
      goal: locale === "ar" ? "money" : "build",
      paths: locale === "ar" ? ["investor", "founder"] : ["builder"],
      "experience-builder": "new",
      "experience-founder": "new",
      "experience-investor": "new",
      minutes: locale === "ar" ? "20" : "10",
      days: "2",
      weeks: "4",
      formats: ["examples"],
      aspiration: "Create a useful learning project",
      connectivity: "steady",
      confidence: "low",
      difficulty: "example",
      support: "guided",
    };
    for (const [id, v] of Object.entries(values))
      d = setAssessmentAnswer(d, id, v);
    for (const q of questionsFor(d).filter((q) => q.section === "knowledge"))
      d = setAssessmentAnswer(d, q.id, "unknown");
    const reservation = 0.04;
    if (budget.reserved + reservation > 0.5) {
      results.push({ id, locale, status: "budget-cap" });
      continue;
    }
    budget.reserved += reservation;
    await fs.writeFile(budgetPath, JSON.stringify(budget));
    try {
      const output = await callModel(submitAssessment(d), locale, choice, {
        key,
        maxCost: reservation,
      });
      const reasons = output.result.learningPlan.personalisation!;
      const bilingual =
        /[\u0600-\u06ff]/.test(reasons.summary.ar) &&
        /[a-zA-Z]/.test(reasons.summary.en);
      if (!bilingual) throw Error("language-failed");
      results.push({
        id,
        locale,
        status: "pass",
        latencyMs: output.latencyMs,
        promptTokens: output.promptTokens,
        completionTokens: output.completionTokens,
        cost: output.cost,
        estimatedUpperBound: output.estimate,
        choice,
      });
    } catch (e) {
      results.push({
        id,
        locale,
        status: "failed",
        code: e instanceof Error ? e.message : "failed",
        choice,
      });
    }
  }
}
const passing = ids
  .filter(
    (id) =>
      results.filter((r) => r.id === id && r.status === "pass").length === 2,
  )
  .map((id) => {
    const tests = results.filter((r) => r.id === id);
    return {
      choice: tests[0].choice,
      meanLatency: tests.reduce((n, r) => n + r.latencyMs, 0) / 2,
      reportedCost: tests.reduce(
        (n, r) => n + (r.cost ?? r.estimatedUpperBound),
        0,
      ),
    };
  })
  .sort(
    (a, b) => a.reportedCost - b.reportedCost || a.meanLatency - b.meanLatency,
  );
const report = {
  evaluatedAt: date,
  capUsd: 0.5,
  previousAttempts: previous,
  privacy: {
    data_collection: "deny",
    zdr: false,
    explicitProviders: true,
    reason:
      "Strict ZDR endpoints were unavailable. Only non-personal synthetic profiles were evaluated; no zero-retention claim is made.",
  },
  reservedUpperBound: budget.reserved,
  results,
  selected: passing[0]?.choice || null,
  fallback: passing[1]?.choice || null,
  scope:
    "Two synthetic profiles per candidate; schema/catalog/prerequisites/workload/language checks. No universal best-model claim.",
};
await fs.writeFile(
  "server/model-selection.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
