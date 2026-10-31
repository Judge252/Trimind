# TRIMIND final acceptance handoff — 31 October 2026

**PARTIAL: the local account-backed journey works with real Supabase, Google and OpenRouter. The public URL still serves the old prototype. Production changes await owner approval.**

## Acceptance matrix

| Area | Status | Actual evidence / boundary |
|---|---|---|
| Latest build | PASS | Frontend/server TypeScript and Vite; actual Vercel local packaging also completed using the Windows command-path helper. See QA for final packaged-runtime check. |
| Onboarding | PASS | Exactly seven `assessment-2` questions completed in the signed-in UI; actual saved draft. Legacy `assessment-1` remains separate and compatible. |
| AI personalization | PASS | Two real normal OpenRouter requests; validated bilingual roadmaps persisted as versions 1/2; reported total $0.0005001. Completed work retained. |
| Supabase | PASS | Two additive migrations applied safely to the initially empty public schema; receipts and verified TLS checked; all 17 tables force RLS. |
| Authentication | PASS | Genuine Google OAuth consent → Supabase PKCE exchange → confirmed learner session → assessment. Refresh restored the session; actual logout and fresh Google sign-in restored saved work. Email/password/delivery checks are separately blocked below. |
| Learning progress | PASS | Live lesson completion and backend-scored 5/5 quiz saved and retrieved after refresh. |
| Simulations | PASS | Live Builder decisions/evaluation persisted: complete core, 18 hours, EGP 650, feasible. All three domain calculations and races covered in local regression. |
| Projects | PASS | Live simulation-to-project creation, explicit edit/save and retrieval of the competition study-planner draft. |
| Cross-device/browser | BLOCKED | Independent-browser same-account sign-in needs an available matching login; no copied storage or fixture has been used. |
| Isolation | BLOCKED | Live forced-RLS tests denied non-owner reads and browser writes; local account-switch/concurrency tests pass. Two real signed-in account sessions await the owner's account choice. |
| EN/AR experience | PASS | Desktop/tablet/mobile route and discovery checks at 1440/768/320; screenshots and reports under test-results. |
| Deployment | BLOCKED | Read-only evidence confirms the existing public site is outdated. Owner authorization is required before production env/callback changes and promotion. |
| Security | PASS | Server-only provider/database credentials, verifier-owned identity, restricted transactions, forced RLS and output validation. Final bundle scan evidence is in QA. |
| Email confirmation/recovery | BLOCKED | No controlled inbox verification or password update performed. Google-confirmed email is not evidence of SMTP delivery. |
| Accepted-material guest import | BLOCKED | Real preview and collision protection checked; local SQL tests cover successful/idempotent import. No eligible material was imported live into an empty account. |

PASS rows apply to the stated evidence tier, not public deployment or untested browsers/devices. Read QA for exact current regression counts and any operational limitations.

## Product changes

The landing page now explains personalized practical learning and exposes Log in/Get started. Navigation emphasizes My learning, My journey, Learn, Practice, Projects and Account while preserving old direct routes. Discovery starts immediately, saves each answer and requests authentication at AI creation. The roadmap shows the recommended start, AI rationale, weekly rhythm, real activities and milestones. The Dashboard leads with the next incomplete activity. Secondary details are progressively disclosed.

A new assessment is not a silent replacement of saved answers. Version-one learners continue their original assessment. Fresh learners see seven questions with one track-specific scenario. Self-reported experience never promotes a learner past fundamentals. Existing lesson checks, quizzes, fictional simulations, project editing/export and all three paths remain.

## Continue the release

1. Review the local candidate at http://127.0.0.1:4173 and the screenshots in QA.
2. Approve the concrete production operation in `RELEASE_READINESS.md`: configure the existing Vercel project's production variables, add production Supabase callback/Site URL settings while retaining local development, and deploy the reviewed source to `https://trimind-xi.vercel.app`.
3. Wait for the actual new deployment to be READY, verify its production alias and run health/catalog/deep-route/secret checks over HTTPS. Then complete the authenticated public-origin journey.
4. Use the owner's chosen second account for two-account checks and a fresh independently authenticated browser for restoration. Do not copy localStorage or fabricate tokens as acceptance.
5. Verify actual confirmation/recovery email receipt with a controlled inbox. The user must complete any password-changing UI handoff. Do not disable email confirmation to bypass the test.

No deployment, production environment update, paid infrastructure purchase, model-selection rerun or destructive database operation has been performed.

## Verification commands

```powershell
cd 'D:\my  business\Trimind'
npm test
npm run build
npm start
# In another terminal:
$env:TRIMIND_URL='http://127.0.0.1:4173'
npm run test:browser
npm run test:product-browser
node --env-file=.env --import tsx scripts/verify-live-schema.ts
```

Use `npx vercel build --prod --yes` for normal local Vercel packaging. On this Windows host, invoke the installed CLI entry with `node --require ./scripts/windows-spawn.cjs <Vercel-CLI-entry> build --prod --yes`; the helper only normalizes local command-path handling. It does not affect deployed application security. After packaging, `node --env-file=.env scripts/verify-packaged-api.mjs` checks the emitted Node function locally, resolving Vercel's declared source asset map as its deploy packer does. Local packaging is not a hosted smoke test.

Do not rerun the model-selection benchmark. `server/model-selection.json` and its existing ignored ledger remain intact. Normal acceptance uses genuine provider requests with bounded cost and safe synthetic learning inputs.

## Competition handoff

`COMPETITION_DEMO.md` contains the five-minute script, preflight and truthful outage route. A saved, previously generated live journey may be used when clearly identified as earlier work. Recorded material and guest-only fallbacks must not be represented as live synchronization.
