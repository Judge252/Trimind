# TRIMIND backend status — 31 October 2026

**PARTIAL release: live local Supabase/Google/AI/learning persistence verified; public promotion requires owner approval.** Authoritative source: `D:\my  business\Trimind`. The old public Vercel site is a different, outdated release.

## Operational backend

The owner's ignored environment now contains matching server/public Supabase settings and the private database/OpenRouter settings. Values were never printed. Supabase Auth settings returned HTTP 200 with Google and email enabled, signup permitted and email confirmation required. The configured Auth Site URL is currently the local `http://127.0.0.1:4173`, with its development redirect allowlist. Production callbacks remain a release step.

The initial database connection failed with `SELF_SIGNED_CERT_IN_CHAIN`. The fix uses Supabase's published database CA while keeping chain and hostname verification enabled. It does not disable TLS verification. A read-only probe found no public tables and a migration-owner connection, so the additive core migration was applied. A second additive migration closes Supabase's default browser grants on the catalog and protects migration metadata. Both migration receipts were verified in the actual hosted database.

All 17 public tables have enabled and forced RLS. Browser roles have no DML grants. `trimind_api` cannot log in or bypass RLS. API transactions set this restricted role and the identity obtained from Supabase token verification; per-account locks and idempotency receipts serialize authoritative operations. Live SQL checks under unrelated claim contexts could not see the saved plan; authenticated catalog mutation was denied. This is actual live SQL evidence, not proof of two distinct authenticated account sessions.

## Actual live learner evidence

A genuine Google OAuth/PKCE flow completed through the browser, created a confirmed Supabase learner session and returned to the assessment. Seven questions were completed through the real UI. The draft was stored in the live database. Two normal OpenRouter generations completed and produced catalog/prerequisite/workload-validated bilingual plans, saved as versions 1 and 2. Reloading and a fresh Google sign-in retrieved the saved journey. Version 2 retained all actual completed work.

Normal generation metadata: primary `google/gemini-2.5-flash-lite`; version 1 used 599/400 prompt/completion tokens ($0.0002199), version 2 used 646/539 ($0.0002802). Reported total: **$0.0005001**. This is normal acceptance usage, separate from model selection. No selection benchmarks were rerun.

Live account operations also saved/restored a lesson, a server-scored 5/5 quiz, a canonical Builder simulation result (18 hours, EGP 650, feasible), and the clearly labelled competition project. Dashboard retrieved these records. Guest import preview preserved browser material and correctly refused to replace an existing account draft; accepted-material live import remains a separate test.

See `test-results/live-schema.json`, the browser observations summarized in `FINAL_ACCEPTANCE_HANDOFF.md`, and `QA_REPORT.md`. No tokens, account identifiers or raw private profile data are included in the evidence files.

## Seven-question contract and compatibility

New drafts use `assessment-2`: ambition, stated experience, motivation, learning preference, structured weekly availability, one relevant domain scenario and a progress challenge. The visible count is exactly seven. Unknown/skipped scenario answers do not imply proficiency. One correct answer cannot produce a ready/proficient placement; actual lesson checks and course quizzes remain available.

`assessment-1` drafts, submissions and plans retain their original schema and question meanings. They are validated and hydrated separately, including guest imports. No migration rewrites answers or relabels self-report as demonstrated knowledge. The database JSON envelope already stores the assessment version, so no destructive data rewrite was necessary. Defaults used for conservative scheduling are distinguished from learner claims in the AI input.

## AI and security guarantees

Only validated learning constraints/preferences, small starting-point results and canonical catalog activities leave the server. Names, email, user IDs, project data and optional free text are excluded. Model output must use an exact permutation of available activities, preserve prerequisites and fit server-generated session capacity. Success is published atomically; stale/duplicate requests and failure preserve the last good plan. The browser never calls OpenRouter or writes privileged score/simulation/plan rows.

Primary and fallback remain `google/gemini-2.5-flash-lite` / `google/gemini-2.5-flash`, explicitly routed to `google-ai-studio`, with collection denied and provider fallbacks disabled. Strict zero-retention routing was unavailable in the original evaluation; zero retention is not claimed. The immutable evaluation report remains `server/model-selection.json`; the local ledger's conservative reservation remains $0.49 of its $0.50 cap. The ledger is excluded from production packaging and has not been reset or deleted.

Normal generation keeps server rate/cost limits, explicit retry rules and minimal metadata. Serverless attempts are capped at 22 seconds each inside a 60-second function budget; there is at most one explicitly allowed evaluated fallback for a provider refusal/rate/unavailability response. Invalid output and ambiguous timeouts never silently become local “AI” plans.

## Runtime and release

The local entry serves the production SPA and API together at port 4173, preserving the original guest origin. The Vercel entry reuses the same handlers as an awaited function without listening on a port. Node ESM imports are explicit so the emitted function can execute on Node 22. TLS CA and evaluated model registry are declared assets. `vercel.json` restores deep-route refreshes and routes API requests to the real backend.

Current Vercel inspection: old commit `b15acabe9333820bfd060700b0ae2a67f8fd1bd3`, Phase 1 JavaScript, no configured production environment variables, and 404 responses for `/login`, `/api/health`, `/api/catalog`. No production hosting change has been made. Read `RELEASE_READINESS.md` for the exact proposed change and rollback boundary.

## Configuration inventory — names only

Configured locally: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODEL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DATABASE_SSL`, matching `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`, `PORT`, `APP_ORIGIN`.

Optional: `DATABASE_CA_CERT`, `OPENROUTER_MAX_COST_USD`, `OPENROUTER_TIMEOUT_MS`, `HOST`, `VITE_API_URL`. Private values never belong in `VITE_*`. The original owner environment is retained; no env-example files were recreated.

## Remaining acceptance boundaries

- Production environment, callback settings, deployment/promotion and HTTPS authenticated smoke require the owner's release approval.
- Email/password signup confirmation, actual recovery delivery/password update require a controlled inbox/account. Enabled Auth settings and successful Google login do not prove email delivery.
- A second Google account was offered in another browser; its use is pending owner clarification. No unrelated account was selected. Two-account UI isolation and independent-browser same-account restoration are not claimed.
- Founder/Investor calculations and concurrency are regression-tested locally; only Builder was exercised through the real signed-in UI in this run.
- Docker, physical devices, Safari/Firefox and screen-reader acceptance are not claimed.

Official references: [Supabase TLS verification](https://supabase.com/docs/guides/platform/ssl-enforcement), [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google), [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js), [OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection).
