// Pure state transitions for one portco, v2 five stages. No store, no
// agent, no I/O. lib/actions.ts wires these to the store and the agent in
// the browser. scripts/gen-states.ts composes them with mock outputs to build
// the saved demo states, so snapshots can never drift from the app.

import { findWindows, fmtDate, fmtTime, fmtWindow, nextBestWindow, rankWindows, reverifyWindow } from "./scheduling";
import { emailToText } from "./email";
import { activePartners, attendeeIds } from "./pipeline";
import { ensureAvailability } from "./availabilityGen";
import { getVenue } from "./data";
import { mockBoardReply, mockDeclineReply, mockPartnerReply, mockPicksReply } from "./mockAgent";
import { quarterLabel, quarterLong, windowQuarters, yearsOf, type PlanningWindow } from "./quarters";
import type {
  AttendanceStatus,
  AvailabilityBlock,
  BoardMember,
  ConflictData,
  Draft,
  DraftKind,
  EmailFields,
  LogActor,
  LogisticsData,
  LogisticsPick,
  Partner,
  Portco,
  Quarter,
  Invite,
  QuarterState,
  ReplyEmail,
  TravelStatus,
  Venue,
  Window,
} from "./types";

export type Deps = {
  partners: Partner[];
  boardMembers: BoardMember[];
  availability: AvailabilityBlock[];
  venues: Venue[];
  name: (id: string) => string;
  now: () => string; // ISO timestamp
};

export type ShortlistResult = { reasons: Record<string, string[]>; onepager: EmailFields };
export type ConflictResult = { note: string; resend: EmailFields };
export type LogisticsResult = { picks: Record<string, LogisticsPick> };

// ---------- helpers ----------

export function withLog(p: Portco, actor: LogActor, text: string, at: string, personId?: string, replyId?: string): Portco {
  const entry = { at, actor, text, ...(personId ? { personId } : {}), ...(replyId ? { replyId } : {}) };
  return { ...p, log: [...p.log, entry] };
}

let replySeq = 0;
function replyId(p: Portco, kind: string): string {
  return `${p.id}:${kind}:${(p.replies?.length ?? 0) + 1}:${++replySeq}`;
}

export function withReply(p: Portco, r: ReplyEmail): Portco {
  return { ...p, replies: [...(p.replies ?? []), r] };
}

// Record an email the EA sent, so the folded row can open it later.
function withSent(p: Portco, key: string, to: string, at: string): Portco {
  const d = p.drafts[key];
  if (!d) return p;
  return withReply(p, {
    id: replyId(p, "sent"),
    kind: "sent",
    from: { name: "You" },
    to,
    at,
    subject: d.email?.subject ?? d.email?.title ?? draftLabel(key),
    body: d.text,
  });
}

export function mapQuarters(p: Portco, fn: (q: Quarter, qs: QuarterState) => QuarterState): Portco {
  const quarters = { ...p.quarters };
  for (const q of p.targetQuarters) quarters[q] = fn(q, quarters[q]);
  return { ...p, quarters };
}

export function withDraft(p: Portco, key: string, draft: Draft): Portco {
  return { ...p, drafts: { ...p.drafts, [key]: draft } };
}

function draftOf(p: Portco, kind: DraftKind, text: string, offline: boolean, variant: number, extra: Partial<Draft> = {}): Draft {
  return { kind, portcoId: p.id, text, approved: false, offline, variant, ...extra };
}

function emailDraft(p: Portco, kind: DraftKind, email: EmailFields, offline: boolean, variant: number, extra: Partial<Draft> = {}): Draft {
  return draftOf(p, kind, emailToText(email), offline, variant, { email, ...extra });
}

export function membersOf(p: Portco, deps: Deps): BoardMember[] {
  return p.boardMembers ?? deps.boardMembers.filter((b) => b.portcoId === p.id);
}

export function pickedWindow(p: Portco, q: Quarter): Window | undefined {
  const qs = p.quarters[q];
  return qs.shortlist.find((w) => w.id === qs.portcoPick);
}

function waiting(p: Portco, on: Portco["waitingOn"], at: string): Portco {
  return { ...p, waitingOn: on, waitingSince: on === "none" ? undefined : at };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function countWord(n: number, noun = "meeting"): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
  return `${n === 4 ? "all four" : words[n] ?? String(n)} ${noun}${n === 1 ? "" : "s"}`;
}

