// Derived views of pipeline state. Pure functions over Portco records.

import type { Portco, Quarter, QuarterStatus, Stage } from "./types";
import { STATUS_STAGE, STAGE_BUTTONS } from "./types";

// A card sits in the column of its least-advanced target quarter.
export function portcoStage(p: Portco): Stage {
  let min: Stage = 6;
  for (const q of p.targetQuarters) {
    const s = STATUS_STAGE[p.quarters[q].status];
    if (s < min) min = s;
  }
  return min;
}

export function nextAction(p: Portco): string {
  const stage = portcoStage(p);
  if (stage === 6 && p.targetQuarters.every((q) => isFinal(p, q))) {
    return "Done";
  }
  return STAGE_BUTTONS[stage];
}

export function lockedMeetings(portcos: Record<string, Portco>): number {
  let n = 0;
  for (const p of Object.values(portcos)) {
    for (const q of p.targetQuarters) if (isFinal(p, q)) n++;
  }
  return n;
}

// A quarter is final once the dates are locked and the EA approved logistics.
export function isFinal(p: Portco, q: Quarter): boolean {
  const qs = p.quarters[q];
  return qs.status === "locked" && !!qs.logistics;
}

export function totalMeetings(portcos: Record<string, Portco>): number {
  let n = 0;
  for (const p of Object.values(portcos)) n += p.targetQuarters.length;
  return n;
}

export function inFlight(portcos: Record<string, Portco>): number {
  return Object.values(portcos).length;
}

export function quartersByStatus(p: Portco): Record<QuarterStatus, Quarter[]> {
  const out: Record<QuarterStatus, Quarter[]> = {
    pending: [], availability: [], shortlist: [], internal: [], portco: [], board: [], locked: [],
  };
  for (const q of p.targetQuarters) out[p.quarters[q].status].push(q);
  return out;
}

export function nowIso(): string {
  return new Date().toISOString();
}
