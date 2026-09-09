# Data model and fixtures (v2)

*Updated 2026-09-09 for the five-stage model, EAs, and fifteen portcos. See `V2_FEEDBACK.md`.*

All data is JSON in `/data`. Types in `lib/types.ts`. A generator in `scripts/gen-fixtures.ts` builds availability and venues so they can be regenerated. Names files are hand-edited so the real names can be swapped in.

## Types

```ts
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

type Partner = { id: string; name: string; title: string; homeCity: string };

type EA = { id: string; name: string; title: string; isCurrentUser: boolean };
// eas.json: ea1 Peggy Conway (current user), ea2 and ea3 placeholders until Greenbriar confirms names.

type Stage = 1 | 2 | 3 | 4 | 5; // findDates, partnerSignoff, portcoPicks, boardConfirms, lockAndBook
type WaitingOn = "none" | "partners" | "portco" | "board";

type BoardMember = { id: string; name: string; portcoId: string; role: string; calendarVisible: boolean };
// calendarVisible false means the EA only reaches them by email. Stage 1 then treats them as
// "unknown, confirm by email" rather than free or busy. Default false for the demo. See open question 4.

type Portco = {
  id: string; name: string; city: string; officeAddress: string;
  partnerIds: string[];            // 4 partners per portco by default
  execContact: { name: string; title: string };
  targetQuarters: Quarter[];       // ["Q1","Q2","Q3","Q4"]
  eaId: string;
  stage: Stage;
  waitingOn: WaitingOn;
  waitingSince?: string;        // ISO, shown as "since Tue"
  quarters: Record<Quarter, QuarterState>;
  log: LogEntry[];
};

type AvailabilityBlock = { personId: string; start: string; end: string }; // ISO, 2027
// Fixture holds FREE blocks per person, not busy. Simpler to intersect and to explain.

type Window = {
  id: string; quarter: Quarter; start: string; end: string;   // 4-hour block
  attendeesFree: string[]; attendeesUnknown: string[];         // ids
  dinnerStart: string; rank?: 1 | 2 | 3; reason?: string;
};

type QuarterState = {
  status: "notStarted" | "datesFound" | "partnersSignedOff" | "portcoPicked" | "boardConfirmed" | "locked";
  windows: Window[];               // all found in stage 1
  shortlist: Window[];             // top 3 from stage 2
  portcoPick?: string;             // window id
  internalApprovals: Record<string, boolean>;   // partnerId -> approved
  boardResponses: Record<string, "pending" | "confirmed" | "declined">;
  logistics?: { hotel: Venue; restaurant: Venue; reason: string };
};

type Venue = { id: string; city: string; type: "hotel" | "restaurant"; name: string; distanceMi: number; note: string };

type LogEntry = { at: string; actor: "ea" | "agent" | "portco" | "board"; text: string };

type Draft = { kind: "onepager" | "portcoEmail" | "boardEmail" | "logistics"; portcoId: string; quarter?: Quarter; text: string; approved: boolean };
```

## Fixtures

### partners.json
Four partners. Placeholder names until Peggy or Devrin supplies real ones. Keep the ids stable (`p1` to `p4`) so the swap is names only.

### portcos.json
Fifteen portcos across three EAs (five each). Peggy's five keep the Phase 3 names and cities (Denver, Nashville, Charlotte, Phoenix, Boston); one slot is reserved for the real portco Peggy gave Devrin. Ten more for EA 2 and EA 3 in new cities (for example Austin, Minneapolis, Atlanta, Salt Lake City, Pittsburgh, Tampa, Kansas City, Columbus, Portland, Raleigh). Each has an office address, an exec contact, three board members, and an `eaId`.

Staggering for the `council` state: about 3 locked, 3 waiting on the board, 3 waiting on the portco, 2 waiting on partners, 4 not started. Peggy's five: Cumberland not started (the walkthrough), one waiting on the portco, one waiting on the board, one locked, one waiting on partners.

Do not use real company names. Fictional names should sound like mid-market operating companies, not startups.

### board-members.json
Three per portco. `calendarVisible: false` for all in the demo.

### availability.json
Free blocks per partner for all of 2027, generated. Rules for the generator so the demo has texture:
- Each partner is free roughly 40 percent of weekday working hours.
- Bake in at least one quarter per portco where the intersection is thin (2 windows, not 3), so the warning shows.
- Bake in a quarter where a later board decline forces a fallback to the rank-2 window.
- Blocks are 8am to 6pm local, Monday to Thursday. No Fridays.

### venues.json
Per city: three hotels and three restaurants with distance from the portco office and a one-line note. Fictional or generic. The agent picks one of each.

### mock-agent-outputs.json
Pre-written outputs for every agent step for every portco and quarter, keyed `${portcoId}.${quarter}.${kind}`. Mock mode reads these. Written in the EA's voice, not a developer's. Regenerate once the real names land.

### demo-states.json
Saved snapshots of the full app state: `fresh` (all 15 not started), `council` (staggered per above, Cumberland not started; the default for the room), `council-at-board` (same, with Cumberland at stage 4 and picks recorded). The presenter menu loads them.

## Swap procedure for real data

1. Replace names in `partners.json`, `eas.json`, and `portcos.json`. Keep ids.
2. Run `npm run gen:fixtures` to rebuild availability and venues for any new city.
3. Run `npm run gen:mock` (live Claude call) to rebuild `mock-agent-outputs.json` with the new names.
4. Run the Playwright smoke test.
