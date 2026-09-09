# Greenbriar Portco Meeting Scheduler: POC Build Brief (v2)

You are building a demo web app for the Greenbriar AI Council (target date 2026-09-14). It shows an Executive Assistant's quarterly portfolio-company meeting scheduling running as one tool: a list of portcos, each moving through five stages, with an agent doing the work at each stage when the EA presses one button.

The sponsor is Peggy Conway, EA at Greenbriar. Today this takes her about two months per portco by hand. She handles five portcos. Two other EAs handle five each. Four quarterly meetings per portco in 2027, each with a dinner, plus travel.

**Phase 3 shipped a working six-stage Kanban version. Phase 4 rebuilds the experience on the v2 spec.** Read, in order: `docs/V2_FEEDBACK.md` (why), `docs/PRD.md` (what), `docs/DATA.md`, `docs/AGENT.md`, `docs/DEMO_SCRIPT.md`, then `BUILD_PLAN.md` Phase 4. They are the source of truth. Keep `lib/scheduling.ts`, `lib/agent.ts`, the fixtures generator, and the tests; refactor the stage model and rebuild the UI.

## Hard rules

- **Mock data only.** No real calendars, email, or names until the fixture swap. No Outlook, Graph, or DealCloud calls, ever, in this repo.
- **One tool on screen.** Never show Copilot, Claude.ai, or a chat window. The user sees pages, rows, buttons, drafts, and results.
- **Every AI output is a draft with an Approve button.** Nothing is sent or locked without the EA clicking. The agent never advances a stage on its own.
- **One primary button per stage, pinned in a fixed action bar, labeled with exactly what it does.** "Draft the email" makes a draft. "Approve and send" sends. Never a button that says send and opens a draft.
- **Every stage panel opens with one plain sentence** saying what this stage does and what the EA should do now.
- **Waiting states are never dead ends.** Show who we are waiting on, since when, and a visible "Demo: simulate reply" control.
- **Mock mode must work with no network.** `MOCK_MODE` defaults to true. Live mode calls Claude for drafting only and falls back to mock on failure.
- **Data access goes through `lib/data.ts`.**
- **No em-dashes anywhere in UI copy.** Short sentences. Plain words.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, `@anthropic-ai/sdk` (model `claude-sonnet-5`) for live mode. Zustand store persisted to `localStorage`. Vitest for unit tests, Playwright for the walkthrough. Deployed on Vercel at https://eai-greenbriar-scheduler.vercel.app with `vercel.json` declaring the Next.js framework.

## Structure (target after Phase 4)

```
app/
  login/page.tsx
  (shell)/layout.tsx          # sidebar + header + avatar
  (shell)/portcos/page.tsx    # work strip, Rows view, Board view toggle
  (shell)/portcos/[id]/       # detail: stepper, quarter strip, stage panel, action bar, activity tab
  (shell)/calendar/page.tsx
  (shell)/people|templates|settings/page.tsx   # placeholders
  api/agent/route.ts
components/
  Shell/  Sidebar  Header  Avatar  ViewToggle  EaFilter
  Portcos/  WorkStrip  PortcoRow  ProgressBar  QuarterChip  BoardView  BoardCard
  Detail/  Stepper  QuarterStrip  StagePanel  ActionBar  ActivityTab
  Stages/  FindDates  PartnerSignoff  PortcoPicks  BoardConfirms  LockAndBook
  Drafts/  DraftViewer
  Presenter/  PresenterMenu  SimulateButton
  Calendar/  YearView
data/     partners  eas  portcos (15)  board-members  availability  venues  mock-agent-outputs  demo-states
lib/      data  scheduling  agent  prompts  pipeline (5 stages)  simulate  store  types
```

## Definition of done (Phase 4)

1. Login lands on Portcos, Rows view, "My portcos," work strip showing the counts from state `council`.
2. Rows and Board views toggle with no reload and show the same fifteen portcos, filterable by EA.
3. A presenter can run `docs/DEMO_SCRIPT.md` in under four minutes using only on-screen buttons and the demo controls, never scrolling to find the primary action.
4. Every stage panel opens with its one-line explanation. Every waiting state has its simulate button.
5. The board conflict path works: one decline, fallback to the approved number two window, re-verify, re-send.
6. Calendar page shows locked and proposed meetings for 2027, filterable by EA.
7. Mock mode passes the Playwright walkthrough with wifi off. No console errors.
8. Swapping names in `partners.json`, `eas.json`, and `portcos.json` needs no code changes.