// Change the planning window before any dates are found. Resets the
// quarters to match.
export function setWindow(p: Portco, w: PlanningWindow, deps: Deps): Portco {
  const targetQuarters = windowQuarters(w);
  const quarters = {} as Record<Quarter, QuarterState>;
  for (const q of targetQuarters) quarters[q] = p.quarters[q] ?? { status: "notStarted", windows: [], shortlist: [], internalApprovals: {}, boardResponses: {} };
  const next: Portco = { ...p, startQuarter: w.startQuarter, quarterCount: targetQuarters.length, blockHours: w.blockHours, dinnerTime: w.dinnerTime, targetQuarters, quarters };
  const [dh, dm] = (w.dinnerTime ?? "18:30").split(":").map(Number);
  const dinner = `${dh % 12 === 0 ? 12 : dh % 12}${dm ? ":" + String(dm).padStart(2, "0") : ""}${dh >= 12 ? "pm" : "am"}`;
  return withLog(next, "ea", `Set the planning window to ${targetQuarters.length === 1 ? quarterLong(targetQuarters[0]) : `${quarterLong(targetQuarters[0])} to ${quarterLong(targetQuarters[targetQuarters.length - 1])}`}, ${w.blockHours ?? 4} hour blocks, dinner at ${dinner}.`, deps.now());
}

// ---------- stage 1: attendees ----------

export function togglePartner(p: Portco, partnerId: string): Portco {
  const current = activePartners(p);
  const next = current.includes(partnerId) ? current.filter((id) => id !== partnerId) : [...p.partnerIds.filter((id) => current.includes(id) || id === partnerId)];
  if (next.length === 0) return p; // someone has to be in the room
  return { ...p, checkedPartnerIds: next };
}

export function addPartner(p: Portco, partnerId: string, deps: Deps): Portco {
  if (p.partnerIds.includes(partnerId)) return p;
  const next: Portco = { ...p, partnerIds: [...p.partnerIds, partnerId], checkedPartnerIds: [...activePartners(p), partnerId] };
  return withLog(next, "ea", `Added ${deps.name(partnerId)} to the Greenbriar team for this company.`, deps.now(), partnerId);
}

// ---------- stage 1: find dates ----------

export function findDates(p: Portco, deps: Deps, excludeDays: Set<string> = new Set()): Portco {
  const checked = activePartners(p);
  const availability = ensureAvailability(deps.availability, checked, yearsOf(p.targetQuarters));
  const res = findWindows({ portco: { ...p, partnerIds: checked }, partners: deps.partners, boardMembers: membersOf(p, deps), availability, excludeDays });
  const next: Portco = {
    ...mapQuarters(p, (q, qs) => ({
      ...qs,
      windows: res[q].windows,
      thin: res[q].thin,
      shortlist: rankWindows(res[q].windows),
    })),
    skippedDays: excludeDays.size,
  };
  const lbl = (q: Quarter) => quarterLabel(q, p.targetQuarters);
  const parts = p.targetQuarters.map((q) => `${lbl(q)}: ${res[q].windows.length}`);
  const thin = p.targetQuarters.filter((q) => res[q].thin).map(lbl);
  return withLog(
    next,
    "agent",
    `Checked calendars for ${joinNames(checked.map(deps.name))} and ranked the top three windows per quarter. Windows found, ${parts.join(", ")}.` +
      (thin.length ? ` ${thin.join(", ")} ${thin.length === 1 ? "is" : "are"} thin.` : "") +
      (excludeDays.size ? ` Skipped ${excludeDays.size} days already held for other portfolio company meetings.` : ""),
    deps.now(),
  );
}

export function applyOnepager(p: Portco, result: ShortlistResult, offline: boolean, variant: number, deps: Deps): Portco {
  const next = mapQuarters(p, (q, qs) => ({
    ...qs,
    shortlist: qs.shortlist.map((w, i) => ({ ...w, reason: result.reasons?.[q]?.[i] ?? w.reason })),
  }));
  return withLog(
    withDraft(next, "onepager", emailDraft(next, "onepager", result.onepager, offline, variant)),
    "agent",
    variant === 0 ? `Drafted the one-pager for ${p.execContact.name}.` : "Rewrote the one-pager.",
    deps.now(),
  );
}

