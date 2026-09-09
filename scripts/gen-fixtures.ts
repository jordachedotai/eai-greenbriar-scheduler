// Regenerates data/availability.json and data/venues.json.
// Run: npm run gen:fixtures
// Deterministic: same seed, same output. Names files are never touched.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import partners from "../data/partners.json";
import portcos from "../data/portcos.json";
import boardMembers from "../data/board-members.json";
import type { AvailabilityBlock, BoardMember, Partner, PortcoSeed, Quarter, Venue } from "../lib/types";
import { addDays, dayKey, findWindows, rankWindows, toIso, weekdayOf } from "../lib/scheduling";

const YEAR = 2027;
const ROOT = resolve(__dirname, "..");

// One thin quarter per portco. The demo portco pc1 has all four partners, so
// its windows are a subset of every other portco's windows in the same
// quarter. That means every portco has to be thin in the same quarter or pc1
// ends up thin everywhere. Q3 is that quarter: summer travel makes it tight.
const THIN: Record<string, Quarter> = { pc1: "Q3", pc2: "Q3", pc3: "Q3", pc4: "Q3", pc5: "Q3" };
const THIN_COUNT = 2;
const MIN_NORMAL = 4;

// US holidays and slow weeks in 2027, skipped for everyone.
const CLOSED = new Set([
  "2027-01-04", "2027-01-05", "2027-01-06", "2027-01-07",
  "2027-01-18", "2027-02-15", "2027-05-31", "2027-07-05", "2027-09-06",
  "2027-11-24", "2027-11-25",
  "2027-12-20", "2027-12-21", "2027-12-22", "2027-12-23",
  "2027-12-27", "2027-12-28", "2027-12-29", "2027-12-30",
]);

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

// Each weekday gets an openness level. Partners are free on a half day with
// that probability. Weighted so the yearly average lands near 40 percent.
function dayOpenness(rng: Rng, month: number): number {
  const r = rng();
  if (month === 7 || month === 8) {
    // summer: more days out, fewer wide-open days
    if (r < 0.45) return 0.15;
    if (r < 0.8) return 0.4;
    return 0.75;
  }
  if (r < 0.3) return 0.15;
  if (r < 0.65) return 0.4;
  return 0.8;
}

function generateAvailability(rng: Rng, partnerList: Partner[]): AvailabilityBlock[] {
  const blocks: AvailabilityBlock[] = [];
  for (let day = `${YEAR}-01-01`; day <= `${YEAR}-12-31`; day = addDays(day, 1)) {
    const wd = weekdayOf(day);
    if (wd === 0 || wd === 5 || wd === 6) continue;
    if (CLOSED.has(day)) continue;
    const [y, m, d] = day.split("-").map(Number);
    const open = dayOpenness(rng, m);
    for (const p of partnerList) {
      const morning = rng() < open;
      const afternoon = rng() < open;
      if (morning && afternoon) {
        blocks.push({ personId: p.id, start: toIso(y, m, d, 8), end: toIso(y, m, d, 18) });
      } else if (morning) {
        blocks.push({ personId: p.id, start: toIso(y, m, d, 8), end: toIso(y, m, d, 13) });
      } else if (afternoon) {
        blocks.push({ personId: p.id, start: toIso(y, m, d, 13), end: toIso(y, m, d, 18) });
      }
    }
  }
  return blocks;
}

function countWindows(blocks: AvailabilityBlock[], portco: PortcoSeed, q: Quarter) {
  const res = findWindows({ portco, partners: partners as Partner[], boardMembers: boardMembers as BoardMember[], availability: blocks, year: YEAR });
  return res[q].windows;
}

// Remove one partner's free time on the given day.
function removeDay(blocks: AvailabilityBlock[], personId: string, day: string): AvailabilityBlock[] {
  return blocks.filter((b) => !(b.personId === personId && dayKey(b.start) === day));
}

