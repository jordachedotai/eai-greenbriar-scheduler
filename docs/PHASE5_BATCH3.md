# Phase 5, batch 3: feedback from the 2026-09-09 evening walkthrough

Four items, in build order. Run the unit tests and the Playwright walkthrough after items 2 and 4. Commit after each item lands green. Any change to the persisted store shape bumps `STORE_VERSION` in the same commit.

## 1. Step 1 explanation as a label-and-value block

After Find dates has run, replace the run-on paragraph with a four-row block, label on the left in 13px caps, value on the right, faces or initials inline with names. Same layout as the decline card's Declined / Proposed / Re-checked rows.

```
CALENDARS CHECKED   [faces] Michael Wang, Jill Raker, Niall McComiskey, Max Elgart, Ben Cox
ASKED BY EMAIL      [HM] Helen Marsh, [RC] Raymond Cho, [DW] Denise Walker · in step 4
PICKS THE DATES     [TH] Tom Haggerty · in step 3
SKIPPED             32 days already held for other portfolio company meetings
```

Keep the one-line sentence above it: "Approving moves it to the partners for sign-off." The activity entry can stay as prose.

## 2. Step 1 shortlist is editable, the one-pager follows

- Top three per quarter start selected. "See all windows" shows every window as the same card with a "Use this" button. Selecting one swaps it into that quarter, replacing the lowest-ranked option unless the EA picks which one to replace.
- Each selected option has Remove and up/down arrows to set Option 1, 2, 3. A quarter holds two or three options, never four.
- The one-pager's date lists rebuild from the selection immediately, with no agent call. A swapped-in window carries its own reason line from the full list. The greeting and ask paragraphs do not change. Regenerate rewrites the prose around the current selection.
- Log each swap as an EA activity entry: "Peggy swapped Q1 option 2 for Tue Feb 9."
- Fix the option header so the date sits on one line ("Thu Feb 4") with the time beneath it.

## 3. Step 5 venues as cards, no native selects

- Replace the hotel and dinner `<select>` elements with venue cards matching step 1's option cards: a hotel or dinner icon, name, distance, one-line reason.
- "Change" on a card opens the alternatives as the same cards with "Use this," and an "Add your own" card at the end of that list (name, address, optional note, saved to the city as before).
- "Use for all" stays as a link on the card. Quarters that inherit show "Same as Q1" instead of repeating the reason.
- Remove the paragraph under each quarter; the reason lives on the card.
- No native select elements anywhere in the tool. Audit Settings and the Change control on step 1 for any others and replace them with the same card or menu pattern.

## 4. Demo script and states

- Add a Q&A line to the demo script: under All assistants, Sunvair plans two quarters and The Facilities Group spans October 2026 into 2027. That is the answer to "what if it is not a full year."
- Confirm the `council` and `council-at-board` states still walk clean after items 2 and 3, since selection state and venue picks are now part of the saved company.

## 5. People page: sticky detail card

The person card on the right stays in view as the roster scrolls: `position: sticky` at the top offset by the header band plus the page padding, inside a column that spans the full roster height. Clicking a person lower in the list swaps the card in place without scrolling the page. Same treatment for the Activity panel on the company page if it is not already sticky there.