// EA approves the one-pager. Stage 2 begins; the partner email is drafted next.
export function approveOnepager(p: Portco, deps: Deps): Portco {
  const approvals: Record<string, boolean> = {};
  for (const pid of p.partnerIds) approvals[pid] = false;
  let next = mapQuarters(p, (_q, qs) => ({ ...qs, status: "datesFound", internalApprovals: { ...approvals } }));
  next = withDraft(next, "onepager", { ...next.drafts.onepager, approved: true });
  return withLog(next, "ea", "Approved the one-pager.", deps.now());
}

// ---------- stage 2: partner sign-off ----------

export function applyPartnerEmail(p: Portco, email: EmailFields, offline: boolean, variant: number, deps: Deps): Portco {
  const next = withDraft(p, "partnerEmail", emailDraft(p, "partnerEmail", email, offline, variant));
  return withLog(
    next,
    "agent",
    variant === 0 ? `Drafted the sign-off email to ${joinNames(p.partnerIds.map(deps.name))}.` : "Rewrote the partner email.",
    deps.now(),
  );
}

export function sendToPartners(p: Portco, deps: Deps): Portco {
  const at = deps.now();
  let next = withDraft(p, "partnerEmail", { ...p.drafts.partnerEmail, approved: true });
  next = waiting(next, "partners", at);
  next = withSent(next, "partnerEmail", joinNames(p.partnerIds.map(deps.name)), at);
  return withLog(next, "ea", `Sent the one-pager to ${joinNames(p.partnerIds.map(deps.name))} for sign-off.`, at);
}

export function partnerReplies(p: Portco, partnerIds: string[], deps: Deps): Portco {
  let next = p;
  const thin = p.targetQuarters.find((q) => p.quarters[q].thin);
  for (const pid of partnerIds) {
    next = mapQuarters(next, (_q, qs) => ({ ...qs, internalApprovals: { ...qs.internalApprovals, [pid]: true } }));
    const at = deps.now();
    const mail = mockPartnerReply(deps.name(pid), p.name, thin);
    const id = replyId(next, "partner");
    next = withReply(next, { id, kind: "partner", from: { name: deps.name(pid), personId: pid }, to: "You", at, subject: mail.subject, body: mail.body });
    next = withLog(next, "partner", `${deps.name(pid)} replied yes.`, at, pid, id);
  }
  const allYes = next.targetQuarters.every((q) => next.partnerIds.every((pid) => next.quarters[q].internalApprovals[pid]));
  if (allYes) next = waiting(next, "none", deps.now());
  return next;
}

// EA moves to stage 3. The portco email is drafted next.
export function startPortcoPicks(p: Portco, deps: Deps): Portco {
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, status: "partnersSignedOff" }));
  return withLog(next, "ea", "All partners signed off. Moving to the company.", deps.now());
}

// ---------- stage 3: portco picks ----------

export function applyPortcoEmail(p: Portco, email: EmailFields, offline: boolean, variant: number, deps: Deps): Portco {
  const attachment = { name: `${p.name} 2027 meeting options.pdf`, draftKey: "onepager" };
  const next = withDraft(p, "portcoEmail", emailDraft(p, "portcoEmail", email, offline, variant, { attachment }));
  return withLog(next, "agent", variant === 0 ? `Drafted the proposal email to ${p.execContact.name}.` : "Rewrote the proposal email.", deps.now());
}

export function sendToPortco(p: Portco, deps: Deps): Portco {
  const at = deps.now();
  let next = withDraft(p, "portcoEmail", { ...p.drafts.portcoEmail, approved: true });
  next = waiting(next, "portco", at);
  next = withSent(next, "portcoEmail", p.execContact.name, at);
  return withLog(next, "ea", `Sent the proposal and one-pager to ${p.execContact.name}.`, at);
}

