// Deterministic simulations for the presenter menu. Also used by
// scripts/gen-mock.ts so pre-written drafts match what the demo shows.

import type { BoardMember, Portco, Quarter, Window } from "./types";

export const CONFLICT_QUARTER: Quarter = "Q3";

// The portco picks rank 1 in most quarters and rank 2 in one, so the board
// email is not a copy of the top line of the one-pager. Which quarter takes
// rank 2 rotates by portco, so portcos that share partners land on different
// days. The conflict quarter always picks rank 1 so the fallback is rank 2.
export function simulatedPickRank(portcoId: string, q: Quarter): 1 | 2 | 3 {
  if (q === CONFLICT_QUARTER) return 1;
  const n = Number(portcoId.replace(/\D/g, "")) || 0;
  const others: Quarter[] = ["Q1", "Q2", "Q4"];
  const rank2 = others[n % 3];
  const rank3 = others[(n + 1) % 3];
  if (q === rank2) return 2;
  if (q === rank3 && n % 2 === 0) return 3;
  return 1;
}

export function simulatedPick(shortlist: Window[], portcoId: string, q: Quarter): Window | undefined {
  const want = simulatedPickRank(portcoId, q);
  return shortlist.find((w) => w.rank === want) ?? shortlist.find((w) => w.rank === 1) ?? shortlist[0];
}

export function simulatedPicks(portco: Portco): Partial<Record<Quarter, Window>> {
  const out: Partial<Record<Quarter, Window>> = {};
  for (const q of portco.targetQuarters) {
    const w = simulatedPick(portco.quarters[q].shortlist, portco.id, q);
    if (w) out[q] = w;
  }
  return out;
}

// The second board member declines the conflict quarter.
export function conflictMember(members: BoardMember[]): BoardMember | undefined {
  return members[1] ?? members[0];
}

// Two weeks out from today, as "Wednesday, September 23".
export function replyByDate(from = new Date()): string {
  const d = new Date(from.getTime() + 14 * 86400000);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export const EA_SIGNATURE = "Executive Assistant to the Greenbriar Partners";

// Partners reply in order, all yes.
export function simulatedPartnerReplies(portco: Portco): string[] {
  return [...portco.partnerIds];
}
