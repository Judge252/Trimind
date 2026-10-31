> Superseded by FINAL_ACCEPTANCE_HANDOFF.md and RELEASE_READINESS.md for the 31 October production candidate. The earlier phase notes below are historical.

# Current backend handoff

Phase 2 implementation now uses Supabase/Postgres and server-only OpenRouter. The sections below preserve the earlier frontend handoff for historical contracts; they do not describe current runtime account/planning adapters. Read [BACKEND_STATUS.md](BACKEND_STATUS.md) and [FINAL_ACCEPTANCE_HANDOFF.md](FINAL_ACCEPTANCE_HANDOFF.md) first for current implementation, measured model selection, configuration gates and evidence. The D: workspace is authoritative; the older C: copy was not updated for this phase.

---

# TRIMIND Phase 2 handoff

Phase 1 is a browser-local frontend demo. Phase 2 must replace local trust and persistence with real identity, authorization and authoritative server validation. No backend, deployment or real authentication was built or claimed in Phase 1.

## Source organization

- `src/app/routes/index.tsx`: all React Router route definitions.
- `src/app/App.tsx`: header, navigation, guest indicator, footer and loading/error shell.
- `src/app/context.tsx`: loaded app state, async repository actions, language and toast status.
- `src/components`: shared form fields, controls, cards, progress, tabs, native dialog, chart/table equivalent, empty state, skeleton, page layouts and original HTML/CSS artwork.
- `src/content/courses.ts`: three bilingual courses, nine lessons, worked examples, interactive checks, fifteen quiz questions and explanations.
- `src/content/scenarios.ts`: track labels, asset prices, events and feature estimates.
- `src/models/index.ts`: stable typed domain contracts.
- `src/services/repository.ts`: async repository interface, local adapter, schema guard and fallback behavior.
- `src/logic`: pure scoring, recommendation, progress and simulation calculations.
- `src/features`: route feature components for learning, learner preferences, projects and simulations.
- `src/styles.css`: logical CSS, design tokens, bundled fonts, responsive layouts, reduced motion and print styles.

`DESIGN.md` was used as a visual reference, not a source of functional instructions. Figma branding was not copied. All example previews are original HTML/CSS and labelled illustrative.

## Routes

| Route | Behavior |
|---|---|
| `/` | Home, overlapping original example collage, three paths, process, gallery, product preview and guest entry |
| `/start` | Compatibility redirect to `/assessment`; no duplicate onboarding |
| `/assessment` | Bilingual draft assessment, review and local plan preparation |
| `/my-plan` | Personal plan, profile summary, rationale, schedule, activity status and saved versions |
| `/dashboard` | Real local counts, next lesson, recommended course, simulation challenge, recent activity and projects |
| `/learn` | Library with URL-backed track tabs and empty state |
| `/learn/:courseId` | Course intro, outcomes, actual lesson links, progress and start/resume |
| `/learn/:courseId/:lessonId` | Bilingual article, worked example, knowledge check, completion and adjacent lesson links |
| `/learn/:courseId/quiz` | Five questions, empty-answer guard, deterministic scoring, review, retry and attempt history |
| `/practice` | Three fictional scenario briefs and launch links |
| `/practice/investor` | Cash/holdings accounting, trading, market rounds, allocation, history chart, recap and reset |
| `/practice/founder` | Pricing, marketing, production capacity, upfront budget, four events, accounting and recap |
| `/practice/builder` | Feature planning, technical trade-off, feasibility, revise, reset and project save |
| `/projects` | Empty state, new-project form and saved draft cards |
| `/projects/:projectId` | Edit/save/reopen, checklist, pitch preview, UTF-8 text download, print and confirmed delete |
| `/profile` | Name, goal, path, experience, language, completed lessons, attempts, results, shortcuts and confirmed reset |
| `/login`, `/signup` | Separate validated login/signup screens; signup includes name and confirmation; honest unavailable-service response and preserved destination |
| `/forgot-password` | Email validation and explicit no-delivery response |
| `/reset-password` | Missing/expired link state or new-password/confirmation preview; no token is treated as validated |
| `*` or invalid content/project ID | Consistent not-found page |

Course IDs: `build-your-first-mvp`, `validate-a-small-business`, `money-and-risk`. Lesson IDs are scoped by course; see the content module. Quiz routes precede lesson matching through React Router's route ranking.

## Models and repository contracts

The exported models include `Track`, `Course`, `Lesson`, `QuizQuestion`, `QuizAttempt`, `LearnerPreferences`, `LessonProgress`, `SimulationSession`, `SimulationResult` and `Project`. Content labels use `{ en, ar }`. `Track` is the stable union `builder | founder | investor`. IDs are stable strings; new mutable entities use browser-generated UUIDs; timestamps are ISO strings.