export function recordPortcoPicks(p: Portco, picks: Partial<Record<Quarter, Window>>, deps: Deps): Portco {
  let next = mapQuarters(p, (q, qs) => ({ ...qs, portcoPick: picks[q]?.id ?? qs.portcoPick }));
  const lines = p.targetQuarters.map((q) => `${quarterLabel(q, p.targetQuarters)} ${picks[q] ? fmtWindow(picks[q] as Window) : "no pick"}`);
  const at = deps.now();
  const mail = mockPicksReply(
    p.execContact.name,
    p.name,
    p.targetQuarters.flatMap((q) => (picks[q] ? [{ quarter: quarterLabel(q, p.targetQuarters), date: fmtDate((picks[q] as Window).start), time: `${fmtTime((picks[q] as Window).start)} to ${fmtTime((picks[q] as Window).end)}`, rank: (picks[q] as Window).rank ?? 1 }] : [])),
  );
  const id = replyId(next, "portco");
  next = withReply(next, { id, kind: "portco", from: { name: p.execContact.name }, to: "You", at, subject: mail.subject, body: mail.body });
  next = withLog(next, "portco", `${p.execContact.name} picked: ${lines.join("; ")}.`, at, undefined, id);
  return waiting(next, "none", deps.now());
}

// EA moves to stage 4. The board email is drafted next.
export function startBoardConfirms(p: Portco, deps: Deps): Portco {
  const members = membersOf(p, deps);
  const next = mapQuarters(p, (_q, qs) => {
    const responses: Record<string, "pending"> = {};
    for (const m of members) responses[m.id] = "pending";
    return { ...qs, status: "portcoPicked", boardResponses: responses };
  });
  return withLog(next, "ea", "Dates picked. Moving to the board.", deps.now());
}

// ---------- stage 4: board confirms ----------

export function applyBoardEmail(p: Portco, email: EmailFields, offline: boolean, variant: number, deps: Deps): Portco {
  const next = withDraft(p, "boardEmail", emailDraft(p, "boardEmail", email, offline, variant));
  const members = membersOf(p, deps).map((m) => m.name);
  return withLog(next, "agent", variant === 0 ? `Drafted the confirmation email to ${joinNames(members)}.` : "Rewrote the board email.", deps.now());
}

export function sendToBoard(p: Portco, deps: Deps): Portco {
  const at = deps.now();
  let next = withDraft(p, "boardEmail", { ...p.drafts.boardEmail, approved: true });
  next = waiting(next, "board", at);
  next = withSent(next, "boardEmail", joinNames(membersOf(p, deps).map((m) => m.name)), at);
  return withLog(next, "ea", "Sent the confirmation email to the board.", at);
}

export function boardConfirmAll(p: Portco, deps: Deps): Portco {
  const members = membersOf(p, deps);
  const resend = p.targetQuarters.some((q) => p.drafts[`conflict:${q}`]?.approved);
  let next = mapQuarters(p, (_q, qs) => {
    const responses = { ...qs.boardResponses };
    for (const m of members) if (responses[m.id] !== "declined") responses[m.id] = "confirmed";
    return { ...qs, boardResponses: responses };
  });
  for (const m of members) {
    const at = deps.now();
    const mail = mockBoardReply(m.name, p.name, resend);
    const id = replyId(next, "board");
    next = withReply(next, { id, kind: "board", from: { name: m.name, personId: m.id }, to: "You", at, subject: mail.subject, body: mail.body });
    next = withLog(next, "board", resend ? `${m.name} confirmed the new date.` : `${m.name} confirmed every quarter.`, at, m.id, id);
  }
  return waiting(next, "none", deps.now());
}

export function boardConfirmSome(p: Portco, memberIds: string[], deps: Deps): Portco {
  let next = mapQuarters(p, (_q, qs) => {
    const responses = { ...qs.boardResponses };
    for (const id of memberIds) if (responses[id] === "pending") responses[id] = "confirmed";
    return { ...qs, boardResponses: responses };
  });
  for (const id of memberIds) {
    const at = deps.now();
    const mail = mockBoardReply(deps.name(id), p.name);
    const rid = replyId(next, "board");
    next = withReply(next, { id: rid, kind: "board", from: { name: deps.name(id), personId: id }, to: "You", at, subject: mail.subject, body: mail.body });
    next = withLog(next, "board", `${deps.name(id)} confirmed every quarter.`, at, id, rid);
  }
  return next;
}

