// Pure state transitions for one portco. No store, no agent, no I/O.
// lib/actions.ts wires these to the store and the agent in the browser.
// scripts/gen-states.ts composes them with mock outputs to build the saved
// demo states, so the snapshots can never drift from what the app does.

import { findWindows, fmtDate, fmtWindow, nextBestWindow, rankWindows, reverifyWindow } from "./scheduling";
import type {
  AvailabilityBlock,
  BoardMember,
  ConflictData,
  Draft,
  DraftKind,
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
  boardMembers: BoardMember[]; // all, or just this portco's
  availability: AvailabilityBlock[];
  venues: Venue[];
  name: (id: string) => string;
  now: () => string; // ISO timestamp
};

export type ShortlistResult = { reasons: Record<string, string[]>; onepager: string };
export type ConflictResult = { note: string; resend: string };
export type LogisticsResult = { picks: Record<string, LogisticsPick> };

// ---------- helpers ----------

export function withLog(p: Portco, actor: LogActor, text: string, at: string): Portco {
  return { ...p, log: [...p.log, { at, actor, text }] };
}

export function mapQuarters(p: Portco, fn: (q: Quarter, qs: QuarterState) => QuarterState): Portco {
  const quarters = { ...p.quarters };
  for (const q of p.targetQuarters) quarters[q] = fn(q, quarters[q]);
  return { ...p, quarters };
}

export function withDraft(p: Portco, key: string, draft: Draft): Portco {
  return { ...p, drafts: { ...p.drafts, [key]: draft } };
}

function draftOf(p: Portco, key: string, kind: DraftKind, text: string, offline: boolean, variant: number, extra: Partial<Draft> = {}): Draft {
  return { kind, portcoId: p.id, text, approved: false, offline, variant, ...extra };
}

export function membersOf(p: Portco, deps: Deps): BoardMember[] {
  return deps.boardMembers.filter((b) => b.portcoId === p.id);
}

export function pickedWindow(p: Portco, q: Quarter): Window | undefined {
  const qs = p.quarters[q];
  return qs.shortlist.find((w) => w.id === qs.portcoPick);
}

// ---------- stage 0 -> 1 ----------

export function pullAvailability(p: Portco, deps: Deps): Portco {
  const res = findWindows({ portco: p, partners: deps.partners, boardMembers: deps.boardMembers, availability: deps.availability });
  const next = mapQuarters(p, (q, qs) => ({ ...qs, status: "availability", windows: res[q].windows, thin: res[q].thin }));
  const parts = p.targetQuarters.map((q) => `${q}: ${res[q].windows.length}`);
  const thin = p.targetQuarters.filter((q) => res[q].thin);
  return withLog(
    next,
    "agent",
    `Pulled availability from ${p.partnerIds.map(deps.name).join(", ")}. Windows found, ${parts.join(", ")}.` +
      (thin.length ? ` ${thin.join(", ")} ${thin.length === 1 ? "is" : "are"} thin.` : ""),
    deps.now(),
  );
}

// ---------- stage 1 -> 2 ----------

export function buildShortlist(p: Portco): Portco {
  return mapQuarters(p, (_q, qs) => ({ ...qs, status: "shortlist", shortlist: rankWindows(qs.windows) }));
}

export function applyShortlist(p: Portco, result: ShortlistResult, offline: boolean, variant: number, deps: Deps): Portco {
  const next = mapQuarters(p, (q, qs) => ({
    ...qs,
    shortlist: qs.shortlist.map((w, i) => ({ ...w, reason: result.reasons?.[q]?.[i] ?? w.reason })),
  }));
  const draft = draftOf(next, "onepager", "onepager", result.onepager, offline, variant);
  return withLog(
    withDraft(next, "onepager", draft),
    "agent",
    variant === 0 ? "Ranked the top three windows per quarter and drafted the one-pager." : "Rewrote the one-pager.",
    deps.now(),
  );
}

export function approveOnepager(p: Portco, deps: Deps): Portco {
  const approvals: Record<string, boolean> = {};
  for (const pid of p.partnerIds) approvals[pid] = false;
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, status: "internal", internalApprovals: { ...approvals } }));
  return withLog(
    withDraft(next, "onepager", { ...next.drafts.onepager, approved: true }),
    "ea",
    "Approved the one-pager and sent it to the partners for internal sign-off.",
    deps.now(),
  );
}