The async `Repository` exposes:

| Method | Contract |
|---|---|
| `read()` | Load the app snapshot; components render from context state |
| `getCourses()` | Read typed bilingual content; local adapter supplies fixtures |
| `savePreferences(preferences)` | Replace preferences |
| `completeLesson(progress)` | Idempotent by course ID + lesson ID |
| `saveAttempt(attempt)` | Append once by attempt ID |
| `saveSession(session, result?)` | Save active state and optionally append a result once by stable session/result ID |
| `saveProject(project)` | Upsert by project ID |
| `deleteProject(id)` | Remove one draft |
| `reset()` | Reset only this adapter's namespaced state |

All mutation methods return the updated snapshot. The frontend currently imports static course fixtures for route lookup and synchronous rendering as well as exposing `getCourses()`; Phase 2 should load content through the repository/context before rendering and retain an explicit loading/error state.

## Storage schema and behavior

Key: **`trimind:phase1:v1`**. JSON snapshot:

```text
version: 1
preferences: {name, goal, experience, track, language, onboarded}
lessons: [{courseId, lessonId, completedAt}]
attempts: [{id, courseId, answers, score, total, completedAt}]
sessions: {builder?: SimulationSession, founder?: SimulationSession, investor?: SimulationSession}
results: [{id, track, completedAt, summary}]
projects: [{id, title, track, problem, audience, solution, businessModel, features, updatedAt}]
```

`SimulationSession` contains `{id, track, state, finalized}`. State is the typed track-specific structure. Investor stores round, cash, unit holdings, round history and trade log. Founder stores round, cash and detailed per-round history. Builder stores selected feature IDs, technical choice and evaluated status. Results use numeric/string summary fields for history display.

Local data is structurally checked before rendering. Malformed or unsupported data loads a fresh in-memory demo and a visible notice; it is replaced only on the next explicit save. Storage read/write failures fall back to in-memory state with a visible nonpersistent-mode notice. Browser refresh cannot preserve in-memory-only work. Reset calls `removeItem` on this one key and never uses `localStorage.clear()`. No passwords or email addresses enter the repository.

The local adapter is a single-browser, single-active-tab demo, not a concurrency-safe database. JSON can be edited by the user and is not a security boundary. Phase 2 must introduce versioned migrations, conflict handling and server-controlled access.

## Simulation rules

### Investor

Starts with EGP 10,000 cash and zero holdings. Buy/sell accepts positive safe whole-unit quantities only. Buying requires enough cash; selling requires owned units. No fees, debt, fractional units or short selling. A trade at an unchanged price preserves total value.

Total value = cash + sum(units × current-round price). Four advance actions move from round 0 to round 4. Trades and advances are disabled after completion. The stable session ID prevents repeated finalisation from appending duplicate results. Reset starts a new session and retains completed history.

| Fictional asset | Round 0 | 1 | 2 | 3 | 4 |
|---|---:|---:|---:|---:|---:|
| Steady basket | 100 | 102 | 101 | 104 | 103 |
| Local makers | 100 | 108 | 94 | 102 | 110 |
| Spark ventures | 100 | 120 | 80 | 108 | 92 |

Events describe opening conditions, optimism, a demand shock, partial recovery and a mixed finish. Charts show end-of-round values, with an expandable text table. Cash is included in every chart point and final result. The relative risk descriptions are fictional educational properties, not market claims or investment advice.

### Founder

Starts with EGP 3,000; four rounds. Whole-number price 30–100, marketing 0–500, prepared boxes 1–60. Costs are funded before sales.

```text
upfront cost = prepared boxes × 25 + marketing + 200
demand = max(0, floor(event baseline − (price − 50) × 0.8 + marketing / 25))
sold = min(prepared boxes, demand)
revenue = sold × price
profit = revenue − upfront cost
new cash = previous cash + profit
```

Baselines are 40, 30, 50 and 35 for opening week, exams, campus fair and rain. Unsold stock has no salvage value and does not carry forward. When cash is less than EGP 225, no legal minimum-capacity round can be funded: the run ends early with a visible recap. Results remain simulated, not forecasts.

### Builder

A study planner must include task entry (5h/200), saved list (6h/250), completion (3h/100) and testing (4h/100). Optional calendar sync is 10h/400 and themes 3h/150. Browser storage adds no extra estimate; planning cloud integration adds 6h/300. This choice changes only the estimate and never creates a backend.

