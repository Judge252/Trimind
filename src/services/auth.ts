export type AuthRequest =
  | { kind: "login"; email: string; password: string; returnTo: string }
  | {
      kind: "signup";
      name: string;
      email: string;
      password: string;
      returnTo: string;
    }
  | { kind: "recovery"; email: string; returnTo: string }
  | { kind: "reset"; password: string; token: string; returnTo: string };
export class AuthUnavailable extends Error {
  constructor() {
    super("phase-two-required");
  }
}
export interface AuthService {
  submit(request: AuthRequest): Promise<never>;
}
export const authService: AuthService = {
  async submit(_request) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    throw new AuthUnavailable();
  },
};
export function intendedDestination(value: string | null) {
  return value &&
    /^\/(assessment|my-plan|dashboard|learn|practice|projects|profile)(?:[/?#]|$)/.test(
      value,
    ) &&
    !value.includes("\\")
    ? value
    : "/assessment";
}
export type AccountMode = "login" | "signup" | "recovery" | "reset";
export interface AccountFields {
  name: string;
  email: string;
  password: string;
  confirmation: string;
}
export function validateAccount(mode: AccountMode, fields: AccountFields) {
  const errors: Partial<
    Record<
      keyof AccountFields,
      "required" | "email" | "password" | "confirmation" | "name"
    >
  > = {};
  if (mode === "signup" && (!fields.name.trim() || fields.name.length > 40))
    errors.name = "name";
  if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
    errors.email = "email";
  if (
    mode !== "recovery" &&
    (fields.password.length < 8 || fields.password.length > 128)
  )
    errors.password = "password";
  if (
    (mode === "signup" || mode === "reset") &&
    fields.password !== fields.confirmation
  )
    errors.confirmation = "confirmation";
  return errors;
}
