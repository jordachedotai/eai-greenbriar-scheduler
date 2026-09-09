# Peggy's Quarterly Portco Meeting Scheduler: Transcript Extract and Build Notes

*Prepared 2026-09-09. Source: "Greenbriar Strategic Use Case Review," EAI internal call, Friday 2026-09-04, 1h03m, Fireflies id 01M1PJDB53PJ32V0P4QB3PHGR9. Optimized transcript lives at `projects-transcript-studio/01 Inbox/Fireflies/2026-09-04-greenbriar-strategic-use-case-review.optimized.md` and a copy sits in this folder as "2026-09-04 Greenbriar Strategic Use Case Review (Optimized Transcript).md". Speakers: Devrin Carlson-Smith, Jordache Johnson, Peter Zience, Chris Andrews, Olivier Gers. Peggy was not on the call; everything about her workflow comes from Devrin's account of his 1:1 with her the day before (Thursday 2026-09-03). Cross-referenced against the flow doc Devrin wrote for her (`03 Delivery/1_1_s/Greenbriar Portco Mtg Schedule Flow.docx`), the Critical Operations office hours log, and the cohort tracker.*

*Purpose: the raw material for building the POC demo. Facts only, attributed with timestamps. Nothing here is verified with Peggy directly yet.*

---

## 1. Who Peggy is

- **Peggy Conway**, Executive Assistant, Greenbriar, Cohort B (Finance, Admin and Ops). Email pconway@greenbriar.com per the tracker.
- Devrin's description [00:22:18]: "Peggy is in the critical back office operations. She's in her 60s, but she has had a great use case that she came up with herself."
- She sits on the DealCloud investor-relations side too: "Peggy put in all of the granular details for DealCloud to make it work... after every meeting she takes all the notes and she puts it into DealCloud. Manually." [00:32:25], [00:32:52]
- Tracker note under Devrin: "Peggy has put together an entire quarterly Portco meeting scheduler" with a Google Doc link. 1:1 marked held, brief marked yes.
- From the Critical Operations office hours (earlier, separate log): she uses Outlook, asked whether Copilot or ChatGPT was the right tool for calendar work, and Scott Parkis told her to use Copilot with GPT-5 selected and "think harder" on. Her words: "so far it's been perfect. What I think has been a really good tool is the prompt of ask me some questions."
- Devrin on the call: "I could held her back on her enthusiasm" [00:29:39]. She is a willing, self-starting sponsor.

## 2. The problem, in the words used on the call

Devrin [00:22:18]:

> "She's already working on this for 2027. She has five portfolio companies and then there's another person like her who has another five and then there's a third person. I think they have 15 portfolio companies. They have to schedule four quarterly meetings next year with all the partners with the client and with the board members in locations and arrange travel and an agenda."

> "She's manually going through everyone's calendar and putting together a spreadsheet to find the availability of people's blocks of time. And then she's basically putting together best windows and then she's sending it out to the portcos and then she's coming back and checking calendars and then she's trying to book this."

> "She said it's taking her like two months for each portco to get this done and she can do this now in a matter of days."

Scale, as stated:

| Item | Number | Source |
|---|---|---|
| Portcos Peggy handles | 5 | Devrin [00:22:18], [00:23:40] |
| EAs doing the same job | 3 | Devrin [00:22:18] |
| Portcos across the three EAs | 15 | Devrin [00:22:18] |
| Quarterly meetings per portco per year | 4 | Devrin [00:22:18] |
| Time today, per portco | About two months | Devrin, quoting Peggy [00:22:18] |
| Time with the flow | "A matter of days" | Devrin, quoting Peggy [00:22:18] |
| Total portfolio if extended | "25, 26" | Olivier [00:24:22], uncertain |
| LP meetings in cycle (extension) | 250 | Devrin [00:29:39] |

Devrin on the dollar value [00:22:59]: "I'd love to also be able to quantify this from a dollar figure because to look at her time and just say how much she saved is crazy." No figure exists yet. [PLACEHOLDER: dollar figure, Devrin owes it.]

## 3. The workflow as it stands today

### 3a. How Devrin described it on the call [00:22:18]

1. **Availability.** She goes into Copilot (not Claude, because Copilot reads their Outlook mail and calendars) and asks: "give me blocks of time for these four partners over 2027, one per quarter, and give me all their available times when all four of them are available." Copilot returns a spreadsheet.
2. **Top three windows.** Next prompt: "put together the top three times for each quarter that work and build me a one pager which I'm going to send to the portco to say here are three time slots for each quarter that we'd like. You choose one of them for each quarter and come back to us."
3. **Portco response.** The portco picks one per quarter. Their picks populate a spreadsheet.
4. **Board members.** Same proposal goes to the board members: "this is the date that we proposed. It works for us and for the portco. Board members, can you approve?" Once approved, the time is locked.
5. **Planning.** Travel for partners, hotel, and a restaurant reservation near the portco's office.