// One member declines one quarter; everyone else confirms everything.
// Returns the fallback and re-verify so the caller can ask for the wording.
export function boardConflict(
  p: Portco,
  memberId: string,
  q: Quarter,
  deps: Deps,
): { portco: Portco; declined: Window | undefined; fallback: Window | null; reverify: { ok: boolean; busy: string[] } } {
  const members = membersOf(p, deps);
  let next = mapQuarters(p, (qq, qs) => {
    const responses = { ...qs.boardResponses };
    for (const m of members) responses[m.id] = qq === q && m.id === memberId ? "declined" : "confirmed";
    return { ...qs, boardResponses: responses };
  });
  const declined = pickedWindow(next, q);
  if (!declined) return { portco: next, declined, fallback: null, reverify: { ok: false, busy: [] } };
  for (const m of members) {
    const at = deps.now();
    const mail = m.id === memberId ? mockDeclineReply(m.name, p.name, quarterLabel(q, p.targetQuarters), fmtDate(declined.start)) : mockBoardReply(m.name, p.name);
    const id = replyId(next, "board");
    next = withReply(next, { id, kind: "board", from: { name: m.name, personId: m.id }, to: "You", at, subject: mail.subject, body: mail.body, quarter: m.id === memberId ? q : undefined });
    next =
      m.id === memberId
        ? withLog(next, "board", `${m.name} confirmed every quarter except ${quarterLabel(q, p.targetQuarters)}. Cannot make ${fmtWindow(declined)}.`, at, m.id, id)
        : withLog(next, "board", `${m.name} confirmed every quarter.`, at, m.id, id);
  }
  next = waiting(next, "none", deps.now());
  const fallback = nextBestWindow(next.quarters[q].shortlist, declined.id);
  const reverify = fallback ? reverifyWindow(fallback, activePartners(p), ensureAvailability(deps.availability, activePartners(p), yearsOf(p.targetQuarters))) : { ok: false, busy: [] as string[] };
  return { portco: next, declined, fallback, reverify };
}

export function applyConflict(
  p: Portco,
  q: Quarter,
  memberId: string,
  declined: Window,
  fallback: Window | null,
  reverify: { ok: boolean; busy: string[] },
  result: ConflictResult,
  offline: boolean,
  deps: Deps,
): Portco {
  const data: ConflictData = {
    quarter: q,
    memberId,
    declinedWindowId: declined.id,
    fallbackWindowId: fallback?.id ?? null,
    reverify,
    note: result.note,
    resend: emailToText(result.resend),
  };
  let next = withDraft(p, `conflict:${q}`, emailDraft(p, "conflict", result.resend, offline, 0, { quarter: q, data }));
  next = withLog(
    next,
    "agent",
    fallback
      ? `Went back to the approved shortlist and proposed the number ${fallback.rank} ${quarterLabel(q, p.targetQuarters)} window, ${fmtWindow(fallback)}. Re-checked ${joinNames(activePartners(p).map(deps.name))}: ` +
          (reverify.ok ? "all still free." : `${joinNames(reverify.busy.map(deps.name))} now busy.`)
      : `No other window on the ${quarterLabel(q, p.targetQuarters)} shortlist. Widen the search before re-sending.`,
    deps.now(),
  );
  return next;
}

export function approveResend(p: Portco, q: Quarter, deps: Deps): Portco {
  const key = `conflict:${q}`;
  const draft = p.drafts[key];
  const data = draft?.data as ConflictData | undefined;
  if (!draft || !data?.fallbackWindowId) return p;
  const members = membersOf(p, deps);
  const responses: Record<string, "pending"> = {};
  for (const m of members) responses[m.id] = "pending";
  const at = deps.now();
  const qs = p.quarters[q];
  let next: Portco = {
    ...p,
    quarters: { ...p.quarters, [q]: { ...qs, portcoPick: data.fallbackWindowId, boardResponses: responses } },
    drafts: { ...p.drafts, [key]: { ...draft, approved: true } },
  };
  next = waiting(next, "board", at);
  next = withSent(next, key, joinNames(members.map((m) => m.name)), at);
  const w = qs.shortlist.find((x) => x.id === data.fallbackWindowId);
  return withLog(next, "ea", `Re-sent to the board. ${quarterLabel(q, p.targetQuarters)} now proposed for ${w ? fmtWindow(w) : "the next window"}.`, at);
}

