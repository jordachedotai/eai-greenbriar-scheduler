// Derived views of pipeline state. Pure functions over Portco records.
// Stage comes from the least-advanced quarter. Phase says what the EA sees
// inside that stage and which primary button the action bar shows.

import type { AttendanceStatus, BoardMember, EA, Portco, Quarter, Stage, WaitingOn } from "./types";
import { STATUS_STAGE } from "./types";
import { getBoardMembers } from "./data";

// A company's board: its own list when added in Settings, else the fixture.
export function boardMembersOf(p: Portco): BoardMember[] {
  return p.boardMembers ?? getBoardMembers(p.id);
}

// Everyone invited to a locked meeting: checked partners, the company
// contact ("exec"), and the board.
export function attendeeIds(p: Portco, members: BoardMember[]): string[] {
  return [...activePartners(p), "exec", ...members.map((m) => m.id)];
}

export type InviteCounts = { accepted: number; tentative: number; noReply: number; total: number; replied: boolean };

export function inviteCounts(p: Portco, members: BoardMember[]): InviteCounts {
  const c: InviteCounts = { accepted: 0, tentative: 0, noReply: 0, total: 0, replied: false };
  const ids = attendeeIds(p, members);
  for (const q of p.targetQuarters) {
    const a = p.attendance?.[q];
    for (const id of ids) {
      const st: AttendanceStatus = a?.[id] ?? "noReply";
      c[st]++;
      c.total++;
      if (st !== "noReply") c.replied = true;
    }
  }
  return c;
}

export function travelBookedCount(p: Portco): { booked: number; total: number } {
  const ids = activePartners(p);
  return { booked: ids.filter((id) => p.travel?.[id] === "booked").length, total: ids.length };
}

// The partners whose calendars are checked. Sign-off still goes to everyone assigned.
export function activePartners(p: Portco): string[] {
  const checked = p.checkedPartnerIds?.filter((id) => p.partnerIds.includes(id));
  return checked && checked.length ? checked : p.partnerIds;
}

export function portcoStage(p: Portco): Stage {
  let min: Stage = 6;
  for (const q of p.targetQuarters) {
    const s = STATUS_STAGE[p.quarters[q].status];
    if (s < min) min = s;
  }
  return min;
}

export type Phase =
  | "idle" // stage 1, nothing found yet
  | "needsDraft" // in the stage, but the draft is missing (agent has not run)
  | "review" // a draft is waiting for the EA
  | "waiting" // sent, waiting on someone else
  | "conflict" // stage 4, a re-send draft is waiting for the EA
  | "ready" // replies are in, the EA moves to the next stage
  | "done"; // everything locked

export const STAGE_DRAFT: Record<Stage, string> = {
  1: "onepager",
  2: "partnerEmail",
  3: "portcoEmail",
  4: "boardEmail",
  5: "logistics",
  6: "invites",
};

// Dates and venues locked (stage 5 approved).
export function isLocked(p: Portco, q: Quarter): boolean {
  const s = p.quarters[q].status;
  return (s === "locked" || s === "invited") && !!p.quarters[q].logistics;
}

export function allLocked(p: Portco): boolean {
  return p.targetQuarters.every((q) => isLocked(p, q));
}

export function invitesOut(p: Portco): boolean {
  return p.targetQuarters.every((q) => p.quarters[q].status === "invited");
}

// Done means every invite for every meeting is accepted.
export function allAccepted(p: Portco, members: BoardMember[]): boolean {
  if (!invitesOut(p)) return false;
  const ids = attendeeIds(p, members);
  return p.targetQuarters.every((q) => ids.every((id) => p.attendance?.[q]?.[id] === "accepted"));
}

export function allPartnersYes(p: Portco): boolean {
  return p.targetQuarters.every((q) => p.partnerIds.every((pid) => p.quarters[q].internalApprovals[pid]));
}

export function allPicked(p: Portco): boolean {
  return p.targetQuarters.every((q) => !!p.quarters[q].portcoPick);
}

export function boardConfirmedQuarter(p: Portco, q: Quarter, members: BoardMember[]): boolean {
  const qs = p.quarters[q];
  if (qs.status === "boardConfirmed" || qs.status === "locked" || qs.status === "invited") return true;
  return members.length > 0 && members.every((m) => qs.boardResponses[m.id] === "confirmed");
}

export function allBoardConfirmed(p: Portco, members: BoardMember[]): boolean {
  return p.targetQuarters.every((q) => boardConfirmedQuarter(p, q, members));
}

export function openConflicts(p: Portco): Quarter[] {
  return p.targetQuarters.filter((q) => {
    const d = p.drafts[`conflict:${q}`];
    return d && !d.approved;
  });
}