// Carve each portco's thin quarter down to exactly THIN_COUNT windows by
// making one partner busy on the surplus days. Windows already kept for an
// earlier portco are protected, so all portcos share the same thin days and
// no cut can undo another portco's carve. For each cut pick the partner whose
// removal leaves the other portcos with the most windows in that quarter.
function carveThinQuarters(blocks: AvailabilityBlock[]): AvailabilityBlock[] {
  let out = blocks;
  const all = portcos as PortcoSeed[];
  const protectedStarts = new Set<string>();
  for (const portco of all) {
    const q = THIN[portco.id];
    if (!q) continue;
    let windows = countWindows(out, portco, q);
    const keep = new Set<string>();
    for (const w of windows) if (protectedStarts.has(w.start)) keep.add(w.start);
    for (const w of rankWindows(windows, YEAR)) {
      if (keep.size >= THIN_COUNT) break;
      keep.add(w.start);
    }
    for (const w of windows) {
      if (keep.has(w.start)) continue;
      const day = dayKey(w.start);
      let best: { blocks: AvailabilityBlock[]; score: number } | null = null;
      for (const partnerId of portco.partnerIds) {
        const candidate = removeDay(out, partnerId, day);
        const remaining = countWindows(candidate, portco, q);
        if (![...keep].every((s) => remaining.some((r) => r.start === s))) continue;
        let score = Infinity;
        for (const other of all) {
          if (other.id === portco.id || THIN[other.id] === q) continue;
          if (!other.partnerIds.includes(partnerId)) continue;
          score = Math.min(score, countWindows(candidate, other, q).length);
        }
        if (!best || score > best.score) best = { blocks: candidate, score };
      }
      if (!best) throw new Error(`no safe cut for ${portco.id} ${q} on ${day}`);
      out = best.blocks;
    }
    windows = countWindows(out, portco, q);
    if (windows.length !== THIN_COUNT) throw new Error(`carve failed for ${portco.id} ${q}: ${windows.length}`);
    for (const w of windows) protectedStarts.add(w.start);
  }
  return out;
}

function verify(blocks: AvailabilityBlock[]): { ok: boolean; report: string[] } {
  const report: string[] = [];
  let ok = true;
  for (const portco of portcos as PortcoSeed[]) {
    const res = findWindows({ portco, partners: partners as Partner[], boardMembers: boardMembers as BoardMember[], availability: blocks, year: YEAR });
    const counts = portco.targetQuarters.map((q) => {
      const n = res[q].windows.length;
      const want = THIN[portco.id] === q ? n === THIN_COUNT : n >= MIN_NORMAL;
      if (!want) ok = false;
      return `${q}=${n}${THIN[portco.id] === q ? "*" : ""}`;
    });
    report.push(`${portco.id.padEnd(4)} ${portco.name.padEnd(30)} ${counts.join("  ")}`);
  }
  return { ok, report };
}

function freeFraction(blocks: AvailabilityBlock[]): number {
  let minutes = 0;
  for (const b of blocks) {
    const s = Number(b.start.slice(11, 13));
    const e = Number(b.end.slice(11, 13));
    minutes += (e - s) * 60;
  }
  let workdays = 0;
  for (let day = `${YEAR}-01-01`; day <= `${YEAR}-12-31`; day = addDays(day, 1)) {
    const wd = weekdayOf(day);
    if (wd >= 1 && wd <= 4 && !CLOSED.has(day)) workdays++;
  }
  return minutes / (workdays * 600 * partners.length);
}

// ---------- venues ----------