// EA locks the confirmed dates. Stage 5 begins; venues are picked next.
export function lockAndBook(p: Portco, deps: Deps): Portco {
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, status: "boardConfirmed" }));
  const dates = p.targetQuarters.map((q) => {
    const w = pickedWindow(p, q);
    return `${quarterLabel(q, p.targetQuarters)} ${w ? fmtDate(w.start) : "?"}`;
  });
  return withLog(next, "ea", `Board confirmed. Dates held: ${dates.join(", ")}.`, deps.now());
}

function venueOf(deps: Deps, id: string): Venue | undefined {
  return deps.venues.find((v) => v.id === id) ?? getVenue(id);
}

// ---------- stage 5: lock and book ----------

// Only venue ids from the list, in this city. Anything else is dropped.
export function applyLogistics(p: Portco, result: LogisticsResult, offline: boolean, variant: number, deps: Deps): Portco {
  const picks: LogisticsData = {};
  for (const q of p.targetQuarters) {
    const pick = result.picks?.[q];
    if (!pick) continue;
    const hotel = venueOf(deps, pick.hotelId);
    const restaurant = venueOf(deps, pick.restaurantId);
    if (!hotel || !restaurant || hotel.city !== p.city || restaurant.city !== p.city) continue;
    picks[q] = pick;
  }
  const next = withDraft(p, "logistics", draftOf(p, "logistics", "", offline, variant, { data: picks }));
  return withLog(
    next,
    "agent",
    variant === 0 ? `Picked a hotel and a restaurant near ${p.officeAddress} for each meeting.` : "Re-picked venues.",
    deps.now(),
  );
}

export function setLogisticsPick(p: Portco, q: Quarter, patch: Partial<LogisticsPick>): Portco {
  const draft = p.drafts.logistics;
  if (!draft) return p;
  const data = { ...(draft.data as LogisticsData) };
  data[q] = { ...(data[q] as LogisticsPick), ...patch };
  return withDraft(p, "logistics", { ...draft, data });
}

export function approveAndLock(p: Portco, deps: Deps): Portco {
  const data = (p.drafts.logistics?.data ?? {}) as LogisticsData;
  let next = mapQuarters(p, (q, qs) => {
    const pick = data[q];
    const hotel = pick && venueOf(deps, pick.hotelId);
    const restaurant = pick && venueOf(deps, pick.restaurantId);
    if (!hotel || !restaurant) return qs;
    return { ...qs, status: "locked", logistics: { hotel, restaurant, reason: pick.reason } };
  });
  next = withDraft(next, "logistics", { ...next.drafts.logistics, approved: true });
  next = withLog(next, "ea", "Locked all four meetings with hotel and dinner.", deps.now());
  // Stage 6 begins: the invites are drafted by code from the locked dates.
  const invites = buildInvites(next, deps);
  next = withDraft(next, "invites", draftOf(next, "invites", invites.map((i) => `${i.title}: ${fmtWindow({ start: i.start, end: i.end } as Window)}`).join("\n"), false, 0, { data: invites }));
  return withLog(next, "agent", `Drafted ${countWord(p.targetQuarters.length, "calendar invite")}, one per meeting, for ${attendeeIds(next, membersOf(next, deps)).length} people each.`, deps.now());
}

// ---------- stage 6: send invites ----------

export function buildInvites(p: Portco, deps: Deps): Invite[] {
  const members = membersOf(p, deps);
  const ids = attendeeIds(p, members);
  const out: Invite[] = [];
  for (const q of p.targetQuarters) {
    const qs = p.quarters[q];
    const w = pickedWindow(p, q);
    if (!w) continue;
    const dinner = qs.logistics?.restaurant.name ?? "dinner to follow";
    out.push({
      quarter: q,
      title: `${p.name} quarterly meeting, ${quarterLong(q)}`,
      start: w.start,
      end: w.end,
      location: p.officeAddress,
      dinner: { venue: dinner, start: w.dinnerStart },
      attendeeIds: ids,
      body: `Quarterly meeting between ${p.name} and Greenbriar at the ${p.city.split(",")[0]} office. Dinner follows at ${dinner}.`,
    });
  }
  return out;
}