export function portcoPhase(p: Portco, members: BoardMember[]): Phase {
  const stage = portcoStage(p);
  if (stage === 6) {
    if (allAccepted(p, members)) return "done";
    const inv = p.drafts.invites;
    if (!inv) return "needsDraft";
    return inv.approved ? "waiting" : "review";
  }
  const draft = p.drafts[STAGE_DRAFT[stage]];
  if (stage === 1) {
    const found = p.targetQuarters.some((q) => p.quarters[q].windows.length > 0);
    if (!found) return "idle";
    return draft ? "review" : "needsDraft";
  }
  if (!draft) return "needsDraft";
  if (!draft.approved) return "review";
  if (stage === 4 && openConflicts(p).length > 0) return "conflict";
  if (stage === 5) return "review";
  if (p.waitingOn !== "none") return "waiting";
  return "ready";
}

// The one primary button. Label says exactly what happens on click.
export type PrimaryAction = { label: string; enabled: boolean };

export function primaryAction(p: Portco, members: BoardMember[]): PrimaryAction | null {
  const stage = portcoStage(p);
  const phase = portcoPhase(p, members);
  if (phase === "done") return null;
  switch (stage) {
    case 1:
      if (phase === "idle") return { label: "Find dates", enabled: true };
      if (phase === "needsDraft") return { label: "Draft the one-pager", enabled: true };
      return { label: "Approve one-pager", enabled: true };
    case 2:
      if (phase === "needsDraft") return { label: "Draft the email to partners", enabled: true };
      if (phase === "review") return { label: "Approve and send to partners", enabled: true };
      if (phase === "waiting") return { label: "Waiting on the partners", enabled: false };
      return { label: "Draft the email to the company", enabled: allPartnersYes(p) };
    case 3:
      if (phase === "needsDraft") return { label: "Draft the email to the company", enabled: true };
      if (phase === "review") return { label: "Approve and send to the company", enabled: true };
      if (phase === "waiting") return { label: "Waiting on the company", enabled: false };
      return { label: "Draft the email to the board", enabled: allPicked(p) };
    case 4:
      if (phase === "needsDraft") return { label: "Draft the email to the board", enabled: true };
      if (phase === "review") return { label: "Approve and send to board", enabled: true };
      if (phase === "conflict") return { label: "Approve and re-send to board", enabled: true };
      if (phase === "waiting") return { label: "Waiting on the board", enabled: false };
      return { label: "Lock and book", enabled: allBoardConfirmed(p, members) };
    case 5:
      if (phase === "needsDraft") return { label: "Pick hotels and restaurants", enabled: true };
      return { label: "Approve and lock", enabled: true };
    default:
      if (phase === "needsDraft") return { label: "Draft the invites", enabled: true };
      if (phase === "review") return { label: "Approve and send invites", enabled: true };
      return { label: "Waiting on replies", enabled: false };
  }
}

export function waitingLabel(w: WaitingOn): string {
  return w === "partners" ? "the partners" : w === "portco" ? "the company" : w === "board" ? "the board" : w === "attendees" ? "invite replies" : "nobody";
}

// ---------- work strip ----------

export type Bucket = "you" | "others" | "notStarted" | "done";

export function bucketOf(p: Portco, members: BoardMember[]): Bucket {
  const phase = portcoPhase(p, members);
  if (phase === "done") return "done";
  if (phase === "idle") return "notStarted";
  if (phase === "waiting") return "others";
  return "you";
}

export function confirmedMeetings(p: Portco, members: BoardMember[]): number {
  return p.targetQuarters.filter((q) => boardConfirmedQuarter(p, q, members)).length;
}

export type WorkCounts = { you: number; others: number; notStarted: number; done: number; confirmed: number; total: number };

export function workCounts(list: Portco[], membersOf: (id: string) => BoardMember[]): WorkCounts {
  const c: WorkCounts = { you: 0, others: 0, notStarted: 0, done: 0, confirmed: 0, total: 0 };
  for (const p of list) {
    const m = membersOf(p.id);
    c[bucketOf(p, m)]++;
    c.confirmed += confirmedMeetings(p, m);
    c.total += p.targetQuarters.length;
  }
  return c;
}

// Days other portcos already hold, for anyone who shares a partner with
// this one. While options are out, the first option is penciled in. A pick,
// confirmation, or lock holds that day. The calendar shows the same days.
export function heldDays(others: Portco[], partnerIds: string[]): Set<string> {
  const days = new Set<string>();
  for (const o of others) {
    if (!o.partnerIds.some((id) => partnerIds.includes(id))) continue;
    for (const q of o.targetQuarters) {
      const qs = o.quarters[q];
      if (qs.status === "notStarted") continue;
      const held = qs.shortlist.find((w) => w.id === qs.portcoPick) ?? qs.shortlist.find((w) => w.rank === 1);
      if (held) days.add(held.start.slice(0, 10));
    }
  }
  return days;
}

export function currentEa(eas: EA[]): EA | undefined {
  return eas.find((e) => e.isCurrentUser) ?? eas[0];
}

export function nowIso(): string {
  return new Date().toISOString();
}
