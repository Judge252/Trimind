import { accessToken, accountScope, supabase } from "./session";
export class ServiceError extends Error {
  constructor(
    public code: string,
    public status = 0,
  ) {
    super(code);
  }
}
export const apiBase = import.meta.env?.VITE_API_URL || "";
export async function api<T>(
  path: string,
  {
    body,
    id,
    signal,
    publicRead = false,
    refreshed = false,
  }: {
    body?: unknown;
    id?: string;
    signal?: AbortSignal;
    publicRead?: boolean;
    refreshed?: boolean;
  } = {},
): Promise<T> {
  const scope = accountScope();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (id) headers["Idempotency-Key"] = id;
  if (!publicRead) headers.Authorization = `Bearer ${await accessToken()}`;
  if (scope !== accountScope()) throw new ServiceError("account-changed");
  let response: Response;
  try {
    response = await fetch(apiBase + path, {
      method: body === undefined ? "GET" : "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
      signal,
    });
  } catch {
    throw new ServiceError(signal?.aborted ? "cancelled" : "network-error");
  }
  if (scope !== accountScope()) throw new ServiceError("account-changed");
  if (response.status === 401) {
    if (!refreshed && supabase) {
      const refresh = await supabase.auth.refreshSession();
      if (scope !== accountScope()) throw new ServiceError("account-changed");
      if (!refresh.error && refresh.data.session)
        return api(path, { body, id, signal, publicRead, refreshed: true });
    }
    await supabase?.auth.signOut({ scope: "local" });
    throw new ServiceError("session-expired", 401);
  }
  let value: any;
  try {
    value = await response.json();
  } catch {
    throw new ServiceError("service-unavailable", 503);
  }
  if (!response.ok || value.error)
    throw new ServiceError(
      value.error?.code || "service-unavailable",
      response.status,
    );
  return value;
}