const VENUES: Record<string, { hotels: [string, number, string][]; restaurants: [string, number, string][] }> = {
  "Denver, CO": {
    hotels: [
      ["The Brown Palace Hotel", 0.3, "Historic, walkable to the office, partners have stayed before"],
      ["Hotel Teatro", 0.6, "Quiet boutique near the theater district"],
      ["Four Seasons Denver", 0.5, "Larger rooms, good for early calls"],
    ],
    restaurants: [
      ["Guard and Grace", 0.2, "Steakhouse with a private dining room for ten"],
      ["Tavernetta", 0.9, "Italian, near Union Station, lively but not loud"],
      ["Rioja", 0.8, "Larimer Square, seats a full board comfortably"],
    ],
  },
  "Nashville, TN": {
    hotels: [
      ["The Hermitage Hotel", 0.3, "Classic, two blocks from the office"],
      ["Grand Hyatt Nashville", 1.2, "Newer, near the convention center"],
      ["The Joseph", 0.5, "Boutique, quiet rooms, good breakfast"],
    ],
    restaurants: [
      ["Kayne Prime", 1.0, "Steakhouse in the Gulch with a private room"],
      ["Etch", 0.4, "Downtown, chef-driven, easy for a group"],
      ["Husk Nashville", 0.9, "Southern, converted house, private upstairs"],
    ],
  },
  "Charlotte, NC": {
    hotels: [
      ["The Ritz-Carlton Charlotte", 0.2, "Attached to the office tower district"],
      ["Kimpton Tryon Park", 0.3, "Uptown, rooftop for a pre-dinner drink"],
      ["Grand Bohemian Charlotte", 0.4, "Newer, quieter, art-filled"],
    ],
    restaurants: [
      ["The Capital Grille", 0.2, "Reliable, private room seats twelve"],
      ["Fahrenheit", 0.5, "Rooftop with a skyline view, ask for the enclosed side"],
      ["Angeline's", 0.3, "Italian inside the Kimpton, easy for late arrivals"],
    ],
  },
  "Phoenix, AZ": {
    hotels: [
      ["The Westin Downtown Phoenix", 0.3, "Closest to the office, simple and reliable"],
      ["Kimpton Hotel Palomar Phoenix", 0.4, "CityScape, walkable to dinner"],
      ["Arizona Biltmore", 6.5, "Resort, better for a longer stay, needs a car"],
    ],
    restaurants: [
      ["Durant's", 1.5, "Old Phoenix steakhouse, private booths, a partner favorite"],
      ["The Arrogant Butcher", 0.4, "Downtown, casual, good for a mixed group"],
      ["Bitter and Twisted", 0.5, "Lively cocktail spot, better for drinks than a board dinner"],
    ],
  },
  "Boston, MA": {
    hotels: [
      ["Boston Harbor Hotel", 0.5, "Waterfront, quiet, partners know it"],
      ["The Langham Boston", 0.4, "Financial district, two blocks from the office"],
      ["InterContinental Boston", 0.6, "Larger, easy for late check-in"],
    ],
    restaurants: [
      ["Grill 23 and Bar", 1.0, "Back Bay steakhouse with a private dining room"],
      ["Mooo....", 0.9, "Beacon Hill, wine cellar room for a private dinner"],
      ["Row 34", 0.7, "Seafood in Fort Point, good for a relaxed evening"],
    ],
  },
};

function generateVenues(): Venue[] {
  const out: Venue[] = [];
  let n = 1;
  for (const [city, v] of Object.entries(VENUES)) {
    for (const [name, distanceMi, note] of v.hotels) out.push({ id: `v${n++}`, city, type: "hotel", name, distanceMi, note });
    for (const [name, distanceMi, note] of v.restaurants) out.push({ id: `v${n++}`, city, type: "restaurant", name, distanceMi, note });
  }
  return out;
}

// ---------- main ----------

function main() {
  let result: { blocks: AvailabilityBlock[]; report: string[]; seed: number } | null = null;
  for (let seed = 1; seed <= 200; seed++) {
    const rng = mulberry32(seed);
    try {
      const base = generateAvailability(rng, partners as Partner[]);
      const carved = carveThinQuarters(base);
      const { ok, report } = verify(carved);
      if (ok) {
        result = { blocks: carved, report, seed };
        break;
      }
      if (process.env.DEBUG) console.warn(`seed ${seed} rejected:\n  ${report.join("\n  ")}`);
    } catch (e) {
      if (process.env.DEBUG) console.warn(`seed ${seed}: ${(e as Error).message}`);
    }
  }
  if (!result) throw new Error("No seed satisfied the fixture rules. Loosen MIN_NORMAL or the openness mix.");

  writeFileSync(resolve(ROOT, "data/availability.json"), JSON.stringify(result.blocks, null, 0) + "\n");
  writeFileSync(resolve(ROOT, "data/venues.json"), JSON.stringify(generateVenues(), null, 2) + "\n");

  console.log(`seed ${result.seed}, ${result.blocks.length} free blocks, free fraction ${(freeFraction(result.blocks) * 100).toFixed(0)}%`);
  console.log("windows per quarter (* = thin by design)");
  for (const line of result.report) console.log("  " + line);
  const cities = (portcos as PortcoSeed[]).map((p) => p.city).filter((c) => !VENUES[c]);
  if (cities.length) console.warn(`No venues for: ${cities.join(", ")}. Add them to VENUES in scripts/gen-fixtures.ts.`);
}

main();
