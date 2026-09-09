# V2 feedback and decisions (2026-09-09, after first Vercel walkthrough)

Jordache walked the deployed Phase 3 build end to end. Nothing changed yet. These are the notes and the decisions to fold into a PRD v2.

## Findings

1. **Board is cramped and empty at once.** Six narrow columns, five cards, most of the width unused.
2. **Metrics strip is the AI Council story, not the EA's dashboard.** "About 2 months," "Days," "EA hours saved" mean nothing to the user. "0 of 20" is unexplained.
3. **No login, no user identity, no navigation.** Wants a mock login, an avatar bottom left (name, company, role), and a collapsible left sidebar.
4. **Portco detail has no hierarchy.** Step order is not visible. The primary action moves around (top right in stages 0 and 1, bottom right after scrolling in stage 2).
5. **Availability screen does not explain itself.** Calendar vs email tags, green vs yellow, "11 windows found" all unexplained. User could not tell why only three people were checked.
6. **Shortlist as a separate step feels unnecessary.** Nobody wants raw windows.
7. **Button labels lie.** "Send to portco" opens a draft instead of sending.
8. **Waiting states are dead ends.** No visible way to bring in a reply. Presenter menu is hidden behind Shift+P.
9. **Stages 5 and 6 were not discoverable.** User did not know how to reach or demo them.

## Answers established

- Availability checks only the Greenbriar partners assigned to the portco, because those are the only calendars Greenbriar owns. Board members are external; "email" tag means they will be asked by email. The portco CEO picks from options, is never checked. Screen must say this in one line.
- Internal approval in real life: an email to the partners with the one-pager, "OK to send?" Agent sends and reads replies in production (Outlook connector). Demo simulates.
- Portco picks in production: agent reads the reply email, or (cleaner) the one-pager is a link where the CEO clicks choices. Either way the EA confirms before the stage advances. The agent never advances a stage on its own.
- Board and logistics stages run on the same pattern: draft, approve and send, simulated replies, conflict path (one decline, agent proposes the number two window and re-verifies), then venue picks, approve, lock.

## Order of portco vs board: portco first, then board

Source: Devrin's flow doc, step 3 "Portco Confirmation" then step 4 "Board Buy-in," and Devrin on the 2026-09-04 call at 00:22:18: she sends the options to the portco, they pick, then the board members are asked to approve the picked dates. The logic: the portco hosts and chooses; the board confirms what was chosen. This is Devrin's retelling. Peggy has not confirmed it directly. Her edits to the flow doc are due this week. Build on it; flag it as "confirm with Peggy."

## Decisions

- **Two board views with a toggle.** Kanban stays, rebuilt on five columns. New default: row view, one wide row per portco with a five-step progress bar, four quarter chips with dates, who we are waiting on, and the next action. Same data, same cards.
- **Five stages, named for what happens:** Find dates (availability + shortlist merged, raw windows behind "see all"), Partner sign-off, Portco picks, Board confirms, Lock and book.
- **One primary button per stage, pinned, labeled with exactly what it does.** Drafts appear in the panel with "Approve and send."
- **Waiting states show who we are waiting on and a visible "Demo: simulate reply" button.** Presenter menu stays for jump-to-state and reset.
- **Stepper across the top of portco detail.** Timeline moves to a side tab.
- **Replace the metrics strip** with a work strip: "n need dates found, n waiting on the portco, n waiting on you," plus one goal number, "Confirmed meetings, 0 of 20 for 2027." Move the ROI tiles to a presenter slide or an Impact page.
- **Mock login, avatar bottom left, collapsible sidebar.** Sidebar: Portcos, Calendar (2027 view of locked meetings), People, Templates, Settings. Avatar: Peggy Conway, Executive Assistant, Greenbriar.
- **More portcos in demo data.** See below.

## Demo data scale

Peggy's real load is 5. The story is 15 across three EAs and 25 across the portfolio. Decision: ship 15 portcos, staggered across stages so the board looks alive (some locked, some waiting on the portco, some not started). Default filter: "My portcos" (Peggy's 5). Toggle: "All EAs" shows 15 with an EA column. Other EAs are placeholders (EA 2, EA 3) until Greenbriar names are confirmed. The 250 LP meetings stay narrated, not in data.
