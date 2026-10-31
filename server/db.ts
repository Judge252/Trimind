import pg from "pg";
import { connectionOptions } from './connection.js';
export interface Sql {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
}
export interface Database {
  transaction<T>(userId: string, fn: (db: Sql) => Promise<T>): Promise<T>;
  health(): Promise<boolean>;
}
export function postgresDatabase(url: string): Database {
  const pool = new pg.Pool({
    ...connectionOptions(url),
    max: process.env.VERCEL ? 2 : 8,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  pool.on("error", () =>
    console.error(JSON.stringify({ code: "database-connection-error" })),
  );
  return {
    async transaction(userId, fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("set local role trimind_api");
        await client.query(
          "select set_config('request.jwt.claim.sub',$1,true)",
          [userId],
        );
        await client.query(
          "select pg_advisory_xact_lock(hashtextextended($1,0))",
          [userId],
        );
        const result = await fn(client);
        await client.query("commit");
        return result;
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
    },
    async health() {
      try {
        const r = await pool.query(
          "select to_regclass('public.ai_generations') is not null as ready",
        );
        return r.rows[0].ready;
      } catch {
        return false;
      }
    },
  };
}
