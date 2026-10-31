import type {
  AssessmentSubmission,
  Course,
  Language,
  PlanGenerationResult,
} from "../models";
import { buildDemoPlan, validatePlanResult } from "../logic/planning";
export interface PlanRequest {
  assessment: AssessmentSubmission;
  contentCatalog: Course[];
  locale: Language;
}
export type PlanningErrorCode =
  | "cancelled"
  | "invalid-assessment"
  | "catalog-unavailable"
  | "invalid-plan"
  | "unavailable";
export class PlanningError extends Error {
  constructor(public code: PlanningErrorCode) {
    super(code);
  }
}
export interface PlanningService {
  generatePlan(
    request: PlanRequest,
    options?: { signal?: AbortSignal; previewFailure?: boolean },
  ): Promise<PlanGenerationResult>;
}
export function createDemoPlanningService(
  engine = buildDemoPlan,
): PlanningService {
  return {
    async generatePlan(request, options) {
      const cancelled = () => {
        if (options?.signal?.aborted) throw new PlanningError("cancelled");
      };
      cancelled();
      // Yield to the UI/event loop; no artificial analysis timer or fabricated model work.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      cancelled();
      if (options?.previewFailure) throw new PlanningError("unavailable");
      try {
        const result = engine(request);
        cancelled();
        if (!validatePlanResult(result, request.contentCatalog))
          throw new PlanningError("invalid-plan");
        return result;
      } catch (e) {
        if (e instanceof PlanningError) throw e;
        const code = e instanceof Error ? e.message : "";
        throw new PlanningError(
          [
            "invalid-assessment",
            "catalog-unavailable",
            "invalid-plan",
          ].includes(code)
            ? (code as PlanningErrorCode)
            : "unavailable",
        );
      }
    },
  };
}
export const planningService = createDemoPlanningService();
