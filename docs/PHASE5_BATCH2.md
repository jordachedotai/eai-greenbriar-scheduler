# Phase 5, batch 2: feedback from the 2026-09-09 walkthroughs

Everything Jordache flagged after tasks 50, 50a, and 50b shipped, in build order. Each item is self-contained. Run the unit tests and the Playwright walkthrough after items 1, 2, 5, and 8. Commit after each numbered item lands green.

References: `reference/design/*.dc.html`, `reference/design/Tokens.dc.html`, and `docs/V2_FEEDBACK.md` rounds 4 to 6.

## 1. Stage 6, Send invites (model change first, everything else builds on it)

Add stage 6, "Send invites", after Lock and book. Stage 5 approval locks dates and venues and advances to 6.

Stage 6 panel: one calendar invite draft per meeting (title, date and time, office address, a dinner entry, attendees with faces, one-line body) and one primary button, "Approve and send invites". After sending, the same panel becomes the attendance tracker: per meeting, per attendee, Accepted / Tentative / No reply pills, plus travel booked per partner. The presenter menu's "Invites accepted" simulates the replies.

Status words on rows and cards: "Locked" after step 5, "Invites out" after step 6 sends, "All accepted" once every invite is accepted, and only then is the row or card fully green. The work strip's confirmed count is unchanged (board-confirmed or later).

Update: stepper to 6 steps, rows progress bar to 6 dots, board to 6 columns (last one "Invites out"), demo script Beat 6a, council states with locked companies at stage 6 and mixed acceptances, unit and Playwright tests. Remove every "Invites go out from Outlook" sentence.

## 2. Stage panel order rule, every stage

What needs the EA first, the reason second, the evidence third, history last. On step 4 after a decline: re-send draft, then the decline card, then the board replies table, then the folded sent email. `reference/design/Decline.dc.html` shows this order. Apply the same rule to steps 2, 3, 5, and 6.

## 3. Picks and confirmations come from reply emails the agent reads

- Every pick row (step 3) and every board reply (step 4) carries provenance: "from Tom's reply, 11:23 AM" with a View link that opens the reply in a side drawer, shown as an email (subject, from, time, body).
- Sent emails fold to the one-line Sent row with a View link, never full-size after sending.
- The simulated replies the presenter fires are real mock emails in the fixtures, in the sender's voice (a CEO writes "Q1 works best on the 9th, Q2 let's do June 24"). The agent's extraction fills the table. The EA's click on the primary button is the confirmation.
- The activity entry for a reply opens the same drawer.

## 4. Every draft signs off with the logged-in EA

One-pager, partner sign-off, company proposal, board confirmation, re-send, and the stage 6 invites all sign "Peggy Conway, Executive Assistant to the Greenbriar Partners", pulled from the current EA in the store, never a hardcoded string. Update the mock templates, the live prompt payloads, and the sign-off field in the email renderer.

## 5. Options inline, one attachment in the whole tool

- Partner sign-off email (step 2): drop "attached one-pager". Options inline with the date list block, one group per quarter, three options each, dinner time on each line.
- Company proposal email (step 3): options inline the same way, plus an attachment chip under the body: paperclip icon, "AIT Worldwide Logistics 2027 meeting options.pdf", and a Preview link that opens the approved one-pager in a modal. This is the only attachment anywhere.
- Board confirmation and re-send (step 4) already list dates inline. Keep that.
- Regenerate mock outputs after 4 and 5 together.

## 6. Venues: the tool learns Peggy's picks

Step 5 hotel and dinner dropdowns get "Add your own" as the last option. It opens an inline form: name, address, optional note. Save creates a venue in the store for that company's city, marked addedBy the current EA with a date, selects it, and the reason line reads "Added by Peggy Conway, Sep 9." It shows in every later dropdown for that city and the agent may pick it in future runs.

Under each dropdown, a "Use for all four" link that copies that pick to the other quarters. No new page, no modal beyond the inline form. localStorage like everything else.

## 7. Board view fills the width

Remove the max-width container on the Board view so the work strip and the six columns fill the main area, 28px padding each side. Columns are equal width with a 250px minimum. If the window is narrower than six columns need, the board scrolls horizontally inside its own container; the page never scrolls sideways and cards never shrink below the design size. Rows view keeps its current width.

## 8. Login and Calendar pages to the token sheet

Neither has a mockup. Bring both to `reference/design/Tokens.dc.html`: the green header band, serif title, 16px base, cards with the row shadow, status colors on calendar blocks, Peggy's face on the login form. Calendar blocks use the same status words and colors as the rows.

## 9. Small fixes

- AIT's fictional office address: the app says Suite 800, the reference says Suite 2100. Keep Suite 800 everywhere.
- Demo script: add to "What not to say" that nobody edits a draft live, since an edited draft drops to plain text.

## Then

5f (People, Settings, Templates, tasks 53 to 55) and 5g (58 to 60; 57 is done). Same rules: tests after each, commit after each.
