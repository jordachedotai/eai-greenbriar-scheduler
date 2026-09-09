// Regenerates data/availability.json and data/venues.json.
// Run: npm run gen:fixtures
// Deterministic: same seed, same output. Names files are never touched.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import partners from "../data/partners.json";
import portcos from "../data/portcos.json";
import boardMembers from "../data/board-members.json";
import type { AvailabilityBlock, BoardMember, Partner, PortcoSeed, Quarter, Venue } from "../lib/types";
import { addDays, dayKey, findWindows, rankWindows, weekdayOf } from "../lib/scheduling";
import { CLOSED, generateAvailability as generateBase, type Rng } from "../lib/availabilityGen";

const YEAR = 2027;
const ROOT = resolve(__dirname, "..");

// The walkthrough portco is thin in Q3: exactly two days when its partners
// are all free. Partners outside its set are made busy on those two days so
// no other portco lists them, which keeps the calendar free of pile-ups.
// No portco may have a partner set around or inside the walkthrough's, or
// its Q3 would be empty or collide with the walkthrough's two days.
const WALKTHROUGH = "ait-worldwide-logistics";
const THIN: Record<string, Quarter> = { [WALKTHROUGH]: "Q3" };
const THIN_COUNT = 2;
const MIN_NORMAL = 4;
// The walkthrough portco needs headroom: in the council state other portcos
// that share its partners already hold days, and it must still offer three
// options per quarter.
const WALK_MIN = 8;

function generateAvailability(seed: number, partnerList: Partner[]): AvailabilityBlock[] {
  return generateBase(partnerList.map((p) => p.id), seed, YEAR);
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
    // Partners not on this portco are busy on its thin days.
    for (const w of windows) {
      for (const partner of partners as Partner[]) {
        if (!portco.partnerIds.includes(partner.id)) out = removeDay(out, partner.id, dayKey(w.start));
      }
    }
  }
  return out;
}

