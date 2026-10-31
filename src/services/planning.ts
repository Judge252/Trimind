import type {
  AssessmentSubmission,
  Course,
  Language,
  PlanGenerationResult,
} from "../models";
import { api } from "./api";
export interface PlanRequest {
  assessment: AssessmentSubmission;
  contentCatalog: Course[];
  locale: Language;
  requestId?: string;
  regenerate?: boolean;
}
export class PlanningError extends Error {
  constructor(public code: string) {
    super(code);
  }
}
export interface PlanningService {
  generatePlan(
    request: PlanRequest,
    options?: { signal?: AbortSignal },
  ): Promise<PlanGenerationResult>;
}
export const planningService: PlanningService = {
  async generatePlan(request, options) {
    return api("/api/plans", {
      body: {
        requestId: request.requestId || crypto.randomUUID(),
        assessment: request.assessment,
        locale: request.locale,
        regenerate: request.regenerate || false,
      },
      signal: options?.signal,
    });
  },
};
