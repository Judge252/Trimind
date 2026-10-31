import { supabase, currentUser } from "./session";
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
    super("service-unconfigured");
  }
}
export interface AuthService {
  submit(request: AuthRequest): Promise<{
    status:
      "signed-in" | "verify-email" | "recovery-requested" | "password-updated";
  }>;
}
export const authService: AuthService = {
  async submit(r) {
    if (!supabase) throw new AuthUnavailable();
    const redirect =
      location.origin +
      "/auth/callback?next=" +
      encodeURIComponent(intendedDestination(r.returnTo));
    if (r.kind === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: r.email,
        password: r.password,
      });
      if (error) throw Error("login-failed");
      return { status: "signed-in" };
    }
    if (r.kind === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: r.email,
        password: r.password,
        options: { data: { display_name: r.name }, emailRedirectTo: redirect },
      });
      if (error) throw Error("signup-failed");
      return { status: data.session ? "signed-in" : "verify-email" };
    }
    if (r.kind === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(r.email, {
        redirectTo: redirect + "&mode=recovery",
      });
      if (error) throw Error("recovery-failed");
      return { status: "recovery-requested" };
    }
    if (!currentUser() || !recoveryAllowed()) throw Error("invalid-reset-link");
    const { error } = await supabase.auth.updateUser({ password: r.password });
    if (error) throw Error("reset-failed");
    sessionStorage.removeItem("trimind:recovery");
    return { status: "password-updated" };
  },
};
export async function continueWithGoogle(returnTo: string) {
  if (!supabase) throw new AuthUnavailable();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        location.origin +
        "/auth/callback?next=" +
        encodeURIComponent(intendedDestination(returnTo)),
    },
  });
  if (error) throw Error("google-unavailable");
}
export function recoveryAllowed() {
  try {
    const r = JSON.parse(sessionStorage.getItem("trimind:recovery") || "null");
    return (
      !!currentUser() && r?.user === currentUser()?.id && r.expires > Date.now()
    );
  } catch {
    return false;
  }
}
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