### 3b. The written flow doc (Devrin sent it to Peggy after the 1:1)

| Step | Title | What she does | Where AI helps |
|---|---|---|---|
| 1 | Group Scheduling | Define and confirm 4-hour availability blocks for all partners and board members | Identify optimal availability blocks and automatically re-verify when conflicts emerge |
| 2 | Greenbriar Options Shortlist | Three potential meeting and dinner options per quarter for the portco | Generate options from scheduling parameters and export into a document |
| 3 | Portco Confirmation | Draft and send a formal timetable to the portco executive team | Draft the proposal email and structure the communication |
| 4 | Board Buy-in | Present the agreed dates to the board, secure commitment, track attendance | Monitor email subject lines for confirmations and conflicts, update the status tracking spreadsheet |
| 5 | Travel Logistics | Travel, hotel, and restaurant arrangements for Greenbriar partners in target cities | Research and identify vetted hotel and dinner options matching the meeting dates |
| 6 | Other steps | Internal approval: check partner availability and get internal sign-off before contacting the portco | Not specified |

Two details in the flow doc that were not said on the call:
- Availability blocks are **4 hours**, not full days.
- Peggy is drafting her own end-to-end documentation of the flow, **due to Devrin by October 10**. Separately, Devrin said on the call she would return changes to his flow doc "by next week" [00:22:59].

### 3c. What already works

- Step 1 runs today. Devrin [00:28:44]: "She actually already had the spreadsheet pulled of the available times because she went to Copilot and did it."
- Calendar permissions are not a blocker. Jordache asked [00:28:30]: "as long as the permissions are already there... we don't need to ask for permission to be able to have viewability of that stuff?" Devrin: "No, she already, she actually already did it."
- Steps 2 through 5 are still Peggy, spreadsheets, and email.

## 4. What the team thinks it should become

### 4a. Agent underneath
Peter [00:23:13]: "Sounds like an agent build to me. It's an agent with an extensive set of instructions and a number of skills to do all this. Exactly all those steps."

### 4b. Dashboard on top, not a chat window
This is the design position Jordache put on the table and the room adopted.

Jordache [00:25:03], [00:25:31]: "It would probably be better to be able to have a UI on top of this where they're clicking... They're not actually having to go in and doing this stuff with a chat or a chatbot. It's more like a dashboard workflow standpoint of push a button, go do this. This comes back, brings the results back and then it moves."

Devrin [00:25:45]: "This could be something we could spin into. If this is the brains behind the workflow and the logic and the steps, you could do a front end to this thing."

Olivier [00:26:26]: "UI build exercise more than anything else."

Jordache [00:26:40]: "Once this underlying infrastructure is built out, and the flows built out and we know the skills that need to happen, then it's just a UI that sits on top that triggers those things underneath it and brings it back into a better user experience. Because it's like tracking. It's like a pipeline. It's like a sales pipeline. Where are people at in this process? Where do we need to do. And it's bringing that back versus having to go through a chatbot interface for these assistants or for Peggy and her compadres."

The mental model, then: **a pipeline board.** Each portco is a card. Each card moves through the five stages. Buttons on the card fire the agent step (pull availability, build the one-pager, draft the portco email, log the board confirmations, shortlist travel). The board shows where every portco and every quarter sits.

### 4c. Why it's the easy one
Jordache [00:25:58]: "This is an easy lift per se compared to other ones. Because we're not bringing in any data besides calendars at this point in time."

Jordache [00:28:58]: "This is a little lift on our end compared to the back end side of things."

### 4d. Why it matters beyond Peggy
Olivier [00:23:54], [00:24:22]: "Every year I think this can be extended to the rest of the portfolio... I'm sure the other five assistants do exactly the same for five other companies each."

Jordache [00:28:58]: "It's not just for Peggy. There's a much bigger impact on the organization if we can prove this out."

Devrin [00:27:21]: "I think this would jump off the page if they could see this and then they knew that they do this for 25."

### 4e. The extension: LP meetings in cycle
Devrin [00:29:39]: "She also works with the investor relations team, the same guys that are doing that dashboard thing. She's responsible for all the scheduling of the LP meetings. Once those start coming back into cycle, the 250 that they basically have to set up and have calls with. She sets up all those meetings and she thinks that this scheduling tool can do the same thing."

