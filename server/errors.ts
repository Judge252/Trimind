export class ApiError extends Error {
  usage?: {
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
    cost: number | null;
    latencyMs: number;
  };
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export const assert = (
  value: unknown,
  code = "invalid-input",
  status = 400,
): asserts value => {
  if (!value) throw new ApiError(code, status);
};
