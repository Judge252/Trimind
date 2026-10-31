# Database installation

Use a dedicated Supabase project. The SQL expects Supabase Auth's `auth.users`, `auth.uid()` and `anon`/`authenticated` roles; it does not implement passwords or fake auth users.

Put the server-only PostgreSQL connection URI in the ignored `.env` as `DATABASE_URL`. Use a trusted certificate and `DATABASE_SSL=true` for the hosted service. Run as the project's `postgres` role (or an appropriately controlled migration role with equivalent create/grant privileges):

```powershell
npm run db:migrate
```

The migration runner takes a transaction-scoped lock, applies unapplied numbered files once, records them in `trimind_migrations`, and rolls everything back on failure. Existing conflicting tables cause an error; they are never dropped. Application startup does not silently apply migrations.

The API connects privately through `pg`, switches each transaction to the non-login, non-bypass `trimind_api` role, and sets the validated Supabase user ID as a transaction-local claim. Every user-owned table has forced RLS. Ordinary authenticated browser clients receive SELECT for their own rows only; quiz scores, simulator balances and plans cannot be written through the public database API. Account-owned foreign keys include the user ID.

The local automated tests apply the actual migration to PostgreSQL WASM (PGlite), create test-only Auth schemas/identities, and exercise SQL/RLS and constraints. Those test identities are not production authentication and do not replace live Supabase acceptance.

The configured owner project now has both additive migrations applied and verified over certificate-validated TLS. All 17 tables force RLS; catalog browser writes and migration-metadata access are explicitly revoked. See `BACKEND_STATUS.md` and `FINAL_ACCEPTANCE_HANDOFF.md` for actual live evidence and remaining release gates.
