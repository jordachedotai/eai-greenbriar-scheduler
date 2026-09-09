// Types for the Greenbriar portco meeting scheduler, v2 (five stages).
// Source of truth: docs/DATA.md. Keep this file in sync with it.

// A quarter key, "YYYY-Qn". Companies plan a window of one to eight of
// them, so two years can appear side by side. See lib/quarters.ts.
export type Quarter = string;

export type Partner = { id: string; name: string; title: string; homeCity: string; avatar?: string };

export type EA = { id: string; name: string; title: string; isCurrentUser: boolean; avatar?: string };

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
  sector?: string;
  website?: string;
  logo?: string; // local path under /public
  city: string;
  cityVerify?: boolean; // HQ city needs Peggy to confirm
  officeAddress: string; // fictional
  partnerIds: string[]; // the real Greenbriar deal team
  execContact: ExecContact; // fictional
  // The planning window: which quarters this company is scheduling.
  startQuarter: Quarter; // "2027-Q1"
  quarterCount: number; // 1 to 8
  blockHours?: number; // meeting length, default 4
  dinnerTime?: string; // "18:30"
  targetQuarters: Quarter[]; // derived from the window; kept so every loop reads it
  eaId: string; // placeholder until Peggy confirms
};

export type Stage = 1 | 2 | 3 | 4 | 5 | 6;
export const STAGES: Stage[] = [1, 2, 3, 4, 5, 6];

export type StageKey = "findDates" | "partnerSignoff" | "portcoPicks" | "boardConfirms" | "lockAndBook" | "sendInvites";
export const STAGE_KEY: Record<Stage, StageKey> = {
  1: "findDates",
  2: "partnerSignoff",
  3: "portcoPicks",
  4: "boardConfirms",
  5: "lockAndBook",
  6: "sendInvites",
};

export const STAGE_NAMES: Record<Stage, string> = {
  1: "Find dates",
  2: "Partner sign-off",
  3: "Company picks",
  4: "Board confirms",
  5: "Lock and book",
  6: "Send invites",
};

export type WaitingOn = "none" | "partners" | "portco" | "board" | "attendees";

export type QuarterStatus =
  | "notStarted"
  | "datesFound"
  | "partnersSignedOff"
  | "portcoPicked"
  | "boardConfirmed"
  | "locked"
  | "invited";

// The stage a quarter is in, given its status.
export const STATUS_STAGE: Record<QuarterStatus, Stage> = {
  notStarted: 1,
  datesFound: 2,
  partnersSignedOff: 3,
  portcoPicked: 4,
  boardConfirmed: 5,
  locked: 6,
  invited: 6,
};

export const STATUS_LABEL: Record<QuarterStatus, string> = {
  notStarted: "Not started",
  datesFound: "Dates found",
  partnersSignedOff: "Partners signed off",
  portcoPicked: "Company picked",
  boardConfirmed: "Board confirmed",
  locked: "Locked",
  invited: "Invites out",
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
  address?: string;
  addedBy?: string; // EA id, for venues the assistant added
  addedAt?: string; // ISO
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

export type AttendanceStatus = "accepted" | "tentative" | "noReply";
export type TravelStatus = "booked" | "pending";

export type LogActor = "ea" | "agent" | "portco" | "board" | "partner";
export type LogEntry = { at: string; actor: LogActor; text: string; personId?: string; replyId?: string };

// An email the agent read (a reply) or one the EA sent. Every pick and
// every board reply points at one, so the EA can see where it came from.
export type ReplyEmail = {
  id: string;
  kind: "partner" | "portco" | "board" | "sent";
  from: { name: string; personId?: string };
  to: string;
  at: string; // ISO
  subject: string;
  body: string;
  quarter?: Quarter;
};

export type DraftKind = "onepager" | "partnerEmail" | "portcoEmail" | "boardEmail" | "conflict" | "logistics" | "invites";

// One calendar invite per meeting, built by code at lock time.
export type Invite = {
  quarter: Quarter;
  title: string;
  start: string; // naive ISO
  end: string;
  location: string;
  dinner: { venue: string; start: string };
  attendeeIds: string[]; // partners, "exec", board members
  body: string;
};

// Every email and the one-pager share one structure, so one renderer
// draws them all with the same line breaks. `lists` holds date blocks.
export type EmailFields = {
  subject?: string; // emails
  title?: string; // the one-pager
  greeting?: string;
  paragraphs: string[];
  lists?: { heading?: string; note?: string; items: string[] }[];
  ask?: string;
  signoff: string[];
};

export type Draft = {
  kind: DraftKind;
  portcoId: string;
  quarter?: Quarter;
  text: string; // plain rendering of `email`, or the EA's edited text
  email?: EmailFields; // structured fields; dropped once the EA edits the text
  attachment?: { name: string; draftKey: string }; // the one attachment in the tool: the one-pager on the company proposal
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
  checkedPartnerIds?: string[]; // whose calendars Find dates checks; defaults to partnerIds
  boardMembers?: BoardMember[]; // set for companies added in Settings; otherwise board-members.json
  replies?: ReplyEmail[]; // emails read or sent, newest last
  attendance?: Partial<Record<Quarter, Record<string, AttendanceStatus>>>; // after lock: invite replies per attendee ("exec" for the company contact)
  travel?: Record<string, TravelStatus>; // after lock: per partner
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
