# PRD: Greenbriar portco meeting scheduler

## The user

One user: the Executive Assistant. Modeled on Peggy Conway. She is not technical. She wants to see where every portco stands and press a button to make the next thing happen. She reads results, edits if needed, and approves. She never types a prompt.

## The job

For each portfolio company, schedule four quarterly meetings in 2027. Each meeting is a 4-hour block where all Greenbriar partners assigned to that portco, the portco executive team, and the portco board members can attend, in the portco's city, followed by a dinner. Then arrange partner travel, hotel, and the restaurant.

## The pipeline

A portco is a card. A card lives in one of six columns. Each quarter inside the card has its own status, so a card can be "Q1 locked, Q2 waiting on board, Q3 and Q4 at shortlist." The column shows the least-advanced quarter.

| # | Column | What the EA sees | Button | What the agent does | Advance rule |
|---|---|---|---|---|---|
| 0 | Setup | Portco name, city, assigned partners, board members, target quarters | Pull availability | Nothing yet | Automatic once attendees are confirmed |
| 1 | Availability | A grid per quarter: 4-hour blocks where every required attendee is free, with a source tag per block (whose calendar) | Build shortlist | Intersects calendars, finds 4-hour blocks, flags thin quarters | Automatic when the grid is produced |
| 2 | Shortlist | Three ranked windows per quarter with a one-line reason each, a dinner slot per window, rendered as the one-pager the portco will receive | Send for internal approval | Ranks windows, drafts the one-pager | EA approves the one-pager |
| 3 | Internal approval | The list of partners who must sign off, with status | Send to portco | Nothing. This is a human gate | All partners approved |
| 4 | Portco confirmation | The proposal email draft, then the portco's chosen window per quarter once they reply | Send to board | Drafts the proposal email. On reply, records the picks | Portco has picked one window per quarter |
| 5 | Board buy-in | The board email draft, then per-member confirmations. If a member declines, the agent proposes the next-best window from the shortlist and re-verifies | Lock and plan logistics | Drafts the board email. Monitors replies. Handles the conflict path | Every board member confirmed for every quarter |
| 6 | Locked and logistics | Locked dates, plus hotel and restaurant shortlist per meeting with a reason per pick | Approve logistics | Picks vetted venues near the portco office for the meeting date | EA approves. Quarter shows a lock icon |

The internal approval gate is in Devrin's flow doc as "Other steps." It is a real stage here because Peggy said the portco must not be contacted before partners sign off internally.

## Screens

1. **Board.** Six columns, five cards, metrics strip on top. Cards show portco name, city, four quarter chips colored by status, and the next action. Click a card to open its detail.
2. **Portco detail.** A drawer or full page. Left: the four quarters with their status and the chosen or proposed dates. Right: the current stage panel with the button and the agent output. Below: a timeline log of everything that happened to this portco, with timestamps and who did it (EA or agent).
3. **Draft viewer.** Used by stages 2, 4, 5, and 6. Shows the agent's draft. Three controls: Approve, Edit (inline text), Regenerate. Approve is the only thing that advances a stage.
4. **Presenter menu.** Hidden behind a keyboard shortcut (`Shift+P`). Reset demo, Jump to state, Simulate portco reply, Simulate board replies (all confirm), Simulate board conflict (one declines), Toggle mock or live. This is for the person presenting, never shown to the room by default.

## Metrics strip

- Portcos in flight: 5
- Meetings locked: n of 20
- Manual process: about 2 months per portco (source: Peggy, via Devrin, 2026-09-04)
- This flow: days
- EA hours saved: [PLACEHOLDER until Devrin supplies the figure]

Never invent a dollar figure. Show the placeholder or hide the tile.

## Trust behaviors the room should notice

- Every availability block says whose calendar it came from.
- Thin quarters get a warning ("only 2 windows found in Q3, consider widening to 3-hour blocks").
- The agent re-verifies availability after a board conflict instead of assuming.
- Every draft is a draft until the EA approves it.
- The timeline log shows what the agent did and what the EA did, separately.

## Out of scope

LP meetings, real connectors, calendar invite sending, multi-user, travel booking (shortlist only), budgets and policy.

## Vision layer (narrated, not built)

One slide or 30 seconds of talk: the same board with 15 portcos across three EAs, then 25 across the portfolio, then the 250 LP meetings in cycle with the partner-to-LP matrix out of DealCloud as the attendee list. Production plumbing is Outlook and Graph for calendars and mail, gated on the AI Council's connector list.