// ---------- stage 3 ----------

export function markInternalApproval(p: Portco, partnerId: string, deps: Deps): Portco {
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, internalApprovals: { ...qs.internalApprovals, [partnerId]: true } }));
  return withLog(next, "ea", `Recorded ${deps.name(partnerId)}'s sign-off.`, deps.now());
}

export function approveAllInternal(p: Portco, deps: Deps): Portco {
  const all: Record<string, boolean> = {};
  for (const pid of p.partnerIds) all[pid] = true;
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, internalApprovals: { ...all } }));
  return withLog(next, "ea", `All partners signed off: ${p.partnerIds.map(deps.name).join(", ")}.`, deps.now());
}

export function allInternalApproved(p: Portco): boolean {
  return p.targetQuarters.every((q) => p.partnerIds.every((pid) => p.quarters[q].internalApprovals[pid]));
}

// ---------- stage 3 -> 4 ----------

export function sendToPortco(p: Portco): Portco {
  return mapQuarters(p, (_q, qs) => ({ ...qs, status: "portco" }));
}

export function applyPortcoEmail(p: Portco, text: string, offline: boolean, variant: number, deps: Deps): Portco {
  const next = withDraft(p, "portcoEmail", draftOf(p, "portcoEmail", "portcoEmail", text, offline, variant));
  return withLog(next, "agent", variant === 0 ? `Drafted the proposal email to ${p.execContact.name}.` : "Rewrote the proposal email.", deps.now());
}

export function approvePortcoEmail(p: Portco, deps: Deps): Portco {
  const next = withDraft(p, "portcoEmail", { ...p.drafts.portcoEmail, approved: true });
  return withLog(next, "ea", `Sent the proposal and one-pager to ${p.execContact.name}.`, deps.now());
}

export function recordPortcoPicks(p: Portco, picks: Partial<Record<Quarter, Window>>, deps: Deps): Portco {
  const next = mapQuarters(p, (q, qs) => ({ ...qs, portcoPick: picks[q]?.id ?? qs.portcoPick }));
  const lines = p.targetQuarters.map((q) => `${q} ${picks[q] ? fmtWindow(picks[q] as Window) : "no pick"}`);
  return withLog(next, "portco", `${p.execContact.name} replied with picks: ${lines.join("; ")}.`, deps.now());
}

export function allPicked(p: Portco): boolean {
  return p.targetQuarters.every((q) => !!p.quarters[q].portcoPick);
}

// ---------- stage 4 -> 5 ----------

export function sendToBoard(p: Portco, deps: Deps): Portco {
  const members = membersOf(p, deps);
  return mapQuarters(p, (_q, qs) => {
    const responses: Record<string, "pending"> = {};
    for (const m of members) responses[m.id] = "pending";
    return { ...qs, status: "board", boardResponses: responses };
  });
}

export function applyBoardEmail(p: Portco, text: string, offline: boolean, variant: number, deps: Deps): Portco {
  const next = withDraft(p, "boardEmail", draftOf(p, "boardEmail", "boardEmail", text, offline, variant));
  const members = membersOf(p, deps).map((m) => m.name);
  return withLog(
    next,
    "agent",
    variant === 0 ? `Drafted the confirmation email to the board: ${members.join(", ")}.` : "Rewrote the board email.",
    deps.now(),
  );
}

export function approveBoardEmail(p: Portco, deps: Deps): Portco {
  const next = withDraft(p, "boardEmail", { ...p.drafts.boardEmail, approved: true });
  return withLog(next, "ea", "Sent the confirmation email to the board.", deps.now());
}

export function boardConfirmAll(p: Portco, deps: Deps): Portco {
  const members = membersOf(p, deps);
  const next = mapQuarters(p, (_q, qs) => {
    const responses = { ...qs.boardResponses };
    for (const m of members) if (responses[m.id] !== "declined") responses[m.id] = "confirmed";
    return { ...qs, boardResponses: responses };
  });
  return withLog(next, "board", `${members.map((m) => m.name).join(", ")} confirmed every quarter.`, deps.now());
}

