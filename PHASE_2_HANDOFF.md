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
| `/start` | Three steps; goal, experience, preferred path; back and skip; preferences can be changed later |
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
| `/login`, `/signup` | Accessible preview forms with visibility control and validation; explicit Phase 2 limitation; guest entry |
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

Recommendation is transparent: the selected path maps to its single beginner course. Choosing the money goal initially suggests Investor; choosing project creation initially suggests Founder, but the last step allows all paths. Experience does not profile the learner or lock content. Fresh state is zero and there is no sample-progress injection.

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
