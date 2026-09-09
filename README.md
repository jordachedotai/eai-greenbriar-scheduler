# Greenbriar portco meeting scheduler

Demo web app for the Greenbriar AI Council, 2026-09-14. One board, five portfolio companies, six stages, an agent that does the work at each stage when the EA presses a button. Mock data only. Read `CLAUDE.md` and `docs/` before changing anything.

## Run

```
npm install
cp .env.example .env.local
npm run dev
```

Opens on http://localhost:3000 at the mock sign-in. Lands on Portcos with the `council` state: fifteen portcos across three EAs, Cumberland not started.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build, also type-checks |
| `npm test` | Unit tests for `lib/scheduling.ts` |
| `npm run gen:fixtures` | Rebuild `data/availability.json` and `data/venues.json` |
| `npm run gen:states` | Rebuild `data/demo-states.json` by running the app's own transitions with the mock templates. Run after `gen:fixtures` |
| `npm run gen:mock` | Write `data/mock-agent-outputs.json` as a preview of every agent step. Add `-- --live` to preview Claude's wording. The app does not read this file |
| `npm run test:e2e` | Playwright walkthrough of Cumberland through all five stages in mock mode, plus the jump-ahead path. Starts its own dev server on port 3111 |
| `node scripts/demo-shots.mjs <outDir> [baseUrl]` | Walks the demo and saves a screenshot per beat |

## Regenerating data

Order matters: `gen:fixtures`, then `gen:states`. Names files (`partners.json`, `eas.json`, `portcos.json`, `board-members.json`) are hand-edited and never overwritten.

## Modes

`MOCK_MODE=true` (default) renders agent drafts from templates in `lib/mockAgent.ts` over the live shortlist, with a short working delay. No network needed. `MOCK_MODE=false` posts the generative steps to `app/api/agent/route.ts`, which calls the agent with the key from `.env.local`. If a live call fails, the app serves the mock output and tags the draft "Offline draft". The presenter menu (Shift+P) toggles modes at runtime.

## Presenter menu

Shift+P or the icon in the header. Reset to council, jump to a saved state, toggle mock or live, show or hide the demo buttons. The simulations themselves live inside each waiting state as "Demo:" buttons.

Saved states: `fresh`, `council` (the room default), `council-at-board` (start at Beat 4). Loading a state fills the reply-by date and shifts timestamps so they read as recent.

## Status

Phase 4 built: five stages, login and shell, rows and board views, work strip, detail page with stepper and pinned action bar, calendar, presenter controls, three Playwright tests. Next: rehearse per `docs/DEMO_SCRIPT.md`, swap in real names if they land. See `BUILD_PLAN.md`.
