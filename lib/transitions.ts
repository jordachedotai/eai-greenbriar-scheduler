// Pure state transitions for one portco, v2 five stages. No store, no
// agent, no I/O. lib/actions.ts wires these to the store and the agent in
// the browser. scripts/gen-states.ts composes them with mock outputs to build
// the saved demo states, so snapshots can never drift from the app.

import { findWindows, fmtDate, fmtWindow, nextBestWindow, rankWindows, reverifyWindow } from "./scheduling";
import { emailToText } from "./email";
import type {
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
  QuarterState,
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

export function withLog(p: Portco, actor: LogActor, text: string, at: string, personId?: string): Portco {
  return { ...p, log: [...p.log, personId ? { at, actor, text, personId } : { at, actor, text }] };
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
  return deps.boardMembers.filter((b) => b.portcoId === p.id);
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

// ---------- stage 1: find dates ----------

export function findDates(p: Portco, deps: Deps, excludeDays: Set<string> = new Set()): Portco {
  const res = findWindows({ portco: p, partners: deps.partners, boardMembers: deps.boardMembers, availability: deps.availability, excludeDays });
  const next = mapQuarters(p, (q, qs) => ({
    ...qs,
    windows: res[q].windows,
    thin: res[q].thin,
    shortlist: rankWindows(res[q].windows),
  }));
  const parts = p.targetQuarters.map((q) => `${q}: ${res[q].windows.length}`);
  const thin = p.targetQuarters.filter((q) => res[q].thin);
  return withLog(
    next,
    "agent",
    `Checked calendars for ${joinNames(p.partnerIds.map(deps.name))} and ranked the top three windows per quarter. Windows found, ${parts.join(", ")}.` +
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
  return withLog(next, "ea", `Sent the one-pager to ${joinNames(p.partnerIds.map(deps.name))} for sign-off.`, at);
}

export function partnerReplies(p: Portco, partnerIds: string[], deps: Deps): Portco {
  let next = p;
  for (const pid of partnerIds) {
    next = mapQuarters(next, (_q, qs) => ({ ...qs, internalApprovals: { ...qs.internalApprovals, [pid]: true } }));
    next = withLog(next, "partner", `${deps.name(pid)} replied yes.`, deps.now(), pid);
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
  const next = withDraft(p, "portcoEmail", emailDraft(p, "portcoEmail", email, offline, variant));
  return withLog(next, "agent", variant === 0 ? `Drafted the proposal email to ${p.execContact.name}.` : "Rewrote the proposal email.", deps.now());
}

export function sendToPortco(p: Portco, deps: Deps): Portco {
  const at = deps.now();
  let next = withDraft(p, "portcoEmail", { ...p.drafts.portcoEmail, approved: true });
  next = waiting(next, "portco", at);
  return withLog(next, "ea", `Sent the proposal and one-pager to ${p.execContact.name}.`, at);
}

export function recordPortcoPicks(p: Portco, picks: Partial<Record<Quarter, Window>>, deps: Deps): Portco {
  let next = mapQuarters(p, (q, qs) => ({ ...qs, portcoPick: picks[q]?.id ?? qs.portcoPick }));
  const lines = p.targetQuarters.map((q) => `${q} ${picks[q] ? fmtWindow(picks[q] as Window) : "no pick"}`);
  next = withLog(next, "portco", `${p.execContact.name} picked: ${lines.join("; ")}.`, deps.now());
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
  return withLog(next, "ea", "Sent the confirmation email to the board.", at);
}

export function boardConfirmAll(p: Portco, deps: Deps): Portco {
  const members = membersOf(p, deps);
  let next = mapQuarters(p, (_q, qs) => {
    const responses = { ...qs.boardResponses };
    for (const m of members) if (responses[m.id] !== "declined") responses[m.id] = "confirmed";
    return { ...qs, boardResponses: responses };
  });
  for (const m of members) next = withLog(next, "board", `${m.name} confirmed every quarter.`, deps.now(), m.id);
  return waiting(next, "none", deps.now());
}

export function boardConfirmSome(p: Portco, memberIds: string[], deps: Deps): Portco {
  let next = mapQuarters(p, (_q, qs) => {
    const responses = { ...qs.boardResponses };
    for (const id of memberIds) if (responses[id] === "pending") responses[id] = "confirmed";
    return { ...qs, boardResponses: responses };
  });
  for (const id of memberIds) next = withLog(next, "board", `${deps.name(id)} confirmed every quarter.`, deps.now(), id);
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
    next =
      m.id === memberId
        ? withLog(next, "board", `${m.name} confirmed every quarter except ${q}. Cannot make ${fmtWindow(declined)}.`, deps.now(), m.id)
        : withLog(next, "board", `${m.name} confirmed every quarter.`, deps.now(), m.id);
  }
  next = waiting(next, "none", deps.now());
  const fallback = nextBestWindow(next.quarters[q].shortlist, declined.id);
  const reverify = fallback ? reverifyWindow(fallback, p.partnerIds, deps.availability) : { ok: false, busy: [] as string[] };
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
      ? `Went back to the approved shortlist and proposed the number ${fallback.rank} ${q} window, ${fmtWindow(fallback)}. Re-checked ${joinNames(p.partnerIds.map(deps.name))}: ` +
          (reverify.ok ? "all still free." : `${joinNames(reverify.busy.map(deps.name))} now busy.`)
      : `No other window on the ${q} shortlist. Widen the search before re-sending.`,
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
  const w = qs.shortlist.find((x) => x.id === data.fallbackWindowId);
  return withLog(next, "ea", `Re-sent to the board. ${q} now proposed for ${w ? fmtWindow(w) : "the next window"}.`, at);
}

// EA locks the confirmed dates. Stage 5 begins; venues are picked next.
export function lockAndBook(p: Portco, deps: Deps): Portco {
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, status: "boardConfirmed" }));
  const dates = p.targetQuarters.map((q) => {
    const w = pickedWindow(p, q);
    return `${q} ${w ? fmtDate(w.start) : "?"}`;
  });
  return withLog(next, "ea", `Board confirmed. Dates held: ${dates.join(", ")}.`, deps.now());
}

// ---------- stage 5: lock and book ----------

// Only venue ids from the list, in this city. Anything else is dropped.
export function applyLogistics(p: Portco, result: LogisticsResult, offline: boolean, variant: number, deps: Deps): Portco {
  const picks: LogisticsData = {};
  for (const q of p.targetQuarters) {
    const pick = result.picks?.[q];
    if (!pick) continue;
    const hotel = deps.venues.find((v) => v.id === pick.hotelId);
    const restaurant = deps.venues.find((v) => v.id === pick.restaurantId);
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
    const hotel = pick && deps.venues.find((v) => v.id === pick.hotelId);
    const restaurant = pick && deps.venues.find((v) => v.id === pick.restaurantId);
    if (!hotel || !restaurant) return qs;
    return { ...qs, status: "locked", logistics: { hotel, restaurant, reason: pick.reason } };
  });
  next = withDraft(next, "logistics", { ...next.drafts.logistics, approved: true });
  return withLog(next, "ea", "Locked all four meetings with hotel and dinner. Calendar invites go out from Outlook.", deps.now());
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
