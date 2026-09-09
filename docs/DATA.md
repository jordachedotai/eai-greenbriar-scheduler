# Data model and fixtures (v2)

*Updated 2026-09-09 for the five-stage model, EAs, and fifteen portcos. See `V2_FEEDBACK.md`.*

All data is JSON in `/data`. Types in `lib/types.ts`. A generator in `scripts/gen-fixtures.ts` builds availability and venues so they can be regenerated. Names files are hand-edited so the real names can be swapped in.

## Types

```ts
type Quarter = string; // "YYYY-Qn". A company plans a window of 1 to 8 quarters, which can span two years.

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
  startQuarter: Quarter;           // "2027-Q1"
  quarterCount: number;            // 1 to 8
  blockHours?: number;             // default 4
  dinnerTime?: string;             // default "18:30"
  targetQuarters: Quarter[];       // derived from the window
  eaId: string;
  stage: Stage;
  waitingOn: WaitingOn;
  waitingSince?: string;        // ISO, shown as "since Tue"
  skippedDays?: number;         // days Find dates skipped because other companies held them
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
  windows: Window[];               // all found in stage 1, each with a reason line
  shortlist: Window[];             // the ranked options, two or three; the EA can swap, remove, reorder
  portcoPick?: string;             // window id
  internalApprovals: Record<string, boolean>;   // partnerId -> approved
  boardResponses: Record<string, "pending" | "confirmed" | "declined">;
  logistics?: { hotel: Venue; restaurant: Venue; reason: string };
};

type Venue = { id: string; city: string; type: "hotel" | "restaurant"; name: string; distanceMi: number; note: string };

type LogEntry = { at: string; actor: "ea" | "agent" | "portco" | "board"; text: string };

type EmailFields = { subject?: string; title?: string; greeting?: string; paragraphs: string[]; lists?: { heading?: string; note?: string; items: string[] }[]; ask?: string; signoff: string[] };
// Every email and the one-pager share this shape. `text` is the plain rendering the EA can edit.

type Draft = { kind: "onepager" | "partnerEmail" | "portcoEmail" | "boardEmail" | "conflict" | "logistics"; portcoId: string; quarter?: Quarter; text: string; email?: EmailFields; approved: boolean };
```

## Fixtures

### Source files and the import
`data/source/greenbriar-portfolio.json` and `data/source/greenbriar-team.json` hold the real companies, deal teams, and roster from greenbriar.com. `npm run import:source` builds `partners.json`, `portcos.json`, and `board-members.json` from them, merged with the fictional parts kept in a table inside `scripts/import-source.ts`: office street addresses, executive contacts, board members, and the placeholder EA assignment. Ids are derived from company names, so `SunAuto Tire & Service` is `sunauto-tire-service`.

### partners.json
The 17 real deal-team members across the 18 companies, with `avatar`. Ids are the site slugs (`michael-wang`).

### portcos.json
Fifteen portcos across three EAs (five each). Peggy's five keep the Phase 3 names and cities (Denver, Nashville, Charlotte, Phoenix, Boston); one slot is reserved for the real portco Peggy gave Devrin. Ten more for EA 2 and EA 3 in new cities (for example Austin, Minneapolis, Atlanta, Salt Lake City, Pittsburgh, Tampa, Kansas City, Columbus, Portland, Raleigh). Each has an office address, an exec contact, three board members, and an `eaId`.

Staggering for the `council` state: about 3 locked, 3 waiting on the board, 3 waiting on the portco, 2 waiting on partners, 4 not started. Peggy's five: Cumberland not started (the walkthrough), one waiting on the portco, one waiting on the board, one locked, one waiting on partners.

Do not use real company names. Fictional names should sound like mid-market operating companies, not startups.

### board-members.json
Three per portco, fictional. `calendarVisible: false` for all in the demo. AIT's second member, Raymond Cho, is the one who declines Q3 in the demo.

### availability.json
Free blocks per partner for all of 2027, generated by `lib/availabilityGen.ts`, which also runs in the browser: a person with no fixture calendar (a roster member added to a company in Settings) gets a seeded calendar from their id at Find dates time. Rules for the generator so the demo has texture:
- Each partner is free roughly 40 percent of weekday working hours.
- The walkthrough portco (AIT) is thin in Q3: exactly two days when its five partners are all free. Every other partner is made busy on those days so no other portco lists them. No other portco's partner set may sit inside or around AIT's, or its Q3 would collide or be empty. The generator checks this.
- Find dates skips days already held for other portcos that share a partner: while options are out, the first option is penciled in; a pick or lock holds that day. The calendar shows the same days. Demo states are generated in order so the calendar never stacks meetings on one day.
- Bake in a quarter where a later board decline forces a fallback to the rank-2 window.
- Blocks are 8am to 6pm local, Monday to Thursday. No Fridays.

### venues.json
Per city: three hotels and three restaurants with distance from the portco office and a one-line note. Fictional or generic. The agent picks one of each.

### mock-agent-outputs.json
A preview of every agent step for every portco, keyed `${portcoId}.${quarter}.${kind}`, written by `npm run gen:mock`. Mock mode does not read it: it renders the same templates (`lib/mockAgent.ts`) at runtime over the live shortlist, so the one-pager always lists the dates on screen. Pre-written text would drift as held days change the shortlist. Written in the EA's voice, not a developer's.

### demo-states.json
Saved snapshots of the full app state: `fresh` (all 15 not started), `council` (staggered per above, Cumberland not started; the default for the room), `council-at-board` (same, with Cumberland at stage 4 and picks recorded). The presenter menu loads them.

## Swap procedure for real data

1. Edit `data/source/*.json` or the fiction and EA tables in `scripts/import-source.ts`, then `npm run import:source`. Edit `eas.json` by hand.
2. Run `npm run gen:fixtures` to rebuild availability and venues for any new city (add the city's venues to the generator first).
3. Run `npm run gen:states` to rebuild the demo states with the new names.
4. Run `npm run gen:mock` to preview the wording, or `npm run gen:mock -- --live` to preview Claude's.
5. Run the Playwright smoke test.
