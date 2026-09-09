// Deterministic simulations for the presenter menu. Also used by
// scripts/gen-mock.ts so pre-written drafts match what the demo shows.

import type { BoardMember, Portco, Quarter, Window } from "./types";

export const CONFLICT_QUARTER: Quarter = "Q3";

// The portco picks rank 1 everywhere except Q2, where it picks rank 2, so
// the board email is not a copy of the top line of the one-pager.
export function simulatedPickRank(q: Quarter): 1 | 2 {
  return q === "Q2" ? 2 : 1;
}

export function simulatedPick(shortlist: Window[], q: Quarter): Window | undefined {
  const want = simulatedPickRank(q);
  return shortlist.find((w) => w.rank === want) ?? shortlist.find((w) => w.rank === 1) ?? shortlist[0];
}

export function simulatedPicks(portco: Portco): Partial<Record<Quarter, Window>> {
  const out: Partial<Record<Quarter, Window>> = {};
  for (const q of portco.targetQuarters) {
    const w = simulatedPick(portco.quarters[q].shortlist, q);
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
