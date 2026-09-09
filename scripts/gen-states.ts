// Rebuilds data/demo-states.json by running the same transitions the app
// runs, fed with the mock agent templates. Run after gen:fixtures.
//   npm run gen:states
// Drafts keep the {{replyBy}} token; the app fills it when a state loads.
// Log timestamps are spread over the past week and rebased on load.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getAvailability,
  getBoardMembers,
  getPartners,
  getPortcoSeeds,
  getVenues,
  hydratePortco,
  personName,
} from "../lib/data";
import { CONFLICT_QUARTER, conflictMember, simulatedPicks } from "../lib/simulate";
import { heldDays } from "../lib/pipeline";
import { mockBoardEmail, mockConflict, mockLogistics, mockPartnerEmail, mockPortcoEmail, mockShortlist } from "../lib/mockAgent";
import { boardEmailPayload, conflictPayload, logisticsPayload, partnerEmailPayload, portcoEmailPayload, shortlistPayload } from "../lib/payloads";

const REPLY_BY = "{{replyBy}}";
import * as T from "../lib/transitions";
import type { DemoState, Portco } from "../lib/types";

const ROOT = resolve(__dirname, "..");

// A fake clock. Each portco's story starts on a different day of the past
// week so "waiting since" varies across rows.
let clock = 0;
function startClock(daysAgo: number, hour: number) {
  clock = Date.parse("2026-09-09T12:00:00Z") - daysAgo * 86400000 + (hour - 9) * 3600000;
}
function tick(): string {
  clock += (4 + Math.floor(Math.random() * 40)) * 60_000;
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

function fresh(id: string): Portco {
  const seed = getPortcoSeeds().find((s) => s.id === id);
  if (!seed) throw new Error(`No portco ${id}`);
  return hydratePortco(seed);
}

// Portcos generated so far in the current state. Find dates skips the days
// they hold, the same way the app does.
let generated: Record<string, Portco> = {};

// ---------- composable steps, mirroring lib/actions.ts primary() ----------

function toOnepagerReview(p: Portco): Portco {
  p = T.findDates(p, deps, heldDays(Object.values(generated), p.partnerIds));
  return T.applyOnepager(p, mockShortlist(shortlistPayload(p, REPLY_BY)), false, 0, deps);
}

function toPartnerReview(p: Portco): Portco {
  p = T.approveOnepager(toOnepagerReview(p), deps);
  return T.applyPartnerEmail(p, mockPartnerEmail(partnerEmailPayload(p, p.drafts.onepager?.text ?? "", REPLY_BY)), false, 0, deps);
}

function toWaitingPartners(p: Portco): Portco {
  return T.sendToPartners(toPartnerReview(p), deps);
}

function toPortcoReview(p: Portco): Portco {
  p = T.partnerReplies(toWaitingPartners(p), p.partnerIds, deps);
  p = T.startPortcoPicks(p, deps);
  return T.applyPortcoEmail(p, mockPortcoEmail(portcoEmailPayload(p, p.drafts.onepager?.text ?? "", REPLY_BY)), false, 0, deps);
}

function toWaitingPortco(p: Portco): Portco {
  return T.sendToPortco(toPortcoReview(p), deps);
}

function toBoardReview(p: Portco): Portco {
  p = toWaitingPortco(p);
  p = T.recordPortcoPicks(p, simulatedPicks(p), deps);
  p = T.startBoardConfirms(p, deps);
  return T.applyBoardEmail(p, mockBoardEmail(boardEmailPayload(p, REPLY_BY)), false, 0, deps);
}

function toWaitingBoard(p: Portco, confirmed = 0): Portco {
  p = T.sendToBoard(toBoardReview(p), deps);
  if (confirmed > 0) {
    const ids = getBoardMembers(p.id).slice(0, confirmed).map((m) => m.id);
    p = T.boardConfirmSome(p, ids, deps);
  }
  return p;
}

function toLockReview(p: Portco, withConflict: boolean): Portco {
  p = toWaitingBoard(p);
  if (withConflict) {
    const member = conflictMember(getBoardMembers(p.id))!;
    const c = T.boardConflict(p, member.id, CONFLICT_QUARTER, deps);
    p = c.portco;
    if (c.declined) {
      const wording = mockConflict(conflictPayload(p, CONFLICT_QUARTER, member.id, c.declined, c.fallback, c.reverify));
      p = T.applyConflict(p, CONFLICT_QUARTER, member.id, c.declined, c.fallback, c.reverify, wording, false, deps);
      p = T.approveResend(p, CONFLICT_QUARTER, deps);
    }
  }
  p = T.boardConfirmAll(p, deps);
  p = T.lockAndBook(p, deps);
  return T.applyLogistics(p, mockLogistics(logisticsPayload(p)), false, 0, deps);
}

function toLocked(p: Portco, withConflict: boolean): Portco {
  return T.approveAndLock(toLockReview(p, withConflict), deps);
}

// ---------- states ----------

function council(cumberlandAtBoard: boolean): DemoState {
  const portcos: Record<string, Portco> = {};
  generated = portcos;
  const step = (id: string, daysAgo: number, hour: number, fn: (p: Portco) => Portco) => {
    startClock(daysAgo, hour);
    portcos[id] = fn(fresh(id));
  };
  // Peggy (ea1): Cumberland is the walkthrough. One waiting on you (venue
  // picks ready), one waiting on the portco, one on the board, one on partners.
  if (cumberlandAtBoard) step("pc2", 0, 8, toBoardReview);
  step("pc1", 6, 9, (p) => toLockReview(p, true));
  step("pc3", 3, 10, toWaitingPortco);
  step("pc4", 2, 14, (p) => toWaitingBoard(p, 1));
  step("pc5", 1, 15, toWaitingPartners);
  // EA 2: two locked, one on the board, one on the portco, one not started.
  step("pc6", 9, 9, (p) => toLocked(p, false));
  step("pc7", 8, 10, (p) => toLocked(p, true));
  step("pc8", 4, 11, (p) => toWaitingBoard(p, 2));
  step("pc9", 2, 9, toWaitingPortco);
  // EA 3: one on the board, one on the portco, one on partners, two not started.
  step("pc11", 5, 13, (p) => toWaitingBoard(p, 0));
  step("pc12", 3, 16, toWaitingPortco);
  step("pc13", 1, 9, toWaitingPartners);
  return {
    description: cumberlandAtBoard
      ? "Council, with Cumberland at step 4 and the board email drafted. Start at Beat 4."
      : "Fifteen portcos staggered across three EAs. Cumberland not started. The room default.",
    portcos,
  };
}

const states: Record<string, DemoState> = {
  fresh: { description: "All fifteen portcos not started.", portcos: {} },
  council: council(false),
  "council-at-board": council(true),
};

// Supply check: after the council state, Cumberland must still find three
// options in Q1, Q2, Q4 and exactly two in Q3, or the demo script breaks.
{
  generated = states.council.portcos as Record<string, Portco>;
  const p = T.findDates(fresh("pc2"), deps, heldDays(Object.values(generated), fresh("pc2").partnerIds));
  const counts = p.targetQuarters.map((q) => `${q}=${p.quarters[q].windows.length}`);
  console.log(`Cumberland after council: ${counts.join(" ")}`);
  for (const q of p.targetQuarters) {
    const n = p.quarters[q].windows.length;
    if ((q === "Q3" && n !== 2) || (q !== "Q3" && n < 3)) throw new Error(`Cumberland ${q} has ${n} windows after council. Adjust the staggering.`);
  }
}

writeFileSync(resolve(ROOT, "data/demo-states.json"), JSON.stringify(states, null, 2) + "\n");
for (const [k, v] of Object.entries(states)) {
  const ids = Object.keys(v.portcos);
  console.log(`${k.padEnd(18)} ${ids.length ? ids.join(", ") : "(fresh)"}`);
}