export function sendInvites(p: Portco, deps: Deps): Portco {
  const at = deps.now();
  const members = membersOf(p, deps);
  const ids = attendeeIds(p, members);
  let next = withDraft(p, "invites", { ...p.drafts.invites, approved: true });
  next = mapQuarters(next, (_q, qs) => ({ ...qs, status: "invited" }));
  const attendance: Portco["attendance"] = {};
  for (const q of next.targetQuarters) {
    const row: Record<string, AttendanceStatus> = {};
    for (const id of ids) row[id] = "noReply";
    attendance[q] = row;
  }
  const travel: Record<string, TravelStatus> = {};
  for (const id of activePartners(next)) travel[id] = "pending";
  next = { ...next, attendance, travel };
  next = waiting(next, "attendees", at);
  next = withSent(next, "invites", `${ids.length} people`, at);
  return withLog(next, "ea", `Sent ${countWord(next.targetQuarters.length, "calendar invite")} to ${ids.length} people. Travel requests opened for ${joinNames(activePartners(next).map(deps.name))}.`, at);
}

// ---------- after sending: attendance ----------

// Simulated replies to the invites. "mixed": everyone accepts except the
// second board member, tentative for Q2, and the last partner, no reply for
// Q4; travel booked for every partner but the last. "all": the stragglers
// come in, every invite accepted, all travel booked. That is done.
export function simulateInvites(p: Portco, deps: Deps, mode: "mixed" | "all" = "mixed"): Portco {
  const members = membersOf(p, deps);
  const partners = activePartners(p);
  const ids = attendeeIds(p, members);
  const tentativeId = mode === "mixed" ? members[1]?.id : undefined;
  const quietId = mode === "mixed" && partners.length > 1 ? partners[partners.length - 1] : undefined;
  const qs = p.targetQuarters;
  const tentativeQ = qs[Math.min(1, qs.length - 1)];
  const quietQ = qs[qs.length - 1];
  const attendance: Portco["attendance"] = {};
  for (const q of qs) {
    const row: Record<string, AttendanceStatus> = {};
    for (const id of ids) {
      row[id] = q === tentativeQ && id === tentativeId ? "tentative" : q === quietQ && id === quietId && quietQ !== tentativeQ ? "noReply" : "accepted";
    }
    attendance[q] = row;
  }
  const travel: Record<string, TravelStatus> = {};
  partners.forEach((id) => {
    travel[id] = id === quietId ? "pending" : "booked";
  });
  let next: Portco = { ...p, attendance, travel };
  const accepted = Object.values(attendance).reduce((n, row) => n + Object.values(row ?? {}).filter((v) => v === "accepted").length, 0);
  const total = ids.length * p.targetQuarters.length;
  if (mode === "mixed") {
    next = withLog(next, "board", `Invites accepted, ${accepted} of ${total}.` + (tentativeId ? ` ${deps.name(tentativeId)} is tentative for ${quarterLabel(tentativeQ, qs)}.` : "") + (quietId && quietQ !== tentativeQ ? ` ${deps.name(quietId)} has not replied for ${quarterLabel(quietQ, qs)}.` : ""), deps.now());
    const booked = partners.filter((id) => travel[id] === "booked");
    next = withLog(next, "agent", `Travel booked for ${joinNames(booked.map(deps.name))}.` + (quietId ? ` ${deps.name(quietId)} still pending.` : ""), deps.now());
  } else {
    next = withLog(next, "board", `Every invite accepted, ${total} of ${total}. Travel booked for all partners.`, deps.now());
    next = waiting(next, "none", deps.now());
  }
  return next;
}

// ---------- drafts ----------

export function editDraft(p: Portco, key: string, text: string, deps: Deps): Portco {
  const d = p.drafts[key];
  if (!d) return p;
  return withLog(withDraft(p, key, { ...d, text, email: undefined }), "ea", `Edited the ${draftLabel(key)}.`, deps.now());
}

export function draftLabel(key: string): string {
  if (key === "onepager") return "one-pager";
  if (key === "partnerEmail") return "partner email";
  if (key === "portcoEmail") return "proposal email";
  if (key === "boardEmail") return "board email";
  if (key.startsWith("conflict")) return "re-send note";
  if (key === "logistics") return "venue picks";
  return "draft";
}
