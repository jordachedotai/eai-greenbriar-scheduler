# Demo script: four minutes in the room

Presenter: Jordache. Audience: Greenbriar AI Council, about 40 seats, mixed investment team and back office. Devrin frames it, Jordache drives.

## Setup before the session
- Laptop on `MOCK_MODE=true`. Wifi off is fine.
- Load state `fresh`. Five cards in Setup.
- Presenter menu tested. `Shift+P` opens it.

## Beat 1: the before (30 seconds, Devrin talks, screen shows the board)
"Peggy schedules four quarterly meetings a year for five portfolio companies. Partners, the portco's executives, their board, four hours, in their city, with a dinner. Then travel. She told me it takes about two months per portco. She built the first step herself in the QuickStart. This is what the whole thing looks like as one tool."

## Beat 2: availability (30 seconds)
Open the first portco card. Press Pull availability. Grid appears per quarter. Point at the source tags: "every block says whose calendar it came from." Point at Q3: "only two windows. It tells her instead of hiding it."

## Beat 3: shortlist and the one-pager (45 seconds)
Press Build shortlist. Three windows per quarter with a reason each. The one-pager renders. "This is the document she sends today. She used to build it by hand." Press Approve. Card moves to Internal approval.

## Beat 4: internal approval and the portco (45 seconds)
"Before anything goes to the portco, the partners sign off internally. That's her rule, not ours." Presenter menu: simulate approvals. Press Send to portco. Email draft. Approve. Presenter menu: simulate portco reply. Chosen dates appear on the quarter chips.

## Beat 5: the board, with a conflict (60 seconds)
Press Send to board. Draft, approve. Presenter menu: simulate board conflict. One member declines Q3. The agent proposes the rank-2 window from the shortlist, re-checks the partners, and writes a two-sentence note. "It didn't guess. It went back to the shortlist she already approved and checked again." Approve the re-send. Simulate confirmations. Four quarters confirmed.

## Beat 6: lock and logistics (30 seconds)
Press Lock and plan logistics. Hotel and restaurant per meeting, near the office, with a reason. Approve. Lock icons on all four quarters. Metrics strip ticks to 4 of 20 locked.

## Close (20 seconds, Devrin)
"That's one portco. Peggy has five. Three EAs have fifteen. The portfolio is twenty-five. And when the next fund goes to market, the same engine schedules two hundred and fifty LP meetings." One slide of the board at scale. Do not build it. Show it.

## If time is short
Load `one-portco-at-board` and start at Beat 5. The conflict is the wow moment. Never skip it.

## What not to say
- No dollar figure. Devrin owes it. Say "two months to days" and stop.
- Do not say Claude, Copilot, or any vendor. Say "the agent."
- Do not claim it reads Greenbriar calendars today. Say "connected to calendars" and let Scott's connector list carry the production conversation.
