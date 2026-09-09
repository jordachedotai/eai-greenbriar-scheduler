// Types for the Greenbriar portco meeting scheduler, v2 (five stages).
// Source of truth: docs/DATA.md. Keep this file in sync with it.

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export type Partner = { id: string; name: string; title: string; homeCity: string };

export type EA = { id: string; name: string; title: string; isCurrentUser: boolean };

export type BoardMember = {
  id: string;
  name: string;
  portcoId: string;
  role: string;
  // false means the EA only reaches them by email. Stage 1 treats them as
  // "unknown, confirm by email" rather than free or busy.
  calendarVisible: boolean;
};

export type ExecContact = { name: string; title: string };

// What portcos.json holds. Static, hand-edited, swappable for real names.
export type PortcoSeed = {
  id: string;
  name: string;
  city: string;
  officeAddress: string;
  partnerIds: string[];
  execContact: ExecContact;
  targetQuarters: Quarter[];
  eaId: string;
};

export type Stage = 1 | 2 | 3 | 4 | 5;
export const STAGES: Stage[] = [1, 2, 3, 4, 5];

export type StageKey = "findDates" | "partnerSignoff" | "portcoPicks" | "boardConfirms" | "lockAndBook";
export const STAGE_KEY: Record<Stage, StageKey> = {
  1: "findDates",
  2: "partnerSignoff",
  3: "portcoPicks",
  4: "boardConfirms",
  5: "lockAndBook",
};

export const STAGE_NAMES: Record<Stage, string> = {
  1: "Find dates",
  2: "Partner sign-off",
  3: "Portco picks",
  4: "Board confirms",
  5: "Lock and book",
};

export type WaitingOn = "none" | "partners" | "portco" | "board";

export type QuarterStatus =
  | "notStarted"
  | "datesFound"
  | "partnersSignedOff"
  | "portcoPicked"
  | "boardConfirmed"
  | "locked";

// The stage a quarter is in, given its status.
export const STATUS_STAGE: Record<QuarterStatus, Stage> = {
  notStarted: 1,
  datesFound: 2,
  partnersSignedOff: 3,
  portcoPicked: 4,
  boardConfirmed: 5,
  locked: 5,
};

export const STATUS_LABEL: Record<QuarterStatus, string> = {
  notStarted: "Not started",
  datesFound: "Dates found",
  partnersSignedOff: "Partners signed off",
  portcoPicked: "Portco picked",
  boardConfirmed: "Board confirmed",
  locked: "Locked",
};

// Free blocks per person, not busy. Times are naive ISO local wall-clock
// strings ("2027-02-09T08:00:00") interpreted in the meeting city.
export type AvailabilityBlock = { personId: string; start: string; end: string };

export type Window = {
  id: string;
  quarter: Quarter;
  start: string; // 4-hour block, naive ISO local
  end: string;
  attendeesFree: string[]; // ids whose calendar showed them free
  attendeesUnknown: string[]; // ids with no visible calendar, confirm by email
  dinnerStart: string;
  rank?: 1 | 2 | 3;
  reason?: string;
};

export type Venue = {
  id: string;
  city: string;
  type: "hotel" | "restaurant";
  name: string;
  distanceMi: number;
  note: string;
};

export type Logistics = { hotel: Venue; restaurant: Venue; reason: string };

export type BoardResponse = "pending" | "confirmed" | "declined";

export type QuarterState = {
  status: QuarterStatus;
  windows: Window[]; // all found in stage 1
  shortlist: Window[]; // top 3, ranked in stage 1
  thin?: boolean; // fewer than 3 windows found
  portcoPick?: string; // window id
  internalApprovals: Record<string, boolean>; // partnerId -> replied yes
  boardResponses: Record<string, BoardResponse>; // boardMemberId -> response
  logistics?: Logistics;
};

export type LogActor = "ea" | "agent" | "portco" | "board" | "partner";
export type LogEntry = { at: string; actor: LogActor; text: string };

export type DraftKind = "onepager" | "partnerEmail" | "portcoEmail" | "boardEmail" | "conflict" | "logistics";

export type Draft = {
  kind: DraftKind;
  portcoId: string;
  quarter?: Quarter;
  text: string;
  approved: boolean;
  offline?: boolean; // live call failed, mock output served instead
  variant?: number; // bumps on Regenerate
  data?: unknown; // structured payload for conflict and logistics drafts
};

export type LogisticsPick = { hotelId: string; restaurantId: string; reason: string };
export type LogisticsData = Partial<Record<Quarter, LogisticsPick>>;

export type ConflictData = {
  quarter: Quarter;
  memberId: string;
  declinedWindowId: string;
  fallbackWindowId: string | null;
  reverify: { ok: boolean; busy: string[] };
  note: string; // two sentences to the EA
  resend: string; // paragraph to the board
};

// Runtime record. `stage` is derived from the quarters (lib/pipeline.ts),
// not stored, so it can never disagree with them.
export type Portco = PortcoSeed & {
  waitingOn: WaitingOn;
  waitingSince?: string; // ISO
  quarters: Record<Quarter, QuarterState>;
  log: LogEntry[];
  drafts: Record<string, Draft>; // "onepager", "partnerEmail", "portcoEmail", "boardEmail", "logistics", "conflict:Q3"
};

// A saved snapshot for the presenter menu. Partial: only the portcos listed
// are overridden, everything else starts fresh.
export type DemoState = {
  description: string;
  portcos: Record<string, Partial<Portco>>;
};
