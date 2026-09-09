// Rebuilds data/demo-states.json by running the same transitions the app
// runs, fed with the mock agent outputs. Run after gen:fixtures or gen:mock.
//   npm run gen:states
// Drafts keep the {{replyBy}} token; the app fills it when a state loads.
// Log timestamps are spaced a few minutes apart and rebased on load.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getAvailability,
  getBoardMembers,
  getMockOutput,
  getPartners,
  getPortcoSeeds,
  getVenues,
  hydratePortco,
  personName,
} from "../lib/data";
import { CONFLICT_QUARTER, conflictMember, simulatedPicks } from "../lib/simulate";
import * as T from "../lib/transitions";
import type { DemoState, Portco } from "../lib/types";

const ROOT = resolve(__dirname, "..");

// A fake clock: each log entry lands a few minutes after the last.
let clock = Date.parse("2026-09-09T14:00:00Z");
function tick(): string {
  clock += (3 + Math.floor(Math.random() * 9)) * 60_000;
  return new Date(clock).toISOString();
}

const deps: T.Deps = {
  partners: getPartners(),
  boardMembers: getBoardMembers(),
  availability: getAvailability(),
  venues: getVenues(),
  name: personName,
  now: tick,
};

function mock<R>(p: Portco, step: string, quarter: "all" | typeof CONFLICT_QUARTER = "all"): R {
  const v = getMockOutput(p.id, quarter, step);
  if (v === undefined) throw new Error(`Missing mock output ${p.id}.${quarter}.${step}. Run npm run gen:mock first.`);
  return v as R;
}

function fresh(id: string): Portco {
  const seed = getPortcoSeeds().find((s) => s.id === id);
  if (!seed) throw new Error(`No portco ${id}`);
  return hydratePortco(seed);
}

// ---------- composable steps ----------

function toAvailability(p: Portco): Portco {
  return T.pullAvailability(p, deps);
}

function toShortlist(p: Portco): Portco {
  p = T.buildShortlist(toAvailability(p));
  return T.applyShortlist(p, mock<T.ShortlistResult>(p, "shortlist"), false, 0, deps);
}

function toInternal(p: Portco): Portco {
  return T.approveOnepager(toShortlist(p), deps);
}

function toPortcoSent(p: Portco): Portco {
  p = T.approveAllInternal(toInternal(p), deps);
  p = T.sendToPortco(p);
  p = T.applyPortcoEmail(p, mock<string>(p, "portcoEmail"), false, 0, deps);
  return T.approvePortcoEmail(p, deps);
}

function toPortcoPicked(p: Portco): Portco {
  p = toPortcoSent(p);
  return T.recordPortcoPicks(p, simulatedPicks(p), deps);
}

function toBoardSent(p: Portco): Portco {
  p = T.sendToBoard(toPortcoPicked(p), deps);
  p = T.applyBoardEmail(p, mock<string>(p, "boardEmail"), false, 0, deps);
  return T.approveBoardEmail(p, deps);
}

function toLocked(p: Portco): Portco {
  p = toBoardSent(p);
  // The conflict path, so the timeline tells the whole story.
  const member = conflictMember(getBoardMembers(p.id))!;
  const c = T.boardConflict(p, member.id, CONFLICT_QUARTER, deps);
  p = c.portco;
  if (c.declined) {
    p = T.applyConflict(p, CONFLICT_QUARTER, member.id, c.declined, c.fallback, c.reverify, mock<T.ConflictResult>(p, "conflict", CONFLICT_QUARTER), false, deps);
    p = T.approveConflictResend(p, CONFLICT_QUARTER, deps);
  }
  p = T.boardConfirmAll(p, deps);
  p = T.lockDates(p, deps);
  p = T.applyLogistics(p, mock<T.LogisticsResult>(p, "logistics"), false, 0, deps);
  return T.approveLogistics(p, deps);
}

// ---------- states ----------

function build(): Record<string, DemoState> {
  const states: Record<string, DemoState> = {};

  states.fresh = { description: "Five portcos in Setup. Nothing started.", portcos: {} };

  states["one-portco-at-shortlist"] = {
    description: "Summit Ridge at stage 2 with the one-pager drafted. Start at Beat 3: press Approve.",
    portcos: { pc1: toShortlist(fresh("pc1")) },
  };

  states["one-portco-at-board"] = {
    description: "Summit Ridge has its portco picks. Start at Beat 5: press Send to board.",
    portcos: { pc1: toPortcoPicked(fresh("pc1")) },
  };

  states["one-portco-locked"] = {
    description: "Summit Ridge locked with logistics approved, 4 of 20. Shows the finished card.",
    portcos: { pc1: toLocked(fresh("pc1")) },
  };

  const pc2 = toBoardSent(fresh("pc2"));
  const pc2members = getBoardMembers("pc2");
  const pc4 = T.markInternalApproval(T.markInternalApproval(toInternal(fresh("pc4")), "p1", deps), "p3", deps);
  states["all-in-flight"] = {
    description: "Every portco somewhere different: one locked, one with the board, one waiting on the portco, one in sign-off, one at availability.",
    portcos: {
      pc1: toLocked(fresh("pc1")),
      pc2: T.boardConfirmSome(pc2, pc2members.slice(0, 2).map((m) => m.id), deps),
      pc3: toPortcoSent(fresh("pc3")),
      pc4,
      pc5: toAvailability(fresh("pc5")),
    },
  };

  return states;
}

const states = build();
writeFileSync(resolve(ROOT, "data/demo-states.json"), JSON.stringify(states, null, 2) + "\n");
for (const [k, v] of Object.entries(states)) {
  const ids = Object.keys(v.portcos);
  console.log(`${k.padEnd(26)} ${ids.length ? ids.join(", ") : "(fresh)"}`);
}
