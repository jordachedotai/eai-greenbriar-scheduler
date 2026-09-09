// Single data-access layer. Everything reads fixtures from /data today.
// Swap this file for a real backend later without touching components.

import partnersJson from "@/data/partners.json";
import easJson from "@/data/eas.json";
import teamJson from "@/data/source/greenbriar-team.json";
import portcosJson from "@/data/portcos.json";
import boardMembersJson from "@/data/board-members.json";
import availabilityJson from "@/data/availability.json";
import venuesJson from "@/data/venues.json";
import demoStatesJson from "@/data/demo-states.json";
import type {
  AvailabilityBlock,
  BoardMember,
  DemoState,
  EA,
  Partner,
  Portco,
  PortcoSeed,
  Quarter,
  QuarterState,
  Venue,
} from "./types";
import { fillTokens } from "./text";
import { replyByDate } from "./simulate";
import { windowQuarters } from "./quarters";

// The deal-team partners plus everyone on the roster, so a person added
// to a company from People resolves like any partner.
let partnersCache: Partner[] | null = null;
export function getPartners(): Partner[] {
  if (!partnersCache) {
    const base = partnersJson as Partner[];
    const seen = new Set(base.map((p) => p.id));
    const extra = (teamJson as TeamMember[]).filter((t) => !seen.has(t.id)).map((t) => ({ id: t.id, name: t.name, title: t.title, homeCity: "Rye, NY", avatar: t.avatar }));
    partnersCache = [...base, ...extra];
  }
  return partnersCache;
}

// The 17 people on a current deal team, from the fixture only.
export function getDealTeamPartners(): Partner[] {
  return partnersJson as Partner[];
}

export type TeamMember = { id: string; name: string; title: string; group: string; avatar?: string };

export function getTeam(): TeamMember[] {
  return teamJson as TeamMember[];
}

export function getEas(): EA[] {
  return easJson as EA[];
}

export function getEa(id: string): EA | undefined {
  return getEas().find((e) => e.id === id);
}

export function getCurrentEa(): EA {
  const eas = getEas();
  return eas.find((e) => e.isCurrentUser) ?? eas[0];
}

export function getPartner(id: string): Partner | undefined {
  return getPartners().find((p) => p.id === id);
}

export function getPortcoSeeds(): PortcoSeed[] {
  return portcosJson as PortcoSeed[];
}

// Board members of companies added in Settings live on the portco record.
// The store registers them here so names resolve everywhere.
let extraMembers: BoardMember[] = [];
export function setExtraBoardMembers(list: BoardMember[]) {
  extraMembers = list;
}

export function getBoardMembers(portcoId?: string): BoardMember[] {
  const all = [...(boardMembersJson as BoardMember[]), ...extraMembers];
  return portcoId ? all.filter((b) => b.portcoId === portcoId) : all;
}

export function getBoardMember(id: string): BoardMember | undefined {
  return getBoardMembers().find((b) => b.id === id);
}

export function getAvailability(): AvailabilityBlock[] {
  return availabilityJson as AvailabilityBlock[];
}

// Cities without fixture venues get a generic set, so a company added in
// Settings can still lock and book. Ids carry the city so they resolve.
const GENERIC: [Venue["type"], string, number, string][] = [
  ["hotel", "The Grand Hotel", 0.4, "Closest full-service hotel, quiet, reliable"],
  ["hotel", "Marriott Downtown", 0.8, "Larger, easy for late check-in"],
  ["hotel", "The Boutique Inn", 1.1, "Smaller rooms, good bar, walkable to dinner"],
  ["restaurant", "The Capital Grille", 0.5, "Steakhouse, private room seats twelve"],
  ["restaurant", "Harvest Table", 0.9, "Chef-driven, quiet enough for a board"],
  ["restaurant", "The Corner Bistro", 0.3, "Casual, better for a relaxed night"],
];

export function genericVenues(city: string): Venue[] {
  const short = city.split(",")[0];
  return GENERIC.map(([type, name, distanceMi, note], i) => ({
    id: `gen:${city}:${i}`,
    city,
    type,
    name: `${name} ${short}`,
    distanceMi,
    note,
  }));
}

// Venues the assistant added in a lock step. The store registers them so
// every later dropdown for that city, and the agent, can pick them.
let extraVenues: Venue[] = [];
export function setExtraVenues(list: Venue[]) {
  extraVenues = list;
}

export function getVenues(city?: string): Venue[] {
  const all = [...(venuesJson as Venue[]), ...extraVenues];
  if (!city) return all;
  const found = all.filter((v) => v.city === city);
  const base = found.some((v) => !v.addedBy) ? found : [...genericVenues(city), ...found];
  return base;
}

export function getVenue(id: string): Venue | undefined {
  const extra = extraVenues.find((v) => v.id === id);
  if (extra) return extra;
  if (id.startsWith("gen:")) {
    const [, city, idx] = id.split(":");
    return genericVenues(city)[Number(idx)];
  }
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
    status: "notStarted",
    windows: [],
    shortlist: [],
    internalApprovals: {},
    boardResponses: {},
  };
}

// Build the fresh runtime record for a portco seed. The planning window
// decides which quarters exist.
export function hydratePortco(seed: PortcoSeed): Portco {
  const targetQuarters = windowQuarters({ startQuarter: seed.startQuarter, quarterCount: seed.quarterCount });
  const quarters = {} as Record<Quarter, QuarterState>;
  for (const q of targetQuarters) quarters[q] = emptyQuarter();
  return { ...seed, targetQuarters, waitingOn: "none", quarters, log: [], drafts: {} };
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
    if (merged.waitingSince) merged.waitingSince = new Date(Date.parse(merged.waitingSince) + shift).toISOString();
    base[id] = merged;
  }
  return base;
}
