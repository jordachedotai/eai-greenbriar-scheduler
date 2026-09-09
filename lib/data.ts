// Single data-access layer. Everything reads fixtures from /data today.
// Swap this file for a real backend later without touching components.

import partnersJson from "@/data/partners.json";
import portcosJson from "@/data/portcos.json";
import boardMembersJson from "@/data/board-members.json";
import availabilityJson from "@/data/availability.json";
import venuesJson from "@/data/venues.json";
import mockOutputsJson from "@/data/mock-agent-outputs.json";
import demoStatesJson from "@/data/demo-states.json";
import type {
  AvailabilityBlock,
  BoardMember,
  DemoState,
  Partner,
  Portco,
  PortcoSeed,
  Quarter,
  QuarterState,
  Venue,
} from "./types";
import { QUARTERS } from "./types";
import { fillTokens } from "./text";
import { replyByDate } from "./simulate";

export function getPartners(): Partner[] {
  return partnersJson as Partner[];
}

export function getPartner(id: string): Partner | undefined {
  return getPartners().find((p) => p.id === id);
}

export function getPortcoSeeds(): PortcoSeed[] {
  return portcosJson as PortcoSeed[];
}

export function getBoardMembers(portcoId?: string): BoardMember[] {
  const all = boardMembersJson as BoardMember[];
  return portcoId ? all.filter((b) => b.portcoId === portcoId) : all;
}

export function getBoardMember(id: string): BoardMember | undefined {
  return getBoardMembers().find((b) => b.id === id);
}

export function getAvailability(): AvailabilityBlock[] {
  return availabilityJson as AvailabilityBlock[];
}

export function getVenues(city?: string): Venue[] {
  const all = venuesJson as Venue[];
  return city ? all.filter((v) => v.city === city) : all;
}

export function getMockOutput(portcoId: string, quarter: Quarter | "all", kind: string, variant = 0): unknown {
  const map = mockOutputsJson as Record<string, unknown>;
  const key = `${portcoId}.${quarter}.${kind}`;
  if (variant % 2 === 1 && map[`${key}.alt`] !== undefined) return map[`${key}.alt`];
  return map[key];
}

export function getVenue(id: string): Venue | undefined {
  return getVenues().find((v) => v.id === id);
}

export function getDemoStates(): Record<string, DemoState> {
  return demoStatesJson as Record<string, DemoState>;
}

export function personName(id: string): string {
  return getPartner(id)?.name ?? getBoardMember(id)?.name ?? id;
}

export function emptyQuarter(): QuarterState {
  return {
    status: "pending",
    windows: [],
    shortlist: [],
    internalApprovals: {},
    boardResponses: {},
  };
}

// Build the fresh, stage-0 runtime record for a portco seed.
export function hydratePortco(seed: PortcoSeed): Portco {
  const quarters = {} as Record<Quarter, QuarterState>;
  for (const q of QUARTERS) quarters[q] = emptyQuarter();
  return { ...seed, stage: 0, quarters, log: [], drafts: {} };
}

export function freshPortcos(): Record<string, Portco> {
  const out: Record<string, Portco> = {};
  for (const seed of getPortcoSeeds()) out[seed.id] = hydratePortco(seed);
  return out;
}

// Apply a saved demo state on top of fresh portcos. Fills {{replyBy}} in
// saved drafts and shifts log timestamps so the latest entry reads as a
// minute ago, whatever day the state was generated.
export function loadDemoState(name: string, now = Date.now()): Record<string, Portco> {
  const base = freshPortcos();
  const state = getDemoStates()[name];
  if (!state) return base;
  const tokens = { replyBy: replyByDate(new Date(now)) };
  let latest = 0;
  for (const partial of Object.values(state.portcos)) {
    for (const e of partial.log ?? []) latest = Math.max(latest, Date.parse(e.at));
  }
  const shift = latest ? now - 60_000 - latest : 0;
  for (const [id, partial] of Object.entries(state.portcos)) {
    if (!base[id]) continue;
    const merged = fillTokens({ ...base[id], ...partial } as Portco, tokens);
    merged.log = merged.log.map((e) => ({ ...e, at: new Date(Date.parse(e.at) + shift).toISOString() }));
    base[id] = merged;
  }
  return base;
}
