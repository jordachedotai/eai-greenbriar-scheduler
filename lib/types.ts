// Types for the Greenbriar portco meeting scheduler.
// Source of truth: docs/DATA.md. Keep this file in sync with it.

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export type Partner = {
  id: string;
  name: string;
  title: string;
  homeCity: string;
};

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
};

export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type QuarterStatus =
  | "pending"
  | "availability"
  | "shortlist"
  | "internal"
  | "portco"
  | "board"
  | "locked";

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
  shortlist: Window[]; // top 3 from stage 2
  thin?: boolean; // fewer than 3 windows found in stage 1
  portcoPick?: string; // window id
  internalApprovals: Record<string, boolean>; // partnerId -> approved
  boardResponses: Record<string, BoardResponse>; // boardMemberId -> response
  logistics?: Logistics;
};

export type LogActor = "ea" | "agent" | "portco" | "board";
export type LogEntry = { at: string; actor: LogActor; text: string };

export type Portco = PortcoSeed & {
  stage: Stage;
  quarters: Record<Quarter, QuarterState>;
  log: LogEntry[];
  drafts: Record<string, Draft>; // keyed by DraftKey
};

// Draft keys: "onepager", "portcoEmail", "boardEmail", "logistics", "conflict:Q3"
export type DraftKey = string;

export type DraftKind = "onepager" | "portcoEmail" | "boardEmail" | "conflict" | "logistics";

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

// A saved snapshot for the presenter menu. Partial: only the portcos listed
// are overridden, everything else starts fresh.
export type DemoState = {
  description: string;
  portcos: Record<string, Partial<Portco>>;
};

export const STAGE_NAMES: Record<Stage, string> = {
  0: "Setup",
  1: "Availability",
  2: "Shortlist",
  3: "Internal approval",
  4: "Portco confirmation",
  5: "Board buy-in",
  6: "Locked and logistics",
};

export const STAGE_BUTTONS: Record<Stage, string> = {
  0: "Pull availability",
  1: "Build shortlist",
  2: "Send for internal approval",
  3: "Send to portco",
  4: "Send to board",
  5: "Lock and plan logistics",
  6: "Approve logistics",
};

export const STATUS_STAGE: Record<QuarterStatus, Stage> = {
  pending: 0,
  availability: 1,
  shortlist: 2,
  internal: 3,
  portco: 4,
  board: 5,
  locked: 6,
};

export const STATUS_LABEL: Record<QuarterStatus, string> = {
  pending: "Not started",
  availability: "Availability pulled",
  shortlist: "Shortlist drafted",
  internal: "Internal approval",
  portco: "With portco",
  board: "With board",
  locked: "Locked",
};
