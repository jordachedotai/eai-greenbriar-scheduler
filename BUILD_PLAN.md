# Build plan: Greenbriar portco scheduler POC

*Phases 1 to 3 shipped 2026-09-09 (six-stage Kanban, deployed). Phase 4 is the v2 rebuild from `docs/V2_FEEDBACK.md` and `docs/PRD.md`. Council is 2026-09-14.*

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

## Phase 4: v2 rebuild (2026-09-10 to 09-12)

Keep: `lib/scheduling.ts` and its tests, `lib/agent.ts` and `lib/prompts.ts`, `lib/claude.ts`, the fixture generators, mock mode. Refactor: the stage model. Rebuild: the UI.

### 4a. Model and data (first half of day 1)
19. Collapse the pipeline to five stages in `lib/types.ts` and `lib/pipeline.ts`: findDates, partnerSignoff, portcoPicks, boardConfirms, lockAndBook. Migrate transitions. Add `waitingOn` (`none | partners | portco | board`) and `waitingSince` per portco.
20. Add `eas.json` (Peggy Conway plus EA 2 and EA 3 placeholders) and `eaId` on each portco. Extend the generator to 15 portcos across five cities plus new ones, staggered per PRD "Demo data." Regenerate availability, venues, mock outputs.
21. New demo states: `fresh`, `council` (15 staggered, Cumberland not started), `council-at-board` (Cumberland at step 4 with picks in). Drop the v1 states.
22. Unit tests for the five-stage transitions and the conflict fallback.

### 4b. Shell and login (second half of day 1)
23. Login page. Shell layout with collapsible sidebar, header (title, view toggle, EA filter, presenter icon), avatar bottom left.
24. Placeholder pages for People, Templates, Settings.

### 4c. Portcos page (day 2)
25. Work strip with the four counts; clicking filters.
26. Rows view: PortcoRow with ProgressBar, QuarterChips, waiting-on, next-action button.
27. Board view: five columns, shared cards. Toggle persists in the store.
28. EA filter: My portcos or All EAs. EA column appears only under All EAs.

### 4d. Portco detail (day 2 and first half of day 3)
29. Detail layout: header, Stepper, QuarterStrip, StagePanel, fixed ActionBar, Activity side tab.
30. Stage 1 FindDates: explanation sentence, top three per quarter with reasons, "See all n windows" expander, thin-quarter warning, one-pager draft, Approve.
31. Stage 2 PartnerSignoff: draft, Approve and send, waiting state with simulate button, replies land in Activity.
32. Stage 3 PortcoPicks: draft, Approve and send, waiting state, simulate picks, chips fill.
33. Stage 4 BoardConfirms: draft, Approve and send, waiting state, simulate confirms and simulate conflict, fallback panel with the agent's two-sentence note, re-send.
34. Stage 5 LockAndBook: venue picks with reasons, Approve and lock, lock icons, work strip updates.
35. Done steps in the Stepper open read-only summaries.

### 4e. Calendar, presenter, polish (second half of day 3)
36. Calendar year view from state: locked solid, proposed hollow, filter by EA.
37. Presenter menu: Reset, Jump to state, mock/live toggle, show/hide demo buttons.
38. Copy pass on every explanation sentence and button label against the PRD rules. No em-dashes.
39. Playwright walkthrough rewritten for the five stages and the conflict path. Screenshots script updated.

### 4f. Rehearse (09-13)
40. Run `docs/DEMO_SCRIPT.md` three times. Anything that needs a spoken explanation gets a sentence on screen instead.
41. Swap real partner names and the real portco if Peggy has replied.

### Cut line for Phase 4
End of day 2 behind: drop the Board view toggle (Rows only) and the Calendar page. End of day 3 behind: drop the placeholder pages and the sidebar collapse; keep login, rows, detail, conflict path. The five-stage detail with the pinned action bar and the conflict path never gets cut.

## Phase 5: real data, polish, and the remaining pages (2026-09-10 to 09-12)

Inputs already in the repo: `data/source/greenbriar-portfolio.json` (18 current portcos: name, sector, website, HQ city, local logo path, and the real Greenbriar deal team per company with local headshots), `data/source/greenbriar-team.json` (43-person roster with titles, group, and local headshots for 37), `public/logos/` (18), `public/avatars/` (40), `data/eas.json` (four real EAs with headshots). Decisions in `docs/V2_FEEDBACK.md` round 2.

