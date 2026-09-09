// Deterministic simulations for the presenter menu. Also used by
// scripts/gen-mock.ts so pre-written drafts match what the demo shows.

import type { BoardMember, Portco, Quarter, Window } from "./types";

// The quarter a board member declines: the thin quarter if there is one,
// else the third quarter of the window, else the last.
export function conflictQuarter(portco: Portco): Quarter {
  const thin = portco.targetQuarters.find((q) => portco.quarters[q]?.thin);
  if (thin) return thin;
  const qs = portco.targetQuarters;
  return qs[Math.min(2, qs.length - 1)];
}

// The portco picks rank 1 in most quarters and rank 2 in one, so the board
// email is not a copy of the top line of the one-pager. Which quarter takes
// rank 2 rotates by portco, so portcos that share partners land on different
// days. The conflict quarter always picks rank 1 so the fallback is rank 2.
export function simulatedPickRank(portco: Portco, q: Quarter): 1 | 2 | 3 {
  if (q === conflictQuarter(portco)) return 1;
  let n = 0;
  for (const ch of portco.id) n = (n * 31 + ch.charCodeAt(0)) % 1000;
  const others = portco.targetQuarters.filter((x) => x !== conflictQuarter(portco));
  if (others.length === 0) return 1;
  const rank2 = others[n % others.length];
  const rank3 = others[(n + 1) % others.length];
  if (q === rank2) return 2;
  if (q === rank3 && rank3 !== rank2 && n % 2 === 0) return 3;
  return 1;
}

export function simulatedPick(shortlist: Window[], portco: Portco, q: Quarter): Window | undefined {
  const want = simulatedPickRank(portco, q);
  return shortlist.find((w) => w.rank === want) ?? shortlist.find((w) => w.rank === 1) ?? shortlist[0];
}

export function simulatedPicks(portco: Portco): Partial<Record<Quarter, Window>> {
  const out: Partial<Record<Quarter, Window>> = {};
  for (const q of portco.targetQuarters) {
    const w = simulatedPick(portco.quarters[q].shortlist, portco, q);
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

// Every draft signs off with the logged-in assistant, never a fixed string.
export function eaSignature(ea: { name: string }): string {
  return `${ea.name}, Executive Assistant to the Greenbriar Partners`;
}

// Partners reply in order, all yes.
export function simulatedPartnerReplies(portco: Portco): string[] {
  return [...portco.partnerIds];
}
