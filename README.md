# TRIMIND

An English/Arabic practical learning product spanning Builder, Founder and Investor. The authoritative workspace is `D:\my  business\Trimind`.

The current candidate includes a seven-question discovery, Supabase authentication and account persistence, server-owned learning/simulation operations and an OpenRouter-assisted catalog-validated roadmap. The existing public Vercel URL remains an older build until the owner approves release. See [acceptance handoff](FINAL_ACCEPTANCE_HANDOFF.md) and [backend evidence](BACKEND_STATUS.md).

## Run locally

The owner-provided `.env` is ignored and must remain private. No env-example files are required. Variable names and scopes are documented in BACKEND_STATUS; never put private credentials in `VITE_*`.

```powershell
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4173. Keeping this origin preserves the existing guest browser data. `/api/health` checks actual database availability; `/api/catalog` exposes the canonical bilingual content. The two additive migrations have already been applied to the configured Supabase project. `npm run db:migrate` is idempotent, but inspect the intended target before applying future schema changes.

For frontend development, use `npm run dev` and run `npm run dev:api` with `PORT=3001` and `APP_ORIGIN` set to the actual Vite origin. The Vite proxy points `/api` to port 3001. Authentication redirect allowlists must match the chosen origin.

## Verification

```powershell
npm test
$env:TRIMIND_URL='http://127.0.0.1:4173'
npm run test:browser
npm run test:product-browser
node --env-file=.env --import tsx scripts/verify-live-schema.ts
```

Regression fixtures are not live provider acceptance. Current measured results are in [QA_REPORT.md](QA_REPORT.md). Do not rerun model selection: the evaluated model registry and original budget ledger remain intact. Normal authenticated planning uses the evaluated primary and explicit fallback under separate runtime cost/rate controls.

## Production and demonstration

[RELEASE_READINESS.md](RELEASE_READINESS.md) describes the existing Vercel project, same-origin API function, required production environment/callback changes, approval boundary and rollback. Standard local packaging uses `npx vercel build --prod --yes`; the documented Windows helper addresses local command-path casing. Packaging is not publication. Run `scripts/verify-packaged-api.mjs` and `scripts/verify-release-secrets.mjs` with `.env` loaded before publishing a prepared artifact.

[COMPETITION_DEMO.md](COMPETITION_DEMO.md) provides a five-minute walkthrough and truthful outage presentation. Existing routes, nine lessons, quizzes, all three fictional simulators, projects, text/print exports and guest progress remain supported. Earlier phase handoffs and old test reports are historical, not current public acceptance.