function verify(blocks: AvailabilityBlock[]): { ok: boolean; report: string[] } {
  const report: string[] = [];
  let ok = true;
  const walk = (portcos as PortcoSeed[]).find((p) => p.id === WALKTHROUGH)!;
  for (const portco of portcos as PortcoSeed[]) {
    const inside = portco.id !== WALKTHROUGH && portco.partnerIds.every((id) => walk.partnerIds.includes(id));
    const around = portco.id !== WALKTHROUGH && walk.partnerIds.every((id) => portco.partnerIds.includes(id));
    if (inside || around) {
      report.push(`${portco.id} has a partner set ${inside ? "inside" : "around"} the walkthrough portco's set. Its Q3 would collide or be empty.`);
      ok = false;
    }
    const res = findWindows({ portco, partners: partners as Partner[], boardMembers: boardMembers as BoardMember[], availability: blocks, year: YEAR });
    const counts = portco.targetQuarters.map((q) => {
      const n = res[q].windows.length;
      const floor = portco.id === WALKTHROUGH ? WALK_MIN : MIN_NORMAL;
      const want = THIN[portco.id] === q ? n === THIN_COUNT : n >= floor;
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
  "Austin, TX": {
    hotels: [
      ["The Driskill", 0.4, "Historic, on Sixth Street, two blocks from the office"],
      ["Four Seasons Austin", 0.6, "Quiet, on the lake, easy for early calls"],
      ["Hotel Van Zandt", 0.9, "Rainey Street, lively, better for a younger group"],
    ],
    restaurants: [
      ["Jeffrey's", 1.8, "Clarksville, private room, a long-time partner favorite"],
      ["Red Ash", 0.3, "Italian steakhouse downtown, seats a board easily"],
      ["Uchi", 2.1, "Sushi, excellent but loud, better for a smaller group"],
    ],
  },
  "Minneapolis, MN": {
    hotels: [
      ["Four Seasons Minneapolis", 0.5, "Newer, quiet, skyway connected for winter"],
      ["Hotel Ivy", 0.3, "Downtown, walkable to the office through the skyway"],
      ["The Hewing Hotel", 0.9, "North Loop, converted warehouse, good bar"],
    ],
    restaurants: [
      ["Manny's Steakhouse", 0.4, "Classic steakhouse with private dining, reliable in any season"],
      ["Spoon and Stable", 0.9, "North Loop, chef-driven, private room seats twelve"],
      ["Murray's", 0.3, "Old Minneapolis, quiet, good for conversation"],
    ],
  },
  "Atlanta, GA": {
    hotels: [
      ["Four Seasons Atlanta", 0.4, "Midtown, steps from the office, quiet rooms"],
      ["Loews Atlanta", 0.6, "Midtown, larger, easy for late check-in"],
      ["The St. Regis Atlanta", 3.2, "Buckhead, upscale, needs a car"],
    ],
    restaurants: [
      ["South City Kitchen Midtown", 0.5, "Southern, private room, easy walk"],
      ["Bones", 3.4, "Buckhead steakhouse, partners know it, private rooms"],
      ["Ecco Midtown", 0.3, "Mediterranean, relaxed, good for a mixed group"],
    ],
  },
  "Salt Lake City, UT": {
    hotels: [
      ["The Grand America Hotel", 0.6, "Largest rooms in the city, quiet, reliable"],
      ["Hotel Monaco Salt Lake City", 0.2, "Boutique, on Main Street, walkable"],
      ["Le Meridien Salt Lake City", 0.5, "Newer, near the arena, simple"],
    ],
    restaurants: [
      ["Bambara", 0.2, "Inside the Monaco, private room, easy after a long day"],
      ["Log Haven", 8.5, "Canyon setting, memorable, needs cars and time"],
      ["Current Fish and Oyster", 0.7, "Seafood, lively, seats a group"],
    ],
  },
  "Pittsburgh, PA": {
    hotels: [
      ["Fairmont Pittsburgh", 0.2, "Attached to the office district, quiet"],
      ["Kimpton Hotel Monaco Pittsburgh", 0.3, "Downtown, walkable, good breakfast"],
      ["Omni William Penn", 0.4, "Historic, large, reliable for groups"],
    ],
    restaurants: [
      ["Eddie V's", 0.3, "Steak and seafood, private room, downtown"],
      ["Altius", 2.6, "Mount Washington, city view, needs a car"],
      ["Or, The Whale", 0.3, "Inside the Distrikt Hotel, relaxed, good for a group"],
    ],
  },
  "Tampa, FL": {
    hotels: [
      ["Tampa Marriott Water Street", 0.5, "Large, on the water, easy logistics"],
      ["The Tampa EDITION", 0.6, "Newer, quiet, good rooftop for a drink"],
      ["Le Meridien Tampa", 0.4, "Converted courthouse, boutique, walkable"],
    ],
    restaurants: [
      ["Bern's Steak House", 3.5, "The Tampa institution, private rooms, book early"],
      ["Ulele", 1.4, "Riverfront, lively, good for a mixed group"],
      ["Oystercatchers", 6.8, "Waterfront seafood, better for a relaxed evening, needs a car"],
    ],
  },
  "Kansas City, MO": {
    hotels: [
      ["Loews Kansas City", 0.3, "Newer, near the convention center, quiet"],
      ["Hotel Kansas City", 0.5, "Converted club, boutique, good bar"],
      ["The Fontaine", 4.0, "Plaza area, upscale, needs a car"],
    ],
    restaurants: [
      ["Pierpont's at Union Station", 1.2, "Classic, private rooms, partners have been before"],
      ["The Antler Room", 2.5, "Small and chef-driven, better for a small group"],
      ["Jack Stack Barbecue Freight House", 1.3, "Kansas City barbecue, private room, a crowd pleaser"],
    ],
  },
  "Columbus, OH": {
    hotels: [
      ["Hotel LeVeque", 0.2, "Historic tower, walkable to the office"],
      ["Le Meridien Columbus, The Joseph", 1.0, "Short North, art-filled, good restaurant"],
      ["Hilton Columbus Downtown", 0.6, "Large, reliable, near the convention center"],
    ],
    restaurants: [
      ["The Guild House", 1.0, "Short North, private room, chef-driven"],
      ["Lindey's", 1.3, "German Village, classic, quiet enough for a board"],
      ["Mitchell's Steakhouse Downtown", 0.2, "Steakhouse in a former bank, private rooms"],
    ],
  },
  "Portland, OR": {
    hotels: [
      ["The Heathman Hotel", 0.1, "Next door to the office, historic, quiet"],
      ["The Nines", 0.3, "Downtown, rooftop restaurant, larger rooms"],
      ["Sentinel", 0.4, "Boutique, walkable, good bar"],
    ],
    restaurants: [
      ["Headwaters at the Heathman", 0.1, "Seafood, private room, no travel after a long day"],
      ["Le Pigeon", 1.5, "Small and celebrated, better for a small group"],
      ["Departure", 0.3, "Rooftop at The Nines, city view, lively"],
    ],
  },
  "Raleigh, NC": {
    hotels: [
      ["The Longleaf Hotel", 0.8, "Boutique, quiet, near the office"],
      ["Raleigh Marriott City Center", 0.2, "Downtown, reliable, easy logistics"],
      ["Guest House Raleigh", 0.6, "Small and personal, good for a partner group"],
    ],
    restaurants: [
      ["Death and Taxes", 0.2, "Wood-fired, private room, downtown"],
      ["Second Empire", 0.4, "Historic house, quiet rooms, classic"],
      ["Poole's Diner", 0.3, "Southern, lively, better for a relaxed night"],
    ],
  },
  "Itasca, IL": {
    hotels: [
      ["Westin Chicago Northwest", 0.4, "Across the road from the office park, quiet, reliable"],
      ["Eaglewood Resort and Spa", 1.2, "Larger rooms, good for a longer stay"],
      ["Hyatt Place Itasca", 0.6, "Simple, near the Metra, easy for early flights out of O'Hare"],
    ],
    restaurants: [
      ["Gibsons Bar and Steakhouse Oak Brook", 6.5, "Classic Chicago steakhouse, private rooms, needs a car"],
      ["Reserve 22", 4.1, "Glen Ellyn, chef-driven, quiet enough for a board"],
      ["Aliano's Ristorante", 4.8, "Italian, family run, easy for a group"],
    ],
  },
  "Parkville, MO": {
    hotels: [
      ["Hotel Kansas City", 9.5, "Downtown, converted club, good bar, needs a car"],
      ["Loews Kansas City", 9.7, "Downtown, newer, quiet"],
      ["Argosy Casino Hotel", 4.2, "Riverside, closest to the office, simple"],
    ],
    restaurants: [
      ["Piropos", 1.8, "Argentine, Briarcliff Village, river view, private room"],
      ["Pierpont's at Union Station", 9.8, "Classic, private rooms, partners have been before"],
      ["Stone Canyon Pizza", 0.3, "Downtown Parkville, casual, better for lunch"],
    ],
  },
  "Henderson, NV": {
    hotels: [
      ["Green Valley Ranch Resort", 2.1, "Quiet, off the Strip, partners know it"],
      ["The Westin Lake Las Vegas", 8.4, "Resort, needs a car, better for a longer stay"],
      ["Hilton Garden Inn Henderson", 1.3, "Closest to the office, simple"],
    ],
    restaurants: [
      ["Hank's Fine Steaks", 2.1, "Inside Green Valley Ranch, private dining, a partner favorite"],
      ["Todd's Unique Dining", 3.0, "Local, chef-owned, quiet"],
      ["Bottiglia Cucina", 2.1, "Italian, lively, good for a mixed group"],
    ],
  },
  "Delaware, OH": {
    hotels: [
      ["Hilton Columbus at Easton", 16.0, "Easton, reliable, needs a car"],
      ["Le Meridien Columbus, The Joseph", 22.0, "Short North, boutique, good restaurant"],
      ["Hampton Inn Delaware", 1.0, "Closest to the office, simple"],
    ],
    restaurants: [
      ["Veritas", 22.0, "Downtown Columbus, tasting menu, private room, needs a car"],
      ["Lindey's", 23.0, "German Village, classic, quiet enough for a board"],
      ["Amato's Woodfired Pizza", 0.8, "Downtown Delaware, casual, better for lunch"],
    ],
  },
  "Chandler, AZ": {
    hotels: [
      ["Sheraton Grand at Wild Horse Pass", 6.5, "Resort, quiet, partners have stayed before"],
      ["Crowne Plaza Phoenix Chandler Golf Resort", 2.3, "Closer, simple, reliable"],
      ["Hilton Phoenix Chandler", 1.6, "Closest to the office"],
    ],
    restaurants: [
      ["Kai", 6.5, "Wild Horse Pass, tasting menu, memorable, book early"],
      ["The Keg Steakhouse and Bar Chandler", 2.0, "Steakhouse, private room, easy"],
      ["Sibley's West", 1.8, "Downtown Chandler, casual, better for a relaxed night"],
    ],
  },
  "Willingboro, NJ": {
    hotels: [
      ["Four Seasons Hotel Philadelphia", 21.0, "Center City, quiet, needs a car"],
      ["The Rittenhouse", 21.5, "Rittenhouse Square, classic, partners know it"],
      ["Courtyard Mount Laurel", 9.0, "Closest, simple, reliable"],
    ],
    restaurants: [
      ["Vetri Cucina", 21.0, "Philadelphia, tasting menu, private room, needs a car"],
      ["The Capital Grille Cherry Hill", 11.0, "Reliable, private room seats twelve"],
      ["Chick's Deli", 12.0, "Cherry Hill, casual, better for lunch"],
    ],
  },
  "Everett, WA": {
    hotels: [
      ["Hotel Indigo Seattle Everett Waterfront", 2.2, "On the water, quiet, good restaurant"],
      ["Delta Hotels Seattle Everett", 3.0, "Larger, reliable, near the highway"],
      ["Hampton Inn Seattle Everett", 1.0, "Closest to the office, simple"],
    ],
    restaurants: [
      ["Bluewater Distilling", 2.2, "Waterfront, private room, lively"],
      ["Anthony's HomePort Everett", 2.5, "Seafood on the marina, seats a group"],
      ["Emory's on Silver Lake", 5.5, "Lakeside, quiet, better for conversation"],
    ],
  },
  "Addison, IL": {
    hotels: [
      ["Westin Chicago Lombard", 3.5, "Yorktown Center, reliable, quiet"],
      ["Hyatt Regency Schaumburg", 9.0, "Larger, near the highway"],
      ["Hampton Inn Addison", 1.2, "Closest to the office, simple"],
    ],
    restaurants: [
      ["Gibsons Bar and Steakhouse Oak Brook", 5.0, "Classic Chicago steakhouse, private rooms"],
      ["Capri Ristorante Italiano", 2.4, "Italian, family run, easy for a group"],
      ["Harry Caray's Lombard", 3.6, "Steakhouse, private room, partners have been before"],
    ],
  },
  "Tucson, AZ": {
    hotels: [
      ["The Ritz-Carlton Dove Mountain", 20.0, "Resort, memorable, needs a car and time"],
      ["Hotel Congress", 5.2, "Downtown, historic, lively"],
      ["Marriott Tucson University Park", 4.0, "Reliable, near the university, simple"],
    ],
    restaurants: [
      ["Charro Steak and Del Rey", 5.0, "Downtown, steakhouse, private room"],
      ["The Parish", 6.5, "Southern, quiet, good for conversation"],
      ["El Charro Cafe", 5.3, "Tucson institution, lively, better for a relaxed night"],
    ],
  },
  "Valencia, CA": {
    hotels: [
      ["Hyatt Regency Valencia", 1.5, "Closest full-service hotel, quiet, reliable"],
      ["Courtyard Santa Clarita Valencia", 1.2, "Simple, near the office"],
      ["The Langham Huntington Pasadena", 32.0, "Pasadena, upscale, needs a car and time"],
    ],
    restaurants: [
      ["Salt Creek Grille Valencia", 1.4, "Steak and seafood, private room, easy"],
      ["Wolf Creek Restaurant", 2.0, "Brewery kitchen, casual, good for a mixed group"],
      ["The Old Town Junction", 3.5, "Newhall, chef-driven, quiet"],
    ],
  },
  "Plymouth Meeting, PA": {
    hotels: [
      ["Philadelphia Marriott West", 1.5, "Closest to the office, reliable"],
      ["Four Seasons Hotel Philadelphia", 15.0, "Center City, quiet, needs a car"],
      ["Sheraton Valley Forge", 7.5, "King of Prussia, larger, near the highway"],
    ],
    restaurants: [
      ["Redstone American Grill", 0.9, "Plymouth Meeting, private room, easy"],
      ["Bluefin Sushi", 2.5, "East Norriton, quiet, better for a small group"],
      ["Vetri Cucina", 15.0, "Philadelphia, tasting menu, memorable, needs a car"],
    ],
  },
  "New York, NY": {
    hotels: [
      ["The Langham New York, Fifth Avenue", 0.8, "Midtown, quiet, partners know it"],
      ["Park Hyatt New York", 1.4, "Near Central Park, large rooms"],
      ["Moxy NYC Chelsea", 0.6, "Closest, lively, better for a younger group"],
    ],
    restaurants: [
      ["Keens Steakhouse", 0.5, "Herald Square, private rooms, a New York classic"],
      ["The Modern", 1.2, "MoMA, private dining, memorable"],
      ["Cote", 1.0, "Korean steakhouse, lively, book early"],
    ],
  },
  "East Alton, IL": {
    hotels: [
      ["Four Seasons Hotel St. Louis", 21.0, "Downtown St. Louis, quiet, needs a car"],
      ["The Chase Park Plaza", 26.0, "Central West End, partners know it"],
      ["Holiday Inn Alton", 3.5, "Closest to the airport, simple"],
    ],
    restaurants: [
      ["Tony's", 21.0, "Downtown St. Louis, classic, private room"],
      ["Cinder House", 21.0, "Four Seasons rooftop, river view"],
      ["Gentelin's on Broadway", 4.0, "Alton, chef-owned, quiet"],
    ],
  },
  "Napa, CA": {
    hotels: [
      ["Andaz Napa", 0.5, "Downtown, walkable, good bar"],
      ["Archer Hotel Napa", 0.4, "Rooftop, quiet rooms, near dinner"],
      ["Meritage Resort and Spa", 4.0, "Resort, larger, better for a longer stay"],
    ],
    restaurants: [
      ["Angele", 0.6, "Riverfront, French, private room"],
      ["Charlie Palmer Steak Napa", 0.4, "Inside the Archer, steakhouse, easy"],
      ["Oenotri", 0.5, "Italian, downtown, lively but not loud"],
    ],
  },
  "Stockton, CA": {
    hotels: [
      ["University Plaza Waterfront Hotel", 2.5, "Downtown waterfront, closest full-service"],
      ["Hilton Stockton", 4.5, "Reliable, near the highway"],
      ["Wine and Roses Hotel Lodi", 14.0, "Lodi, boutique, memorable, needs a car"],
    ],
    restaurants: [
      ["Papapavlo's Bistro and Bar", 5.0, "Mediterranean, private room, easy"],
      ["Towne House Restaurant", 14.0, "Lodi, inside Wine and Roses, quiet"],
      ["Bud's Seafood Grille", 4.8, "Seafood, casual, seats a group"],
    ],
  },
  "Manchester, CT": {
    hotels: [
      ["Delamar West Hartford", 12.0, "Boutique, quiet, partners know it"],
      ["Marriott Hartford Downtown", 10.0, "Downtown, reliable, near dinner"],
      ["Hilton Garden Inn Glastonbury", 5.0, "Closest, simple"],
    ],
    restaurants: [
      ["Max Downtown", 10.0, "Hartford steakhouse, private room, a partner favorite"],
      ["Artisanal Burger Company", 0.8, "Manchester, casual, better for lunch"],
      ["Cavey's", 1.2, "Manchester, French downstairs and Italian upstairs, quiet"],
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
  for (let seed = 1; seed <= 600; seed++) {
    try {
      const base = generateAvailability(seed, partners as Partner[]);
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
