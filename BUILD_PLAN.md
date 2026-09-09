# Build plan: Greenbriar portco scheduler POC

Target: AI Council, 2026-09-14. Today is 2026-09-09. Five working days. The Proof core never gets cut. The Vision layer (LP extension, live connectors) is narrated, not built.

## Phase 1: skeleton and fixtures (day 1)

1. Scaffold Next.js 15 + TypeScript + Tailwind 4 per CLAUDE.md. Copy `docs/` in.
2. Write `lib/types.ts` from `docs/DATA.md`.
3. Generate fixtures: 4 partners, 5 portcos (3 board members each), 4 quarters of 2027, availability blocks, venues per city. Use the generator script in `scripts/gen-fixtures.ts` so regenerating is one command.
4. `lib/data.ts` reads fixtures. `lib/scheduling.ts` implements the pure functions with unit tests: intersect calendars, find 4-hour blocks where all attendees are free, rank top three per quarter.
5. Board page with six columns and five cards. Metrics strip. Cards open a detail drawer. No actions yet.

Checkpoint: board renders, cards open, tests pass.

## Phase 2: the six stage actions (days 2 and 3)

6. Stage 1, Availability: button runs `scheduling.ts`, shows the availability grid per quarter with source attribution per block.
7. Stage 2, Shortlist: agent call (mock and live) returns top three windows per quarter with a one-line reason each, plus a dinner slot. Renders the one-pager draft. Approve advances.
8. Stage 3, Internal approval: shows the partner sign-off list. Presenter menu simulates approvals.
9. Stage 4, Portco confirmation: agent drafts the proposal email. Approve marks "sent." Presenter simulates the portco reply choosing one window per quarter. Card shows chosen dates.
10. Stage 5, Board buy-in: agent drafts the board email. Presenter simulates replies trickling in. Conflict path: one board member declines Q3, agent proposes the next-best window from the stage 2 shortlist, re-verifies, EA approves.
11. Stage 6, Locked and logistics: agent returns hotel and restaurant shortlist from `venues.json` for each meeting city, with a reason per pick. Approve marks the quarter locked. Metrics update.

Checkpoint: one portco end to end in mock mode.

## Phase 3: polish and presenter tools (day 4)

12. Presenter menu: Reset, Jump to state (loads from `demo-states.json`), Simulate replies, Toggle mock/live.
13. Typing delay and "working" states so the agent feels like it is doing something. Keep it under three seconds per step.
14. Brand pass: Greenbriar logo (`reference/greenbriar-logo.png`), palette pulled from the logo, clean and quiet. Tailwind tokens in one file.
15. Playwright smoke test of the full walkthrough.
16. Metrics strip final: portcos in flight, meetings locked of 20, "Manual: about 2 months per portco" versus "This flow: days," EA hours placeholder. No dollar figure until Devrin supplies one.

## Phase 4: rehearse (day 5)

17. Run `docs/DEMO_SCRIPT.md` three times. Fix anything that takes more than one click to explain.
18. Swap in real partner names and the one real portco if Peggy has replied. Otherwise ship with placeholders.

## Cut line

If behind by end of day 3: drop stage 6 logistics to a static shortlist, drop the conflict path in stage 5, keep everything else. If behind by end of day 4: drop live mode, ship mock only.

## Not in this build

- LP meeting scheduling (the 250). Narrated as "same engine, next use."
- Any real connector. Outlook, Graph, DealCloud, SharePoint.
- Multi-user, auth, roles, audit trail.
- Calendar invite sending. Stage 6 ends at "locked," with a note that invites go out from Outlook.
