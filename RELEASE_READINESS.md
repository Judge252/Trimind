# TRIMIND release preparation — 31 October 2026

## Established source/deployment difference

Authoritative source: `D:\my  business\Trimind`. The existing Vercel project is `judge252s-projects/trimind`, connected to `Judge252/Trimind`, production branch `main`.

Read-only Vercel API inspection showed production commit `b15acabe9333820bfd060700b0ae2a67f8fd1bd3` at `trimind-xi.vercel.app`. Its JavaScript contains the Phase 1 footer, long assessment and preview-login copy. Both `/api/health` and `/api/catalog` return 404; refreshing `/login` also returns 404. Production project environment inventory was empty. The old public site is therefore not acceptance evidence for this candidate.

No production environment, domain, deployment or Supabase redirect setting has been changed in this release preparation. Linking the local Vercel CLI and pulling its project metadata did not publish anything. CLI-created `.env.local`/`.vercel` files are ignored and must never be committed.

## Prepared architecture

Vercel serves `dist` and routes `/api/*` into `api/index.ts`, which reuses the exact `createApplication()` HTTP request handlers without starting a listening server. The local long-running entry remains `server/index.ts`. The same Supabase verifier, per-account database transactions, forced RLS, idempotency and domain rules are used in either entry. There is no privileged browser substitute.

`vercel.json` supplies deep-route rewrites, security headers, the 60-second function ceiling and explicit packaged model-registry/database-CA files. Node 22 matches the tested runtime; `package.json` overrides the project's older Node-26 setting. API pool size is limited to two per serverless instance. Generation attempts remain bounded by server timeouts and database rate/idempotency records. Deploying a frontend alone will not activate these services.

Use the Supabase pooler appropriate to the deployment's network. The API uses transactions and transaction-local roles/claims; it does not depend on session-level identity. TLS chain and hostname checking stay enabled, using Supabase's published public CA. `DATABASE_CA_CERT` can override the CA for a different approved database.

## Concrete production change requiring owner approval

1. Save the reviewed source as a release commit and ensure the connected production branch receives that exact source, or publish that exact source with the authenticated Vercel CLI and then synchronize Git before later automatic releases. Do not push `main` early: its integration can deploy automatically.
2. Configure the existing Vercel project's production variables from the ignored local environment, without printing values. Server only: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DATABASE_SSL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODEL`. Set `APP_ORIGIN=https://trimind-xi.vercel.app`. Build-time public: matching `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Leave `VITE_API_URL` empty for same-origin requests. Never prefix private variables with `VITE_`.
3. In Supabase Auth, retain the local development redirect and add the production `/auth/callback` redirect pattern, including intended-route query variants. Set the Site URL to `https://trimind-xi.vercel.app`. Google's authorized redirect remains the Supabase `/auth/v1/callback`, not the frontend callback. Do not alter OAuth scopes or disable email verification.
4. Deploy the prepared source to the existing project, wait for READY, and verify the production alias points to the new deployment. Do not create paid services or assume a separate localhost backend exists online.
5. Run HTTPS health/catalog/anonymous-denial/deep-route checks and the real authenticated journey on the public origin. Inspect actual function responses/log codes. Confirm bundle secrecy and callback/session restoration. Only then change the deployment acceptance row to PASS.

The owner explicitly required approval for live hosting changes in the production brief. This preparation does not supply that approval.

## Rollback

Retain the previous READY deployment identifier from `test-results/release-inspection.json`. If public smoke fails, stop promotion or restore the previous production alias through the existing Vercel project, then report that the rollback restores an older prototype rather than a functional Phase 2 release. Keep the additive database schema and account data; do not drop tables or undo migrations as a hosting rollback. Do not revoke credentials or delete user progress.

## Reproducible verification and boundaries

Run `npm test`, `npm run build`, `npm run test:browser` and `npm run test:product-browser` with `TRIMIND_URL=http://127.0.0.1:4173`. `npx vercel build --prod --yes` performs local Vercel packaging; on this Windows host invoke its installed CLI entry through `node --require ./scripts/windows-spawn.cjs <Vercel-CLI-entry> build --prod --yes`. The helper normalizes duplicate PATH/Path entries in subprocesses and resolves the native command shell. It has no effect on application security or Linux production runtime. Packaging is not deployment.

The Vercel production environment was empty when pulled. Frontend public values for the candidate come from the owner's ignored `.env`; runtime secrets must still be configured explicitly on Vercel after approval. Do not upload local environment files. `.vercelignore` excludes them and the evaluation ledger.

Official references: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel function configuration](https://vercel.com/docs/project-configuration#functions), [Supabase verified TLS](https://supabase.com/docs/guides/platform/ssl-enforcement). Public database certificate source: [Supabase downloads](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt).

