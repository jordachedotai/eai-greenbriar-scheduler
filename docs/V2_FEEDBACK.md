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

---

# Round 2 feedback (2026-09-09, after the Phase 4 rebuild)

Jordache walked the five-stage build. Login, sidebar, avatar, stepper, pinned action bar, conflict path, and lock all work. Findings:

1. **Board decline screen has two emails on it and no hierarchy.** The sent board email and the re-send draft are both full size. Hard to tell which one is being approved.
2. **Re-send draft is one run-on paragraph.** The initial emails have subject, greeting, list, ask, sign-off. The re-send collapses to one line. Every draft must render with the same structure and line breaks.
3. **Type is too small everywhere.** Test a 16px minimum for all body text.
4. **Feels like a wireframe, not a product.** Same gray everywhere, boxes inside boxes, no elevation, no color except the green button, no icons, thin type.
5. **After lock, nothing.** "Invites go out from Outlook" is a sentence. There is no invite status, no who-accepted. Needs an after-lock panel.
6. **People, Templates, Settings are placeholders.** Wants real mock pages. People can be seeded from https://www.greenbriar.com/team/.

## Decisions (pending Jordache's confirmation)
- Conflict view: collapse the sent email to a one-line "Sent Sep 9, 9:38 AM" summary with an expand link. The re-send draft is the only full-size thing on screen, titled "Re-send to the board: Q3 date change."
- One email renderer for every draft: subject line, greeting, body paragraphs, a list block where there are dates, the ask, sign-off. Mock outputs stored as structured fields, not a blob. Re-send mock outputs regenerated.
- Type scale: base 16px, labels and metadata 14px minimum only where truly secondary (timestamps), headings 20 to 28px. Test on the 13-inch laptop that goes in the room.
- Design pass: a proper typeface, a spacing scale, card elevation, status color system (needs you = blue, waiting on others = amber, locked = green, not started = gray), icons in the sidebar and stepper, initials avatars for every person, brand color in the header bar.
- After lock: an "Attendance" panel on locked portcos. Per meeting, per attendee: invite accepted, tentative, no reply. Simulated. In production it reads Outlook responses. Travel booked status per partner, simulated.
- People: seeded from the Greenbriar team page (names, titles, headshots stored locally). Board members and portco contacts stay fictional. Templates: read-only one-pager and four email templates with an Edit button that does nothing yet. Settings: calendar connections per partner, EA roster with portco assignments, meeting defaults.

## Round 2 decisions confirmed by Jordache (2026-09-09, midday)
- Real Managing Partners and the real deal team per portco replace the fictional partners. Source: each company's page on greenbriar.com.
- Headshots next to every person's name inside the workflow, not only in the sidebar.
- Real portfolio companies (18 current) with real logos on rows, board cards, and the detail header.
- HQ cities looked up from public sources 2026-09-09. Two need Peggy to confirm: OnTrac (Chandler, AZ, or Chantilly, VA after the LaserShip merger) and Towne (Plymouth Meeting, PA, or Annapolis, MD).
- Four real EAs on the site: Peggy Conway, Barbara Palmer, Sofia Hodza, Jaquelyn Hoffman. Devrin said three. Which portcos each EA owns is unknown; placeholder assignment until Peggy confirms.
- Board members, portco executive contacts, and office street addresses stay fictional. Nothing on the site names them and nothing gets invented about real people.
- Six team members have no headshot on the site (Catlin, Ponnaiya, Saraf, Schenk, Parkis, Cassidy). Initials fallback.

## Round 3 (2026-09-09, afternoon)
1. **Rename "Portcos" to "Portfolio."** Nav item, page title, breadcrumb, work strip labels. In copy say "portfolio company." Code ids stay `portco`.
2. **Settings gets "Add portfolio company."** A form: name, logo, HQ city, office address, executive contact, board members, assigned EA, Greenbriar team. Saves to the store (localStorage in the demo). New companies appear in Portfolio immediately at "not started."
3. **Settings gets team assignment per portfolio company.** Pick the Greenbriar people on each company from the People roster with headshots, edit for existing companies, and the change flows into Find dates.
4. **Find dates opens with an attendee picker, not a sentence.** Headshot, name, title, a Calendar or Email tag, and a checkbox per person. Partners checked by default. Board members and the portco executive listed with the Email tag, since they are asked later, not calendar-checked. Unchecking a partner removes them from the availability intersection. "Add someone" pulls from People.

## Round 4 (2026-09-09, afternoon): presenter menu decision
- **Simulate actions live in the Shift+P presenter menu, not inline.** Reverses the round 2 decision to show a "Demo: simulate reply" button inside waiting states. Jordache prefers the pop-up: it keeps the EA's screen clean and the room never sees a demo control unless the presenter opens it.
- The presenter menu gets the redesign: dark brand-green panel, bottom right, one section "Simulate for this company" listing the steps in order with done ones dimmed and the next one highlighted, and a "Demo" section with Jump to state, Agent mode, the header demo-tag toggle, and Reset. Reference: `reference/design/Decline.dc.html`, shown open.
- Waiting states still say who we are waiting on and since when. They just do not carry a button.
- Detail page reference now exists: `reference/design/FindDates.dc.html` (stage 1 with the attendee picker, task 57) and `reference/design/Decline.dc.html` (stage 4 decline view, task 49, with the presenter menu open).

## Round 5 (2026-09-09, late afternoon): stage panel order
- **Order inside every stage panel: what needs the EA first, the reason second, the evidence third, history last.** On the decline stage that is the re-send draft, then the decline card, then the board replies table, then the folded sent email. `reference/design/Decline.dc.html` updated to match.
- Picks and confirmations come from reply emails the agent reads. Every pick row shows provenance and a View link to the reply in a drawer. Sent emails fold to one line after sending. Mock replies are real emails in the fixtures, in the sender's voice.
- Every draft signs off with the logged-in EA's name and title. Partner sign-off email lists the options inline. The company proposal lists options inline and carries the one attachment chip in the tool, the one-pager, with a Preview.

## Round 6 (2026-09-09, evening): stage 6 and venues
- **Six stages, not five.** Send invites is a real step after Lock and book, with invite drafts, an Approve and send button, and an attendance tracker afterwards. "Invites go out from Outlook" is gone. Done means all invites accepted.
- Venue dropdowns get "Add your own" and "Use for all four". The tool learns Peggy's venues.
