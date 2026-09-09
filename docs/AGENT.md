# Agent layer

One function per stage in `lib/agent.ts`. Each returns a `Draft` or structured result. Each has a mock path and a live path. The UI never knows which ran.

## Which steps are code and which are Claude (v2, five stages)

| Stage | Work | Code or Claude |
|---|---|---|
| 1 Find dates | Intersect the assigned partners' free blocks, find 4-hour windows, flag thin quarters, rank top three per quarter | Pure code, `lib/scheduling.ts`. Deterministic. |
| 1 Find dates | One-line reason per ranked window, the one-pager to the portco | Claude |
| 2 Partner sign-off | Draft the email to the partners asking for sign-off. Track replies | Email: Claude. Tracking: code. |
| 3 Portco picks | Draft the proposal email to the portco executive. Record the picks | Email: Claude. Picks: code. |
| 4 Board confirms | Draft the board email. On a decline, pick the next-best window from the approved shortlist and re-verify the partners | Email and the two-sentence conflict note: Claude. Fallback and re-verify: code. |
| 5 Lock and book | Pick one hotel and one restaurant per meeting from `venues.json`, with a reason | Selection: Claude, constrained to the venue list. Never invent a venue. |

Rule: anything that must be correct is code. Anything that must read well is Claude.

## Live mode

- SDK: `@anthropic-ai/sdk`. Model `claude-sonnet-5`. Temperature default. Max tokens 1200.
- Called from a Next.js route handler (`app/api/agent/route.ts`) so the key stays server-side. Key in `.env.local` as `ANTHROPIC_API_KEY`. Never commit it.
- Every call gets a system prompt from `lib/prompts.ts` and a JSON payload of only the data that step needs. No calendars go to Claude. Claude only ever sees the already-computed windows, names, cities, and the venue list.
- Ask for JSON back where the output is structured (reasons, venue picks). Ask for plain text for emails and the one-pager.
- If the call fails, fall back to mock output for that step and show a small "offline draft" tag. The demo never stalls.

## Mock mode

- `MOCK_MODE=true` in `.env.local`, or toggled from the presenter menu.
- Renders template writers in `lib/mockAgent.ts` over the same payload the live agent would get, so the wording always matches the dates on screen. Adds a 1.2 to 2.5 second delay with a working indicator so it reads as real work.
- `npm run gen:mock` writes `data/mock-agent-outputs.json` as a preview of every step for every portco, for reading and hand-checking. With `--live` it previews Claude's wording instead. The app does not read that file.

## System prompt, shared

> You are the scheduling assistant for a private equity firm's executive assistant. You write short, plain, warm business English. No jargon. No em-dashes. You never invent dates, names, or venues. You only use what is in the payload. When something is uncertain you say so in one line. Every output is a draft the assistant will review before anything is sent.

## Per-step prompts (summaries; full text lives in `lib/prompts.ts`)

**Shortlist reasons and one-pager.** Given portco, quarter, three ranked windows with attendee lists: write one sentence per window explaining why it ranks where it does, then a one-page proposal addressed to the portco exec contact listing the three options per quarter with the dinner time, asking them to pick one per quarter and reply by a date two weeks out.

**Portco proposal email.** Given the approved one-pager: a cover email of five sentences or fewer from the EA, on behalf of the partners, attaching the one-pager.

**Board email.** Given the portco's picks: an email to the board members confirming the dates, asking for a yes by a date, and noting who from Greenbriar will attend.

**Partner sign-off email.** Given the approved one-pager and the partner names: four sentences or fewer from the EA asking the partners to confirm the options are fine to send to the portco, with a reply-by date.

**Conflict explanation.** Given a decline and the fallback window: two sentences to the EA explaining what changed and what the agent proposes, plus a one-paragraph re-send to the board.

**Logistics.** Given the city, meeting date, office address, and the venue list: pick one hotel and one restaurant, each with one sentence on why. Return JSON with venue ids and reasons.

## Guardrails

- Claude never sees raw availability. It sees windows.
- Claude never picks a venue outside `venues.json`.
- Claude never marks anything sent, approved, or locked. Only the EA's click does that.
- Outputs are logged to the portco timeline as "agent" entries.
