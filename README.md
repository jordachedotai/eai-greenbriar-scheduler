# Greenbriar portco meeting scheduler

Demo web app for the Greenbriar AI Council, 2026-09-14. One board, five portfolio companies, six stages, an agent that does the work at each stage when the EA presses a button. Mock data only. Read `CLAUDE.md` and `docs/` before changing anything.

## Run

```
npm install
cp .env.example .env.local
npm run dev
```

Opens on http://localhost:3000 with five portcos in Setup.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build, also type-checks |
| `npm test` | Unit tests for `lib/scheduling.ts` |
| `npm run gen:fixtures` | Rebuild `data/availability.json` and `data/venues.json` |
| `npm run gen:states` | Rebuild `data/demo-states.json` by running the app's own transitions over the mock outputs. Run after `gen:fixtures` or `gen:mock` |
| `npm run gen:mock` | Rebuild `data/mock-agent-outputs.json` from templates, no network. Add `-- --live` to draft with the agent instead, then hand-check |
| `npm run test:e2e` | Playwright walkthrough of one portco through all six stages in mock mode. Starts its own dev server on port 3111 |
| `node scripts/smoke-shot.mjs <outDir> [baseUrl]` | Headless screenshots of the board and drawer, prints console errors |
| `node scripts/demo-shots.mjs <outDir> [baseUrl]` | Walks the demo and saves a screenshot per beat |
| `node scripts/state-shots.mjs <outDir> [baseUrl]` | Loads saved states and screenshots the board |

## Regenerating data

Order matters: `gen:fixtures`, then `gen:mock`, then `gen:states`. Names files (`partners.json`, `portcos.json`, `board-members.json`) are hand-edited and never overwritten.

## Modes

`MOCK_MODE=true` (default) serves pre-written agent outputs from `data/mock-agent-outputs.json` with a short working delay. No network needed. `MOCK_MODE=false` posts the generative steps to `app/api/agent/route.ts`, which calls the agent with the key from `.env.local`. If a live call fails, the app serves the mock output and tags the draft "Offline draft". The presenter menu (Shift+P) toggles modes at runtime.

## Presenter menu

Shift+P. Simulate partner sign-offs, the portco reply, board confirmations, or a board conflict in Q3. Toggle mode. Jump to a saved state. Reset.

Saved states: `fresh`, `one-portco-at-shortlist`, `one-portco-at-board` (start at Beat 5), `one-portco-locked`, `all-in-flight`. Loading a state fills the reply-by date and shifts the timeline so it reads as just now.

## Status

Phase 3 done: saved demo states, presenter menu complete, brand and wording pass, three Playwright tests (full walkthrough, jump-ahead from Beat 5, all-in-flight and reset). Next is Phase 4: rehearse per `docs/DEMO_SCRIPT.md`, swap in real names if they land. See `BUILD_PLAN.md`.
