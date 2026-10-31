# TRIMIND — Phase 1

A complete bilingual React + TypeScript + Vite guest demo. Practical learning across Builder, Founder and Investor, with original illustrated project previews, nine lessons, fifteen quiz questions, three deterministic simulators, editable local project drafts, a bilingual learner assessment and deterministic personal demo plans.

## Run

Requires Node.js 22.12+ (or a supported newer Node release).

```powershell
cd 'D:\my  business\Trimind'
npm ci
npm run dev
```

Open the Local URL printed by Vite (normally http://127.0.0.1:5173).

The requested delivery directory also contains a runnable copy:
`C:\Users\LENOVO\Documents\Codex\2026-10-30\https-trimind-interactive-learning-platform-ai-6`.
Use either copy independently; future edits are not automatically synchronized.

```powershell
npm run build
npm test
```

Browser acceptance requires a locally installed Playwright Chromium. With the application already running:

```powershell
npx playwright install chromium
npm run test:browser
npm run test:planning-browser
```

`TRIMIND_URL` can point the browser suite to a production preview instead of the default dev URL. Browser artifacts are written to `test-results/` and are ignored by Git. Production output is `dist/`; use `npm run preview` to serve it. Do not open `dist/index.html` with a file URL.

## Judge walkthrough

1. Home → Personalise my learning / Try the demo → assessment → review → demo plan → My learning. You can also browse as a guest without assessment.
2. Complete a lesson and take its five-question quiz. The three courses are all open; prerequisites do not block exploration.
3. My plan shows the next real activity, knowledge summary, schedule and actual progress. Edit answers or regenerate with confirmation; older versions and completed work remain. Practice → select a simulator. Its rules and numbers are visible, fictional and repeatable.
4. Save a recap or an MVP plan explicitly to a project. Edit the draft, save, refresh, then download text or print the preview.
5. Profile shows recorded activity and preferences. Reset requires confirmation and removes only `trimind:phase1:v1`.

Progress begins at zero. There are no invented accounts, testimonials, student projects or sample activity. The home artwork is labelled illustrative. Login and signup are honest Phase 2 previews; they never authenticate or persist credentials.

## Boundaries

No API keys, backend, remote media, online saving or authentication. Fonts are bundled locally. Source, simulator calculations, repository contracts and Phase 2 integration requirements are documented in `PHASE_2_HANDOFF.md`. The original pitch deck and supplied reference material are preserved.
"# Trimind" 