Feasible = all four core features selected AND total time ≤24h AND total cost ≤EGP 1,200. Empty or unknown selections are rejected. Over-budget/incomplete plans produce explanatory results and can be revised. A session adds a result once; resetting creates a new session. Explicit project save copies the current selected features and context to a new editable draft.

## Learning and progress

The old three-step onboarding has been merged into `/assessment`. `/start` redirects there. Learners can browse as guests without assessment; the dashboard retains the existing course continuation alongside assessment status and the current plan. The plan selects a primary path from the stated goal and selected interests; detailed rules appear below. Experience never locks content. Fresh progress remains zero.

Each course has three useful lessons with three substantive paragraphs, a worked example and a knowledge check. Reading-time labels are the sum of authored lesson minute estimates; course counts come from content arrays. Quiz scores count exact correct answers, with one point per question and no randomisation. Incomplete submissions are rejected. Results display the correct answer and explanation for every question. Retrying creates a distinct attempt ID.

## Backend integration requirements

1. Add real authentication and authenticated ownership to preferences, progress, attempts, simulations and projects. Keep guest entry and define explicit guest-to-account migration/consent.
2. Implement a remote `Repository` adapter. Load content asynchronously into context; add cancellation, retries and explicit network failure handling. Avoid importing mutable server content directly into page components.
3. Apply authorization and input validation on every server mutation. Never trust local quiz scores, prices, costs, cash, holdings, result summaries or session state. Recompute authoritative results from validated decisions and versioned rules.
4. Use unique constraints for `(learner, course, lesson)`, attempt IDs and session result IDs. Finalisation and state advancement must be transactional and concurrency-safe.
5. Store content/rule versions with attempts and results. Preserve stable route/content IDs and supply bilingual administration, review and migration tools.
6. Validate project lengths, supported features and locale. Currently project text is user-authored and remains in the language entered; existing drafts are not machine-translated when switching the interface.
7. Add server sessions, secure account recovery, rate limiting, database migrations and access tests. Do not introduce privileged secrets into browser bundles.
8. Configure production hosting to rewrite SPA routes to `index.html`. Verify direct reloads, Arabic layout, export/print and guest migration on actual deployed HTTPS before claiming deployment acceptance.

## Verification and limits

Run `npm run build`, `npm test`, and `npm run test:browser` against a running local app or set `TRIMIND_URL` to a production preview. Actual results are recorded in `QA_REPORT.md` and machine-readable `test-results/browser-report.json`. The browser suite covers the judge journey, direct routes, refresh, back/forward, focus/keyboard controls, overflow, both languages, project export and reset scoping. Screenshots and an actual Chromium print PDF are generated.

Known limits: no hosted/deployed verification, physical-device testing, Firefox/Safari coverage, screen-reader audit or real printer test. Project save is explicit; leaving without saving discards edits (browser-close warning is provided). Multiple simulator saves can intentionally create separate projects. Browser storage is not encrypted, online or cross-device. All authentication, database, administration and deployment work remains Phase 2 by design.

## Assessment and personal planning extension — 31 October 2026

This extension supersedes the earlier exclusion of assessment and personalisation. It extends the existing frontend; courses, articles, quizzes, simulator logic and project drafts remain intact. There is no separate three-step onboarding anymore. `/start` redirects to `/assessment`, and both assessment and account screens preserve guest browsing.

### Question and profile schemas

Typed models are in `src/models/planning.ts`; question fixtures are in `src/content/assessment.ts`.

| Model | Fields |
|---|---|
| `AssessmentQuestion` | Stable `id`, section, single/multi/select/text/scenario kind, bilingual title/hint/options, required flag; knowledge-only track/correct-option and optional experience follow-up condition |
| `AssessmentAnswer` | `questionId`, string or string-array `value`, `updatedAt` |
| `AssessmentDraft` | UUID, `schemaVersion:1`, `assessmentVersion:assessment-1`, monotonic answer `revision`, creation/update timestamps, intro/questions/review stage, current question ID and answer map |
| `AssessmentSubmission` | UUID, schema/assessment versions, draft ID/revision, submission timestamp and a snapshot of currently applicable answers |
| `LearnerProfile` | UUID, schema/assessment versions, assessment ID, created timestamp, goal, selected/primary/supporting paths, session minutes, days/week, target weeks, formats, connectivity, confidence, difficulty/support preferences, optional aspiration and starting knowledge per path |
| `LearningPlan` | UUID, schema/version, assessment version/ID, creation timestamp, `source:demo|server`, locale, paths, ordered activities, minutes, scheduled/target weeks and session/day limits |
| `PlanActivity` | Stable semantic ID, kind, track, actual course/lesson references, bilingual title, working URL, estimated minutes, supported presentation mode, review flag and session segments |
| `PlanGenerationResult` | `{learnerProfile, learningPlan}` |

