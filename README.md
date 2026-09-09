# Greenbriar portco meeting scheduler

Demo web app for the Greenbriar AI Council, 2026-09-14. One board, five portfolio companies, six stages, an agent that does the work at each stage when the EA presses a button. Mock data only. Read `CLAUDE.md` and `docs/` before changing anything.

## Run

```
npm install
cp .env.example .env.local
npm run dev
```

Opens on http://localhost:3000 at the mock sign-in. Lands on Portfolio with the `council` state: eighteen real portfolio companies across four EAs, AIT Worldwide Logistics not started.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build, also type-checks |
| `npm test` | Unit tests for `lib/scheduling.ts` |
| `npm run import:source` | Build `partners.json`, `portcos.json`, `board-members.json` from `data/source` plus the fiction table in the script |
| `npm run gen:fixtures` | Rebuild `data/availability.json` and `data/venues.json` |
| `npm run gen:states` | Rebuild `data/demo-states.json` by running the app's own transitions with the mock templates. Run after `gen:fixtures` |
| `npm run gen:mock` | Write `data/mock-agent-outputs.json` as a preview of every agent step. Add `-- --live` to preview Claude's wording. The app does not read this file |
| `npm run test:e2e` | Playwright walkthrough of Cumberland through all five stages in mock mode, plus the jump-ahead path. Starts its own dev server on port 3111 |
| `node scripts/demo-shots.mjs <outDir> [baseUrl]` | Walks the demo and saves a screenshot per beat |

## Regenerating data

Order matters: `import:source`, then `gen:fixtures`, then `gen:states`. `eas.json` is hand-edited. The other names files come from the import.

## Modes

`MOCK_MODE=true` (default) renders agent drafts from templates in `lib/mockAgent.ts` over the live shortlist, with a short working delay. No network needed. `MOCK_MODE=false` posts the generative steps to `app/api/agent/route.ts`, which calls the agent with the key from `.env.local`. If a live call fails, the app serves the mock output and tags the draft "Offline draft". The presenter menu (Shift+P) toggles modes at runtime.

## Presenter menu

Shift+P or the icon in the header. Reset to council, jump to a saved state, toggle mock or live, show or hide the demo buttons. The simulations themselves live inside each waiting state as "Demo:" buttons.

Saved states: `fresh`, `council` (the room default), `council-at-board` (start at Beat 4). Loading a state fills the reply-by date and shifts timestamps so they read as recent.

## Status

Phase 5a to 5c built: real Greenbriar companies and deal teams, faces and logos through the workflow, the Portfolio rename, rows and board per `reference/design`, one structured email renderer, the decline view. Next: 5d type scale and design pass, 5e Attendance, 5f People, Settings, Templates. See `BUILD_PLAN.md`.
