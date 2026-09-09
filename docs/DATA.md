# Data model and fixtures

All data is JSON in `/data`. Types in `lib/types.ts`. A generator in `scripts/gen-fixtures.ts` builds availability and venues so they can be regenerated. Names files are hand-edited so the real names can be swapped in.

## Types

```ts
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

type Partner = { id: string; name: string; title: string; homeCity: string };

type BoardMember = { id: string; name: string; portcoId: string; role: string; calendarVisible: boolean };
// calendarVisible false means the EA only reaches them by email. Stage 1 then treats them as
// "unknown, confirm by email" rather than free or busy. Default false for the demo. See open question 4.

type Portco = {
  id: string; name: string; city: string; officeAddress: string;
  partnerIds: string[];            // the demo portco has all 4, the others have 3
  execContact: { name: string; title: string };
  targetQuarters: Quarter[];       // ["Q1","Q2","Q3","Q4"]
  stage: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  quarters: Record<Quarter, QuarterState>;
  log: LogEntry[];
};

type AvailabilityBlock = { personId: string; start: string; end: string }; // ISO, 2027
// Fixture holds FREE blocks per person, not busy. Simpler to intersect and to explain.
// Times are naive local wall-clock ISO ("2027-02-09T08:00:00"), read in the meeting city.

type Window = {
  id: string; quarter: Quarter; start: string; end: string;   // 4-hour block
  attendeesFree: string[]; attendeesUnknown: string[];         // ids
  dinnerStart: string; rank?: 1 | 2 | 3; reason?: string;
};

type QuarterState = {
  status: "pending" | "availability" | "shortlist" | "internal" | "portco" | "board" | "locked";
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
Holds the static fields only (`PortcoSeed` in `lib/types.ts`). `lib/data.ts` adds `stage`, `quarters`, and `log` at load time, so the file stays a plain names-and-cities list that can be swapped.

Five portcos, matching Peggy's load. One slot is reserved for the real portco Peggy gave Devrin; until then it is fictional. Cities spread across time zones so travel logistics look real: for example Denver, Nashville, Charlotte, Phoenix, Boston. Each has an office address, an exec contact, and three board members.

Do not use real company names. Fictional names should sound like mid-market operating companies, not startups.

### board-members.json
Three per portco. `calendarVisible: false` for all in the demo.

### availability.json
Free blocks per partner for all of 2027, generated. Rules for the generator so the demo has texture:
- Each partner is free roughly 40 percent of weekday working hours.
- Bake in at least one quarter per portco where the intersection is thin (2 windows, not 3), so the warning shows. The demo portco has all four partners, so its windows are a subset of every other portco's in the same quarter. That forces every portco to be thin in the same quarter. It is Q3, which reads as summer travel. The generator lowers July and August openness and carves the rest.
- Bake in a quarter where a later board decline forces a fallback to the rank-2 window.
- Blocks are 8am to 6pm local, Monday to Thursday. No Fridays.

### venues.json
Per city: three hotels and three restaurants with distance from the portco office and a one-line note. Fictional or generic. The agent picks one of each.

### mock-agent-outputs.json
Pre-written outputs for every agent step for every portco and quarter, keyed `${portcoId}.${quarter}.${kind}`. Mock mode reads these. Written in the EA's voice, not a developer's. Regenerate once the real names land.

### demo-states.json
Partial overrides applied on top of fresh portcos, so a state only lists the portcos it changes. Named: `fresh`, `one-portco-at-shortlist`, `one-portco-at-board`, `one-portco-locked`, `all-in-flight`. The presenter menu loads them. Lets the presenter skip ahead if time runs short.

## Swap procedure for real data

1. Replace names in `partners.json` and `portcos.json`. Keep ids.
2. Run `npm run gen:fixtures` to rebuild availability and venues for any new city.
3. Run `npm run gen:mock` (live Claude call) to rebuild `mock-agent-outputs.json` with the new names.
4. Run the Playwright smoke test.