The 20 core questions cover: goal, selected paths, experience separately for each of the three paths, session length, days per week, timeframe, preferred formats, optional aspiration, connectivity, six short knowledge scenarios and three support self-reports. Up to three extra knowledge questions appear only for paths with reported prior practice. Hidden follow-up answers are excluded from submissions and scoring when experience changes. Optional text is capped at 300 characters and asks learners to avoid personal/sensitive information.

Preferences are never scored right/wrong. Knowledge is counted separately per path: correct answers, answered count, unknown/skipped count and total questions. “I don’t know yet,” an unanswered optional scenario and the explicit skip action never imply proficiency. Starting labels use small transparent rules: no known answers → explore; all questions answered, at least two answers and at least two-thirds correct → try practice then review; otherwise → start with essentials. These are educational hints, not validated proficiency or psychological diagnoses. Support and confidence are self-reports, not fixed learner types.

### Local planning rules

Pure functions live in `src/logic/assessment.ts` and `src/logic/planning.ts`.

1. Keep only explicitly selected paths. If the main goal maps to a selected path (technology → Builder, business → Founder, money → Investor), put it first. Otherwise use stable Builder/Founder/Investor catalog order among selected paths. Other selected paths are supporting paths.
2. For an uncertain/developing starting point: three existing lessons, course quiz, matching simulator, then project. For a stronger result on the small knowledge set: simulator first, then the three lessons labelled review, quiz and project. No existing lesson is hidden, locked or falsely replaced by advanced content.
3. Example preference or a request for help through examples links lesson activities to the real `#worked-example` anchor. Otherwise a practice-first preference opens `#knowledge-check`. The complete article and both controls remain available. Reading starts at the article. Confidence/support/connectivity affect the actual displayed guidance and checklist; they are not diagnostic classifications.
4. Lesson minutes come from existing content. Quizzes/review are estimated at 10 minutes, Builder practice at 20, Founder/Investor practice at 25, and project work at 20. These are planning estimates, not measured completion promises.
5. Fill relative sessions without exceeding the chosen 10/20/30/45-minute budget or 1–5 learning days per week. Keep short activities together when they fit in a whole session; start a fresh session when needed. Activities longer than a session split into numbered parts. Day numbers are relative learning days, not calendar appointments.
6. Show the full finite catalog schedule and compare it with the 2/4/8/12-week target. Sessions beyond the target are marked explicitly; recommend fewer paths or more time rather than overload the learner. If the catalog finishes early, explain the limit instead of inventing months of modules. There are only three beginner courses and three simulators.
7. Completion is derived each render from existing records: completed lesson, any submitted quiz attempt, completed simulation result, or a saved same-track project with title/problem/audience/solution. This last condition is a draft milestone, not a project quality assessment. Split segments share the activity's real completion; viewing a schedule never marks work complete.

### Planning service and safety against stale results

`src/services/planning.ts` defines the replaceable asynchronous contract:

```ts
interface PlanRequest {
  assessment: AssessmentSubmission;
  contentCatalog: Course[];
  locale: 'en' | 'ar';
}
interface PlanningService {
  generatePlan(
    request: PlanRequest,
    options?: { signal?: AbortSignal; previewFailure?: boolean }
  ): Promise<PlanGenerationResult>;
}
```

The current adapter runs deterministic local rules. It yields to the event loop but adds no analysis delay, model animation or fake diagnostic pipeline. The result is labelled **“Demo plan based on your answers.”** No Gemini call has happened. The review screen includes an explicit, labelled one-attempt error preview so failure/retry can be demonstrated honestly. `previewFailure` is local demonstration instrumentation and must not be sent to a future production planning endpoint.

The hook in `src/features/planning/usePlanPreparation.ts` provides idle/preparing/success/error/cancelled states, a duplicate-request guard, AbortController cleanup on exit, and a request-sequence check before publishing. The local adapter is fast, so preparing/cancel controls can be brief; there is no artificial wait to make them appear impressive. Cancellation/stale guards are also directly tested.

Only a successful, validated result is atomically published with its submission. The repository compares draft ID/revision before saving and rejects stale answers. The same submission ID cannot append another version. A new confirmed regeneration uses a new submission ID and increases the saved plan version. Last valid plan, completed work and drafts remain if preparation fails. Error codes are `cancelled`, `invalid-assessment`, `catalog-unavailable`, `invalid-plan`, `unavailable`, plus repository `stale-assessment`/incomplete-answer rejection.

