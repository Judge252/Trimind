# TRIMIND production-candidate QA — 31 October 2026

**PARTIAL release. Local implementation, real configured integrations and packaged-function checks pass. Public promotion and the remaining account/inbox acceptance require owner action.**

| Check | Status | Evidence |
|---|---|---|
| TypeScript + Vite production build | PASS | Final build: 1,668 modules; no large-chunk warning |
| Vercel local production packaging | PASS | Node 22 function emitted; local Windows shell/path helper used; no publication |
| Packaged API runtime | PASS | Actual emitted function: health 200 against live TLS-verified Supabase, catalog 200/three courses, anonymous state 401 |
| Unit/domain/repository/API/PostgreSQL tests | PASS | 51 tests, zero failures; test-results/unit.tap |
| Focused backend check after final prompt change | PASS | 13 tests, zero failures; subset of the 51, not 13 additional unique tests |
| Existing feature browser suite | PASS | 24 checks; 0 browser/asset issues |
| Discovery/current-product browser suite | PASS | 12 checks; 0 browser issues |
| Responsive matrices | PASS | Existing 27 routes × EN/AR × 1440/768/320 = 162 inspections; new product 10 route/state variants at the same language/width combinations |
| Real seven-question onboarding | PASS | Completed in the real signed-in UI, saved to live account |
| Real Google Auth / refresh / logout / new sign-in | PASS | Browser OAuth/PKCE, confirmed provider session, logout returned to guest, fresh provider sign-in restored saved assessment/plan |
| Real Supabase schema and grants | PASS | Two applied migration receipts; 17 forced-RLS tables; no browser DML grants; API role nonlogin/nonbypass |
| Live RLS boundaries | PASS | Unrelated claim contexts cannot read the saved plans; authenticated catalog mutation denied; not two live account-session acceptance |
| Genuine runtime OpenRouter planning | PASS | Two normal requests; both completed and persisted versions 1/2. Known reported total $0.0005001; no model-selection requests |
| Live learning and project persistence | PASS | Lesson, server-scored 5/5 quiz, Builder result (18 hours / EGP 650) and competition project restored; version 2 retained 4/6 actual completed activities |
| Guest import protection | PASS | Real preview retained local work and refused draft collision. Successful/idempotent accepted-material import verified in SQL component tests, not live empty-account acceptance |
| Secret/artifact checks | PASS | 101 generated text files checked for the actual OpenRouter key and database URI; no findings; dependency packages not rescanned |
| Public HTTPS deployment | BLOCKED | Existing site is old commit b15acab, no production env, API/deep-route 404. Owner release approval pending |
| Email confirmation/recovery delivery | BLOCKED | No controlled-inbox receipt or password update performed |
| Two authenticated accounts / independent same-account browser | BLOCKED | Owner's second-account choice / matching independent sign-in required; no session or browser-storage copying used |

## Actual model usage

- Version 1: google/gemini-2.5-flash-lite; 599 prompt / 400 completion tokens; reported $0.0002199; complete.
- Version 2: google/gemini-2.5-flash-lite; 646 prompt / 539 completion tokens; reported $0.0002802; complete.

These are normal authenticated acceptance requests. The original selection registry and budget ledger were not rerun/reset. Selection's conservative $0.49 reservation is unrelated to the runtime total above.

## Evidence tiers

- PostgreSQL WASM/PGlite tests exercise the actual SQL, forced RLS, permissions, constraints, atomic publication and races. Their Auth identities/verifiers/provider responses are private test fixtures, not external acceptance.
- The hosted schema/grant probes, Google session, two OpenRouter requests, lesson/quiz/Builder/project writes and refresh/restoration above are real configured integrations from the local candidate.
- The Vercel-emitted function was executed locally after resolving its declared source asset map as the deploy packer does. An unrelated generated copy of the evaluation ledger was excluded; the original ledger was checked unchanged. This is packaging/runtime evidence, not a deployed HTTPS journey.
- The public domain remains an old release until the owner approves the concrete changes in RELEASE_READINESS.md. No production acceptance is fabricated.

## Performance, recovery and limits

The entry JS is approximately 87.66 kB (31.66 kB gzip), with separate shared React/router (261.19 kB) and Auth SDK (223.73 kB) chunks plus lazy feature routes. This is not an 87 kB total app claim. The previous 678+ kB monolithic chunk was split without suppressing Vite's warning threshold. Only Latin Inter and Arabic Noto font assets are packaged.

An earlier simultaneous local test/build attempt exhausted host memory; the final test command runs files serially and passed. Windows CLI subprocess environment casing required a local shell/path helper. Local rebuilds can invalidate an already-open lazy route; the app shows a reload recovery screen instead of a blank page, and saved account/guest data remains. The final suites ran against a stable build with zero browser errors.

No Docker build, physical-device, Firefox, Safari or screen-reader acceptance is claimed. Successful Google email verification is not SMTP receipt evidence. Founder and Investor were fully exercised in the guest browser/domain suites; only Builder was exercised through the real account UI in this run.

## Artifacts

- test-results/unit.tap; test-results/backend-final.tap
- test-results/browser-report.json; test-results/backend-ui/report.json
- test-results/live-schema.json; test-results/packaged-api.json
- test-results/secret-scan.json; test-results/release-inspection.json
- test-results/release-preview.png; backend-ui EN/AR screenshots at all three widths
- FINAL_ACCEPTANCE_HANDOFF.md: full acceptance table and remaining actions
- COMPETITION_DEMO.md: five-minute walkthrough and honest outage route

Old planning-browser/phase reports are historical and are not the current acceptance result.
