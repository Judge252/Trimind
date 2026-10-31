import { createClient } from "@supabase/supabase-js";
import { postgresDatabase } from "./db.js";
import { Store } from "./store.js";
import { createApi } from "./http.js";
export function createApplication() {
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      )
    : undefined;
const store = process.env.DATABASE_URL
  ? new Store(postgresDatabase(process.env.DATABASE_URL))
  : undefined;
return createApi({
  store,
  origin: process.env.APP_ORIGIN || "http://127.0.0.1:4173",
  verifier: {
    async verify(token) {
      if (!supabase) throw Error();
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user?.id || !data.user.email_confirmed_at)
        throw Error();
      return { id: data.user.id };
    },
  },
});
}