Devrin on whether it is the same tool [00:30:34], [00:31:02]: "Maybe it's a different front end. Maybe it's not the same one... It's the same manual load that she's doing." And [00:31:30]: "Here's the 250 broken up. These are the big whales. This one matches with this investment team partner. There's a whole matrix of who talks to who."

Olivier [00:31:43] connected this to DealCloud: "That's the DealCloud reference." Peggy keys meeting notes into DealCloud manually after every LP meeting [00:32:25].

Read: same engine, different inputs. Portco version matches four partners against a portco and a board. LP version matches a partner-to-LP matrix (out of DealCloud) against calendars. Do not build the LP version for the AI Council. Show it as the "same tool, next use" slide.

## 5. How the demo gets built

Peter [00:26:54]: "Would we want to demo this then? It's a simple UI build and just quantifying the [savings]."

Jordache [00:27:07]: "We could easily mock up the calendars and responses, etc. We would just create a mock experience with this just so we don't have to worry about going into actual people's calendars."

Devrin [00:27:21]: "We'd mock it up with the names of the partners. She gave me one of the portcos that she's doing this for."

Devrin's ask to Jordache [00:51:44]: "I'd love your thoughts on whether or not this scheduling demo is even realistic to be able to fake it, mock it up as a fake. If I give you some information."

Jordache [00:51:57]: "My gut tells me yes. Just send me some more details on this and we can see what we can do on that."

Peter [00:55:52]: "Devin, you want to hook Jordache up with those two then?" Confirmed: the scheduler and the IR dashboard are the two POCs going into the AI Council.

Decisions implied by the above:
- **Mock data, not live calendars.** Real partner names, one real portco (the one Peggy gave Devrin), fabricated availability.
- **Mock the outbound and inbound email.** Steps 3 and 4 need Outlook send and inbox monitoring, which is a connector Greenbriar has not approved for Claude. Fake the send and fake the confirmations coming back. Say so on the slide.
- **Visual aid.** Devrin wants the flow as a visual for the room [00:22:59] regardless of the demo.

## 6. Dependencies and blockers

| Item | Status | Owner |
|---|---|---|
| Peggy's edits to Devrin's flow doc | Due "next week" from Sept 4, so this week | Peggy, via Devrin |
| Peggy's full end-to-end documentation | Due Oct 10 | Peggy |
| Details for the mock: partner names, the one real portco, board member roles, 2027 portco list | Devrin said he would send | Devrin |
| Dollar figure and visual aid | Owed | Devrin |
| Calendar read | Working today via Copilot | None |
| Outlook send and inbox monitoring | Not approved for Claude; mock it | Scott, AI Council connector list |
| Internal approval step (who signs off before portco contact) | In the flow doc, not defined | Ask Peggy |
| Travel booking rules and budget | Not discussed | Ask Peggy |
| Whether the three EAs share one board or each run their own | Not discussed | Ask Peggy |
| Copilot vs Claude for the production version | Scott prefers Copilot with GPT-5 for anything touching mailboxes (office hours). Demo can run on anything; production tool choice goes to Scott | Scott |

## 7. Open questions for Peggy before build

1. Are the "four partners" fixed per portco, or does the partner set change by portco?
2. How many board members per portco, and are their calendars visible to her or does she only reach them by email?
3. What does the one-pager to the portco look like today? Get a real one, redacted.
4. What does "locked in" mean operationally: a calendar invite she sends, or something else?
5. How does she track status today? A spreadsheet? Get the columns.
6. Travel: who books, what tools, any policy on hotels and dinner spend?
7. Does she want the LP version at all this year, or is that next fundraising cycle only?

## 8. The story in the room (AI Council, roughly Sept 14)

- Tier: "AI-enabled" automation in Devrin's three-tier frame (AI-assisted quick wins, AI-enabled automations, enterprise data plays) [00:13:47].
- The line: a self-taught EA in Cohort B built the first step herself in Copilot. Two months per portco becomes days. Fifteen portcos this year, the whole portfolio after that, and the 250 LP meetings when the next fund goes to market.
- Olivier's requirement [00:49:26]: "pick an example from every single major team." This is the back-office example. The IR dashboard is the IR example. The investment team still has no demo; that is a separate open decision, not this document's problem.

## 9. What is not in the transcript

- Peggy's own voice on the workflow. Everything is Devrin's retelling.
- Any screenshot, spreadsheet, or one-pager from her current process.
- The Google Doc linked in the tracker was not opened for this extract.
- Any number for hours per week, cost per hour, or partner time consumed.
- The Sept 8 EAI team meeting transcript contains no mention of Peggy or the scheduler.