`validatePlanResult` checks shape, schema/source, profile fields, selected paths, exact activity IDs and URLs, actual catalog references, supported presentation, positive minutes, segment totals, day/week mapping, session capacity, unique activities and overall totals. It runs before publication and when reading saved plans. My plan revalidates before display.

### Additive persistence and repository methods

The existing **`trimind:phase1:v1`** key and outer `version:1` remain. A nested `planning` object is additive:

```text
planning: {
  schemaVersion: 1,
  draft?: AssessmentDraft,
  submissions: AssessmentSubmission[],
  plans: PlanGenerationResult[],
  activePlanId?: string
}
```

Old valid snapshots with no `planning` object load with an empty planning state. Existing preferences, lessons, attempts, simulations, projects and unrelated storage keys are preserved. Malformed planning records are quarantined independently instead of discarding otherwise valid learning data. Account fields never enter this structure. Local storage remains a demo boundary, not trusted or concurrency-safe server data.

Added repository operations are `saveAssessment(draft)`, `discardAssessment()`, `saveGeneratedPlan(submission,result)` and `activatePlan(id)`. Reset still removes only this app's single key, including planning. Draft changes and navigation are saved, including question/stage; switching language does not change answer values. Optional answer text remains in the language entered. Discard requires confirmation and removes only the current draft. Older submissions/plans and completed work stay intact. Selecting an older plan changes only the active plan and default path.

### Account frontend and future contracts

`src/features/Account.tsx` replaces the old combined account preview, using the existing fields/buttons/styles. `/login` has email/password/visibility, field/form errors, pending state, signup/recovery links and guest entry. `/signup` adds display name and confirmation. `/forgot-password` validates email. `/reset-password` handles missing/expired links, and a token-present preview supports new-password/confirmation validation while explicitly stating that the token is not validated. No token is accepted as proof of account ownership.

`src/services/auth.ts` exports a small `AuthService.submit(AuthRequest)` union for login/signup/recovery/reset. The demo always rejects with `phase-two-required`; it never reports successful authentication/account creation/email delivery/password update. Password fields are cleared after a service attempt. Inputs are transient component state; no account fields are written to storage, analytics or logs, and no fake session is created. `next` preserves an allowlisted internal destination through account links and guest entry; external and protocol-relative destinations are rejected.

Phase 2 must replace this adapter with real session-aware endpoints, validated recovery links and one-time token expiry/consumption. Use generic recovery responses on the server to avoid account enumeration. The server must verify return destinations again; client checks are not authorization.

### Server-only Gemini boundary

There is no Gemini SDK, key, API request or browser environment variable. Future integration should expose a server endpoint such as `POST /api/plans`:

```text
request:  {requestId, assessmentVersion, draftId, draftRevision, answers, locale, catalogVersion}
success:  {requestId, assessmentId, draftRevision, result: PlanGenerationResult}
failure:  {requestId, error: {code, retryable, messageKey}}
```

Expected failures include invalid input (400/422), unauthenticated/unauthorized (401/403), conflicting/stale revision (409), rate limit (429), unavailable or model/output validation failure (503/502), and cancellation/network interruption. Preserve the client's last valid plan until a successful matching response arrives.

The server owns the Gemini key and SDK, authenticates ownership, selects the authoritative versioned catalog/rules, sends only necessary learner answers to Gemini, validates structured model output and referenced content IDs, and applies safe scheduling limits. Never trust client scores, profile labels, totals or progress. Use selected-path knowledge and relevant constraints; exclude email, passwords, recovery tokens and unrelated learner data. Optional free text needs clear privacy/retention rules. Do not log raw sensitive inputs. Server replies use `source:server`; existing demo versions remain labelled `demo`.

Do not add chatbot, voice, video generation or model-selection features as part of this integration. Personalisation is the AI support boundary.

### Guest migration and remaining gaps

When real accounts exist, obtain explicit consent before associating browser-local assessment drafts, submissions, plans and learning activity with an account. Show exactly what will migrate. Validate every record server-side; deduplicate by stable lesson/attempt/session/project/plan IDs, resolve conflicting draft revisions, and preserve provenance/rule versions. Do not silently upload an unrelated guest's data from a shared browser. Support export, deletion and logout/local-data choices. No fake cloud migration was implemented here.

Remaining Phase 2 work: actual authentication/email/reset delivery, authenticated database ownership, online/cross-device saving, concurrency/conflict resolution, versioned content administration, production retention/privacy controls, server-only Gemini and deployment. Local browser tests do not constitute hosted, physical-device, screen-reader or cross-browser acceptance. See the updated `QA_REPORT.md` for checks actually run on this extension.