export function boardConfirmSome(p: Portco, memberIds: string[], deps: Deps): Portco {
  const next = mapQuarters(p, (_q, qs) => {
    const responses = { ...qs.boardResponses };
    for (const id of memberIds) if (responses[id] === "pending") responses[id] = "confirmed";
    return { ...qs, boardResponses: responses };
  });
  return withLog(next, "board", `${memberIds.map(deps.name).join(", ")} confirmed every quarter.`, deps.now());
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
  next = withLog(next, "board", `${deps.name(memberId)} declined ${q}, ${fmtWindow(declined)}. Everyone else confirmed all four quarters.`, deps.now());
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
    resend: result.resend,
  };
  let next = withDraft(p, `conflict:${q}`, draftOf(p, `conflict:${q}`, "conflict", result.resend, offline, 0, { quarter: q, data }));
  next = withLog(
    next,
    "agent",
    fallback
      ? `Proposed the rank ${fallback.rank} window from the approved shortlist, ${fmtWindow(fallback)}, and re-checked partner calendars: ` +
          (reverify.ok ? "all partners still free." : `${reverify.busy.map(deps.name).join(", ")} now busy.`)
      : `No other window on the ${q} shortlist. Widen the search before re-sending.`,
    deps.now(),
  );
  return next;
}

export function approveConflictResend(p: Portco, q: Quarter, deps: Deps): Portco {
  const key = `conflict:${q}`;
  const draft = p.drafts[key];
  const data = draft?.data as ConflictData | undefined;
  if (!draft || !data?.fallbackWindowId) return p;
  const members = membersOf(p, deps);
  const responses: Record<string, "pending"> = {};
  for (const m of members) responses[m.id] = "pending";
  const qs = p.quarters[q];
  let next: Portco = {
    ...p,
    quarters: { ...p.quarters, [q]: { ...qs, portcoPick: data.fallbackWindowId, boardResponses: responses } },
    drafts: { ...p.drafts, [key]: { ...draft, approved: true } },
  };
  const w = qs.shortlist.find((x) => x.id === data.fallbackWindowId);
  next = withLog(next, "ea", `Approved the re-send. ${q} now proposed for ${w ? fmtWindow(w) : "the next window"}. Board asked to confirm again.`, deps.now());
  return next;
}

export function allBoardConfirmed(p: Portco, deps: Deps): boolean {
  const members = membersOf(p, deps);
  return p.targetQuarters.every((q) => members.every((m) => p.quarters[q].boardResponses[m.id] === "confirmed"));
}

export function openConflicts(p: Portco): Quarter[] {
  return p.targetQuarters.filter((q) => {
    const d = p.drafts[`conflict:${q}`];
    return d && !d.approved;
  });
}

// ---------- stage 5 -> 6 ----------

export function lockDates(p: Portco, deps: Deps): Portco {
  const next = mapQuarters(p, (_q, qs) => ({ ...qs, status: "locked" }));
  const dates = p.targetQuarters.map((q) => {
    const w = pickedWindow(p, q);
    return `${q} ${w ? fmtDate(w.start) : "?"}`;
  });
  return withLog(next, "ea", `Locked the dates: ${dates.join(", ")}.`, deps.now());
}

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
  const next = withDraft(p, "logistics", draftOf(p, "logistics", "logistics", "", offline, variant, { data: picks }));
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

export function approveLogistics(p: Portco, deps: Deps): Portco {
  const data = (p.drafts.logistics?.data ?? {}) as LogisticsData;
  let next = mapQuarters(p, (q, qs) => {
    const pick = data[q];
    const hotel = pick && deps.venues.find((v) => v.id === pick.hotelId);
    const restaurant = pick && deps.venues.find((v) => v.id === pick.restaurantId);
    if (!hotel || !restaurant) return qs;
    return { ...qs, logistics: { hotel, restaurant, reason: pick.reason } };
  });
  next = withDraft(next, "logistics", { ...next.drafts.logistics, approved: true });
  return withLog(next, "ea", "Approved logistics. All four quarters locked. Calendar invites go out from Outlook.", deps.now());
}

// ---------- drafts ----------

export function editDraft(p: Portco, key: string, text: string, deps: Deps): Portco {
  const d = p.drafts[key];
  if (!d) return p;
  return withLog(withDraft(p, key, { ...d, text }), "ea", `Edited the ${draftLabel(key)}.`, deps.now());
}

export function draftLabel(key: string): string {
  if (key === "onepager") return "one-pager";
  if (key === "portcoEmail") return "proposal email";
  if (key === "boardEmail") return "board email";
  if (key.startsWith("conflict")) return "re-send note";
  if (key === "logistics") return "logistics plan";
  return "draft";
}
