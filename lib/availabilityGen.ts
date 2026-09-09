// Seeded availability generator. Runs at build time (scripts/gen-fixtures.ts)
// and in the browser for people who have no fixture blocks, such as a roster
// member added to a company in Settings. Same seed, same output.

import { addDays, toIso, weekdayOf } from "./scheduling";
import type { AvailabilityBlock } from "./types";

export const YEAR = 2027;

// US holidays and slow weeks in 2027, skipped for everyone.
export const CLOSED = new Set([
  "2027-01-04", "2027-01-05", "2027-01-06", "2027-01-07",
  "2027-01-18", "2027-02-15", "2027-05-31", "2027-07-05", "2027-09-06",
  "2027-11-24", "2027-11-25",
  "2027-12-20", "2027-12-21", "2027-12-22", "2027-12-23",
  "2027-12-27", "2027-12-28", "2027-12-29", "2027-12-30",
]);

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(text: string): number {
  let n = 7;
  for (const ch of text) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n || 1;
}

// Each weekday gets an openness level. People are free on a half day with
// that probability. Weighted so the yearly average lands near 40 percent.
export function dayOpenness(rng: Rng, month: number): number {
  const r = rng();
  if (month === 7 || month === 8) {
    if (r < 0.45) return 0.15;
    if (r < 0.8) return 0.4;
    return 0.75;
  }
  if (r < 0.3) return 0.15;
  if (r < 0.65) return 0.4;
  return 0.8;
}

// Free blocks for a set of people, one shared day-openness draw per day so
// open days line up across the firm. Blocks are 8am to 6pm, Mon to Thu.
export function generateAvailability(personIds: string[], seed: number, year = YEAR): AvailabilityBlock[] {
  const rng = mulberry32(seed);
  const blocks: AvailabilityBlock[] = [];
  for (let day = `${year}-01-01`; day <= `${year}-12-31`; day = addDays(day, 1)) {
    const wd = weekdayOf(day);
    if (wd === 0 || wd === 5 || wd === 6) continue;
    if (CLOSED.has(day)) continue;
    const [y, m, d] = day.split("-").map(Number);
    const open = dayOpenness(rng, m);
    for (const id of personIds) {
      const morning = rng() < open;
      const afternoon = rng() < open;
      if (morning && afternoon) blocks.push({ personId: id, start: toIso(y, m, d, 8), end: toIso(y, m, d, 18) });
      else if (morning) blocks.push({ personId: id, start: toIso(y, m, d, 8), end: toIso(y, m, d, 13) });
      else if (afternoon) blocks.push({ personId: id, start: toIso(y, m, d, 13), end: toIso(y, m, d, 18) });
    }
  }
  return blocks;
}

// One person's blocks, seeded from their id, so a roster member gets the
// same calendar every time without a rebuild.
export function generatePersonAvailability(personId: string, year = YEAR): AvailabilityBlock[] {
  return generateAvailability([personId], seedFrom(personId), year);
}

// The fixture plus generated blocks for anyone in `ids` who has none.
const cache = new Map<string, AvailabilityBlock[]>();
export function ensureAvailability(availability: AvailabilityBlock[], ids: string[]): AvailabilityBlock[] {
  const have = new Set(availability.map((b) => b.personId));
  const missing = ids.filter((id) => !have.has(id));
  if (missing.length === 0) return availability;
  let out = availability;
  for (const id of missing) {
    let blocks = cache.get(id);
    if (!blocks) {
      blocks = generatePersonAvailability(id);
      cache.set(id, blocks);
    }
    out = out.concat(blocks);
  }
  return out;
}
