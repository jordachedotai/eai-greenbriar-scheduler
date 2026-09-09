# Greenbriar Portco Meeting Scheduler: POC Build Brief

You are building a demo web app for the Greenbriar AI Council (target date 2026-09-14). It shows an Executive Assistant's quarterly portfolio-company meeting scheduling running as one tool: a pipeline board where each portco moves through six stages, and an agent does the work at each stage when the EA presses a button.

The sponsor is Peggy Conway, EA at Greenbriar. Today this takes her about two months per portco by hand. She handles five portcos. Two other EAs handle five each. Four quarterly meetings per portco in 2027, each with a dinner, plus travel.

Read `docs/PRD.md`, `docs/DATA.md`, `docs/AGENT.md`, `docs/DEMO_SCRIPT.md`, and `BUILD_PLAN.md` before writing code. They are the source of truth. Do not redesign the workflow. Peggy's flow is the product.

## Hard rules

- **Mock data only.** No real calendars, no real email, no real names until the fixture swap. Everything comes from JSON fixtures in `/data`. No Outlook, Microsoft Graph, or DealCloud calls. Ever, in this repo.
- **One tool on screen.** The demo never shows Copilot, Claude.ai, or a chat window. The user sees a board, cards, buttons, and results.
- **Every AI output is a draft with an Approve button.** Nothing gets "sent" or "locked" without the EA clicking. This matches Greenbriar's AI Usage Policy: decision support, human in the loop.
- **Mock mode must work with no network.** The room may have bad wifi. `MOCK_MODE=true` serves pre-generated agent outputs from fixtures with a short typing delay. `MOCK_MODE=false` calls the Claude API for the generative steps only. Both paths produce identical UI.
- **Data access goes through `lib/data.ts`.** Fixtures today. Later it can be swapped for a real backend without touching components.
- **No em-dashes anywhere in UI copy.** Short sentences. Plain words. The EA is the reader, not a developer.

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4. Same as `~/Documents/Tools/eai-medalist`.
- `@anthropic-ai/sdk` for live mode. Model: `claude-sonnet-5` for drafting steps. Read `docs/AGENT.md` for the calls.
- Client state in React (Zustand is fine if it helps). No auth. No database. Deploy target: Vercel, or run locally on a laptop in the room.
- State persists to `localStorage` so a rehearsal can be resumed. A "Reset demo" control clears it.

## Suggested structure

```
app/                  # one page, client-side view switching
components/
  Board/              # pipeline columns and portco cards
  PortcoDetail/       # the drawer or page for one portco: per-quarter status, stage actions
  Stages/             # one component per stage action (Availability, Shortlist, Approval, PortcoSend, BoardSend, Logistics)
  Drafts/             # draft viewer with Approve / Edit / Regenerate
  Presenter/          # hidden presenter menu: simulate replies, reset, jump to state
  Metrics/            # the header strip: portcos, meetings locked, days vs months
data/
  partners.json  portcos.json  board-members.json  availability.json
  venues.json    mock-agent-outputs.json  demo-states.json
lib/
  data.ts             # single data-access layer
  scheduling.ts       # pure functions: availability intersection, 4-hour block finder, top-3 ranking
  agent.ts            # live vs mock agent calls, one function per stage
  types.ts
docs/                 # the brief (PRD, DATA, AGENT, DEMO_SCRIPT)
```

## Definition of done

1. `npm run dev` opens the board with five portcos in the Setup column and the metrics strip reading 0 of 20 meetings locked.
2. A presenter can walk one portco through all six stages in under four minutes using only the on-screen buttons and the presenter menu, per `docs/DEMO_SCRIPT.md`.
3. Every agent step shows its output as a draft, and the card does not advance until Approve is clicked.
4. Mock mode runs the full walkthrough with wifi off.
5. Swapping `data/partners.json` and `data/portcos.json` for real names requires no code changes.
6. No console errors. Playwright smoke test covers the full walkthrough in mock mode.
