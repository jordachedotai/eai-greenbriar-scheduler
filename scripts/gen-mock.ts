// Writes data/mock-agent-outputs.json as a preview of every agent step for
// every portco, from the fresh state. Mock mode does not read this file: it
// renders the same templates at runtime over the live shortlist. This file
// is for reading and hand-checking the wording.
//   npm run gen:mock            template wording, no network
//   npm run gen:mock -- --live  Claude's wording through lib/claude.ts
// Keys: `${portcoId}.${quarter|all}.${step}`.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getAvailability, getBoardMembers, getPartners, getPortcoSeeds, getVenues, hydratePortco, personName } from "../lib/data";
import { boardEmailPayload, conflictPayload, logisticsPayload, partnerEmailPayload, portcoEmailPayload, shortlistPayload } from "../lib/payloads";
import { CONFLICT_QUARTER, conflictMember, simulatedPicks } from "../lib/simulate";
import { buildPrompt, extractJson } from "../lib/prompts";
import { mockStep } from "../lib/mockAgent";
import * as T from "../lib/transitions";
import type { Portco, Window } from "../lib/types";

const LIVE = process.argv.includes("--live");
const ROOT = resolve(__dirname, "..");
const REPLY_BY = "{{replyBy}}";

const deps: T.Deps = {
  partners: getPartners(),
  boardMembers: getBoardMembers(),
  availability: getAvailability(),
  venues: getVenues(),
  name: personName,
  now: () => new Date().toISOString(),
};

async function write(step: Parameters<typeof buildPrompt>[0], payload: unknown, json: boolean): Promise<unknown> {
  if (!LIVE) return mockStep(step, payload);
  const { callClaude } = await import("../lib/claude");
  const text = await callClaude(buildPrompt(step, payload));
  return json ? extractJson(text) : text;
}

async function main() {
  const out: Record<string, unknown> = {};
  for (const seed of getPortcoSeeds()) {
    let p: Portco = T.findDates(hydratePortco(seed), deps);
    const key = (q: string, step: string) => `${p.id}.${q}.${step}`;
    console.log(`${p.id} ${p.name}${LIVE ? " (live)" : ""}`);

    const shortlist = (await write("shortlist", shortlistPayload(p, REPLY_BY), true)) as T.ShortlistResult;
    out[key("all", "shortlist")] = shortlist;
    p = T.applyOnepager(p, shortlist, false, 0, deps);
    out[key("all", "partnerEmail")] = await write("partnerEmail", partnerEmailPayload(p, shortlist.onepager, REPLY_BY), false);
    out[key("all", "portcoEmail")] = await write("portcoEmail", portcoEmailPayload(p, shortlist.onepager, REPLY_BY), false);
    p = T.recordPortcoPicks(p, simulatedPicks(p), deps);
    out[key("all", "boardEmail")] = await write("boardEmail", boardEmailPayload(p, REPLY_BY), false);
    const member = conflictMember(getBoardMembers(p.id))!;
    const declined = T.pickedWindow(p, CONFLICT_QUARTER) as Window;
    const c = T.boardConflict(p, member.id, CONFLICT_QUARTER, deps);
    out[key(CONFLICT_QUARTER, "conflict")] = await write("conflict", conflictPayload(p, CONFLICT_QUARTER, member.id, declined, c.fallback, c.reverify), true);
    out[key("all", "logistics")] = await write("logistics", logisticsPayload(p), true);
  }
  writeFileSync(resolve(ROOT, "data/mock-agent-outputs.json"), JSON.stringify(out, null, 2) + "\n");
  if (JSON.stringify(out).includes("—")) console.warn("WARNING: an em-dash slipped into the outputs.");
  console.log(`wrote ${Object.keys(out).length} keys to data/mock-agent-outputs.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
