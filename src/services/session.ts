import { createClient, type Session } from "@supabase/supabase-js";
import { AccountBoundary } from "./account-boundary";
const env = import.meta.env || {};
export const supabase =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "trimind:auth:session",
        },
      })
    : undefined;
let session: Session | null = null;
const boundary = new AccountBoundary();
const listeners = new Set<() => void>();
export const currentUser = () => session?.user || null;
export const accountScope = () => boundary.scope;
const update = (next: Session | null) => {
  session = next;
  boundary.switchTo(next?.user.id || null);
  for (const fn of listeners) queueMicrotask(fn);
};
supabase?.auth.onAuthStateChange((_event, next) => {
  update(next);
});
export async function restoreSession() {
  if (!supabase) return;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    update(null);
    return;
  }
  update(data.session);
}
export function subscribeSession(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export async function accessToken() {
  if (!supabase || !currentUser()) throw Error("authentication-required");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    update(null);
    throw Error("session-expired");
  }
  return data.session.access_token;
}
export async function logout() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw Error("logout-failed");
  update(null);
  try {
    sessionStorage.removeItem("trimind:recovery");
  } catch {}
}
