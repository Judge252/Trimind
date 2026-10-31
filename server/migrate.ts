import fs from "node:fs/promises";
import pg from "pg";
import { connectionOptions } from './connection.js';
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. No migration applied.");
  process.exit(1);
}
const db = new pg.Client({
  ...connectionOptions(process.env.DATABASE_URL),
});
try {
  await db.connect();
  await db.query("begin");
  await db.query("select pg_advisory_xact_lock(714631)");
  await db.query(
    "create table if not exists public.trimind_migrations(version text primary key,applied_at timestamptz not null default now())",
  );
  for (const version of (await fs.readdir("supabase/migrations"))
    .filter((v) => v.endsWith(".sql"))
    .sort()) {
    const exists = await db.query(
      "select 1 from public.trimind_migrations where version=$1",
      [version],
    );
    if (!exists.rowCount) {
      await db.query(
        await fs.readFile(`supabase/migrations/${version}`, "utf8"),
      );
      await db.query(
        "insert into public.trimind_migrations(version) values($1)",
        [version],
      );
      console.log(`Applied ${version}`);
    }
  }
  await db.query("commit");
} catch {
  await db.query("rollback").catch(() => {});
  console.error(
    "Migration failed. Transaction rolled back; verify role privileges and database settings.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