### 5a. Real data swap (day 1, first)
42. `partners.json` becomes the 17 deal-team people from the source file, each with `avatar`. Add `avatar?: string` to `Partner`.
43. `portcos.json` becomes the 18 real companies. Fields: real name, sector, website, HQ city (two flagged `cityVerify: true`, OnTrac and Towne), `logo`, `partnerIds` = that company's real deal team. Keep fictional: office street address, exec contact, board members. Assign EAs: Peggy gets 5 (include AIT, the one Devrin has details for, if confirmed), Barbara 5, Sofia 4, Jaquelyn 4. Assignment is a placeholder until Peggy confirms.
44. Regenerate availability for the real partner ids, venues for the 18 real cities, mock agent outputs with real names, and the `council` and `council-at-board` states. Walkthrough portco becomes AIT Worldwide Logistics unless Peggy names a different one.
45. Update tests and the Playwright walkthrough for the new names.

### 5b. Faces and logos in the workflow (day 1)
46. Every place a person's name appears in the workflow (stage 1 checked list, shortlist attendee chips, sign-off list, board replies table, activity log entries, People page) shows a 24px round headshot before the name. Initials fallback when `avatar` is missing. Resize every file in `public/avatars/` to 256px square JPEGs first; the staff originals are up to 700KB each and the folder is 5MB.
47. Portco logo on every row in Rows view, every card in Board view, and the detail header. Fixed-height box, contained, on a white tile so dark logos read on the panel background.

### 5c. Email renderer and the decline view (day 1)
48. One `EmailDraft` renderer: subject, greeting, body paragraphs, an optional date list block, ask, sign-off. Mock outputs stored as structured fields. Regenerate all mock emails including the re-send.
49. Decline view: sent board email collapses to one line with an expand link; the re-send draft is the only full-size element, titled "Re-send to the board: Q3 date change."

### 5d. Type scale and design pass (day 2)
50. Base 16px. Metadata 14px minimum. Headings 20 to 28px. Test on a 13-inch laptop.
51. Design pass: typeface, spacing scale, card elevation, status color system (needs you blue, waiting amber, locked green, not started gray), sidebar and stepper icons, brand color in the header bar.

### 5e. After lock: Attendance (day 2)
52. Locked portcos get an Attendance panel: per meeting, per attendee, invite accepted / tentative / no reply; travel booked per partner. Simulated via a demo button. Rows view shows "3 of 6 accepted" for locked portcos instead of a bare green bar.

### 5f. People, Settings, Templates (day 3)
53. People: from `greenbriar-team.json`, grouped Investment Team and Portfolio Support, Finance & Administration, headshot, name, title. Click a person to see the portcos they sit on. Six people without a site headshot get initials.
54. Settings: calendar connection per partner (all "Connected" in the demo), EA roster with portco assignments, meeting defaults (4 hours, dinner 6:30pm).
55. Templates: the one-pager and the four emails as read-only templates with an Edit button that does nothing yet.


### 5g. Round 3 additions (day 3, after 5f)
56. Rename Portcos to Portfolio everywhere the user can read it: sidebar, page title, breadcrumb, work strip, empty states, demo script. Route can stay `/portcos` or move to `/portfolio` with a redirect. Code ids stay `portco`.
57. Find dates attendee picker: replaces the explanation sentence. Rows of headshot, name, title, Calendar or Email tag, checkbox. Partners checked by default; board members and the portco executive shown with the Email tag and no calendar check. Unchecking a partner removes them from the intersection in `scheduling.ts` and the window counts update. "Add someone" opens a picker over the People roster. The one-line explanation moves under the picker as a caption: "Calendars are checked for the people ticked. Email people are asked in later steps."
58. Settings: team assignment per portfolio company. A table of companies, each with the assigned EA and the Greenbriar team as headshot chips, an Edit button that opens a multi-select over People with headshots. Saving updates `partnerIds` in the store and Find dates picks up the change.
59. Settings: "Add portfolio company." Form: name, logo (file upload stored as a data URL in the demo, or pick from `public/logos/`), HQ city, office address, executive contact name and title, board members (name, role, calendar shared yes or no), assigned EA, Greenbriar team from People. Save creates the company at stage 1, not started, and it appears in Portfolio and Calendar. Availability for its partners comes from the same seeded generator the fixtures use, run on the client, so any partner set works without a rebuild.
60. Move the seeded availability generator into `lib/` so it runs both at build time and in the browser. Test that a newly added company with three partners produces windows.

### Cut line for Phase 5
End of day 2 behind: Templates becomes a placeholder again, Attendance drops to a static panel. End of day 3 behind: Add portfolio company drops to a form that validates but does not save; team assignment and the attendee picker stay. The real data swap, faces and logos, the email renderer, and the type scale never get cut.
