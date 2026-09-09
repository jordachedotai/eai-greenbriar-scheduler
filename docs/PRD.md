# PRD v2: Greenbriar portco meeting scheduler

*Supersedes v1 (archived). Written 2026-09-09 from the first walkthrough of the Phase 3 build. Decisions and reasoning are in `V2_FEEDBACK.md`.*

## The user

One user: the Executive Assistant, modeled on Peggy Conway. Not technical. She opens the tool in the morning, sees what needs her, presses one button per portco, reads the result, approves. She never types a prompt. Everything on screen must explain itself in one line.

## The job

For each portfolio company, schedule four quarterly meetings in 2027. Each is a 4-hour block where the assigned Greenbriar partners, the portco executive, and the portco board members can attend, in the portco's city, followed by dinner. Then arrange partner travel, hotel, and the restaurant.

## The five stages

Portco first, then board. Source: Devrin's flow doc and his 2026-09-04 account. Confirm with Peggy when her flow edits arrive.

| # | Stage | What happens | Who does the work | Primary button | Waiting on | Advances when |
|---|---|---|---|---|---|---|
| 1 | Find dates | Check the assigned partners' calendars, find 4-hour blocks where all are free, rank the top three per quarter, draft the one-pager for the portco | Code finds and ranks. Agent writes reasons and the one-pager | **Find dates** | Nobody | EA approves the one-pager |
| 2 | Partner sign-off | Email the one-pager to the assigned partners: "OK to send this to the portco?" Track replies | Agent drafts the email. Replies are simulated | **Approve and send to partners** | The partners | All partners replied yes |
| 3 | Portco picks | Email the one-pager to the portco executive. They choose one option per quarter | Agent drafts the email. Picks are simulated | **Approve and send to portco** | The portco | One pick per quarter recorded |
| 4 | Board confirms | Email the chosen dates to the board members. If one declines, propose the next-best window from the approved shortlist, re-check the partners, re-send | Agent drafts. Conflict path is code plus a two-sentence agent note | **Approve and send to board** | The board | Every board member confirmed every quarter |
| 5 | Lock and book | Pick a hotel and a restaurant near the portco office for each meeting date, with a reason each | Agent picks from the venue list | **Approve and lock** | Nobody | EA approves. All four quarters show a lock |

Rules that apply to every stage:
- One primary button, pinned in a fixed action bar at the bottom of the detail panel. Never below the fold.
- The button's label says exactly what happens on click. If a draft appears first, the button that makes the draft is "Draft the email" and the draft's own button is "Approve and send."
- Every waiting state shows who we are waiting on, since when, and a visible **Demo: simulate reply** button styled as a presenter control.
- The agent never advances a stage on its own. Replies arrive, the EA sees them, the EA clicks.
- Every stage panel opens with a one-line explanation of what this stage does and what the EA should do.

## Screens

### Login
Mock sign-in. Greenbriar logo, email and password fields prefilled, one button. Lands on the Portcos page. No real auth.

### Shell
- Left sidebar, collapsible. Items: Portcos, Calendar, People, Templates, Settings. Only Portcos and Calendar need to work; the others open a simple placeholder page with a sentence about what it would hold.
- Avatar bottom left: Peggy Conway, Executive Assistant, Greenbriar.
- Header: page title, view toggle (Rows or Board), EA filter (My portcos or All EAs), presenter menu trigger.

### Portcos page, work strip
Replaces the v1 metrics tiles. Three counts plus one goal:
- Waiting on you: n
- Waiting on others: n (portco, board, or partners)
- Not started: n
- Confirmed meetings: n of 60 for 2027 (or n of 20 under "My portcos")

Clicking a count filters the list.

### Portcos page, Rows view (default)
One wide row per portco. Left to right: portco name and city, EA name (only under "All EAs"), a five-step progress bar with the current step highlighted, four quarter chips showing the confirmed or proposed date and a status color, "Waiting on" text, and the next action as a button that opens the detail at the right stage.

### Portcos page, Board view (toggle)
Five columns, one per stage. Same cards. A card shows name, city, quarter chips, waiting-on, next action. A portco sits in the column of its least-advanced quarter.

### Portco detail
Opens as a full-height drawer from the right, or a page. Layout top to bottom:
1. Header: portco name, city, office address, EA.
2. Stepper: five steps across the top, done steps checked, current step highlighted, future steps muted. Clicking a done step shows what happened there, read only.
3. Quarter strip: four chips with date and status.
4. Stage panel: the one-line explanation, then the content for this stage (availability summary, draft, reply tracker, venue picks).
5. Fixed action bar: the primary button, and Edit or Regenerate when a draft is showing.
6. Side tab, "Activity": the timeline log, EA and agent entries separate, newest first.

### Stage 1 content, Find dates
Opens with the sentence: "Checked calendars for Alan Whitfield, Maria Castellano, David Okafor. Helen Marsh, Raymond Cho, and Denise Walker have not shared calendars and will be asked by email in step 4. Tom Haggerty picks from the options in step 3." Then the top three per quarter, each with date, time, reason, dinner time. A "See all 41 windows" expander shows the raw grid. Thin quarters get the warning line. Below that, the one-pager draft.

### Calendar page
A 2027 year view. Locked meetings appear as blocks with portco name and city. Proposed dates appear hollow. Filter by EA. This is the "after" picture for the room and costs little to build from the same state.

### People, Templates, Settings
Placeholder pages with one paragraph each. People would list partners, board members, and portco contacts. Templates would hold the one-pager and email templates. Settings would hold calendar connections and the EA roster.

## Demo data

Fifteen portcos across three EAs. Peggy has five. EA 2 and EA 3 are placeholders until names are confirmed. Staggered so the board reads as a live workload: roughly 3 locked, 3 waiting on the board, 3 waiting on the portco, 2 waiting on partners, 4 not started. Peggy's five include one not started (the walkthrough portco), one waiting on the portco, one waiting on the board, one locked, one waiting on partners.

## Presenter controls
- Presenter menu (`Shift+P` and a small icon in the header): Reset, Jump to state, Toggle mock or live, Show or hide demo buttons.
- Demo buttons inside waiting states: Simulate partner replies, Simulate portco picks, Simulate board confirms, Simulate board conflict.

## Trust behaviors the room should notice
- Every window says whose calendar it came from.
- The tool says plainly who it checked and who it will ask by email.
- Thin quarters get a warning instead of silent failure.
- A board decline goes back to the approved shortlist and re-verifies. Nothing is guessed.
- Every draft is a draft until the EA approves it. The activity log shows EA and agent actions separately.

## Out of scope
Real connectors. Real auth. Calendar invite sending (the Lock stage notes that invites go out from Outlook). Travel booking. Budgets. LP meetings, which stay narrated.

## Vision layer, narrated
The Calendar page under "All EAs" is the scale picture. Devrin's line: fifteen now, twenty-five across the portfolio, two hundred and fifty LP meetings when the next fund goes to market. Production plumbing is Outlook and Graph, gated on the AI Council connector list.
