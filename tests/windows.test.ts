// Planning windows: a two-quarter window and one that spans 2026 into 2027.

import { describe, expect, it } from "vitest";
import { getAvailability, getBoardMembers, getPartners, getPortcoSeeds, getVenues, hydratePortco, personName } from "@/lib/data";
import { defaultWindow, nextQuarter, quarterLabel, quarterLong, quarterMonths, spansYears, windowQuarters } from "@/lib/quarters";
import { yearOfQuarter } from "@/lib/scheduling";
import { workCounts } from "@/lib/pipeline";
import { conflictQuarter, simulatedPicks } from "@/lib/simulate";
import * as T from "@/lib/transitions";

let t = Date.parse("2026-09-10T13:00:00Z");
const deps: T.Deps = {
  partners: getPartners(),
  boardMembers: getBoardMembers(),
  availability: getAvailability(),
  venues: getVenues(),
  name: personName,
  now: () => new Date((t += 60_000)).toISOString(),
};

describe("quarter keys and labels", () => {
  it("walks quarters across a year end", () => {
    expect(nextQuarter("2026-Q4")).toBe("2027-Q1");
    expect(windowQuarters({ startQuarter: "2026-Q4", quarterCount: 4 })).toEqual(["2026-Q4", "2027-Q1", "2027-Q2", "2027-Q3"]);
    expect(windowQuarters({ startQuarter: "2027-Q1", quarterCount: 9 })).toHaveLength(8);
  });
  it("labels drop the year inside one year and add it across two", () => {
    const one = windowQuarters({ startQuarter: "2027-Q1", quarterCount: 4 });
    const two = windowQuarters({ startQuarter: "2026-Q4", quarterCount: 4 });
    expect(spansYears(one)).toBe(false);
    expect(quarterLabel("2027-Q3", one)).toBe("Q3");
    expect(spansYears(two)).toBe(true);
    expect(quarterLabel("2026-Q4", two)).toBe("Q4 '26");
    expect(quarterLabel("2027-Q1", two)).toBe("Q1 '27");
    expect(quarterLong("2026-Q4")).toBe("Q4 2026");
    expect(quarterMonths("2026-Q4")).toBe("October to December 2026");
  });
  it("defaults to the quarter after the last locked meeting, or the next quarter", () => {
    const today = new Date("2026-09-09T12:00:00");
    expect(defaultWindow([], 4, today)).toEqual({ startQuarter: "2026-Q4", quarterCount: 4 });
    expect(defaultWindow(["2027-Q1", "2027-Q4"], 4, today).startQuarter).toBe("2028-Q1");
  });
});

describe("a two-quarter window", () => {
  const seed = getPortcoSeeds().find((s) => s.id === "sunvair-aerospace-group")!;
  const members = getBoardMembers(seed.id);
  let p = T.setWindow(hydratePortco(seed), { startQuarter: "2027-Q1", quarterCount: 2 }, deps);

  it("finds dates for exactly two quarters and counts two meetings", () => {
    expect(p.targetQuarters).toEqual(["2027-Q1", "2027-Q2"]);
    p = T.findDates(p, deps);
    expect(Object.keys(p.quarters)).toEqual(["2027-Q1", "2027-Q2"]);
    expect(p.quarters["2027-Q1"].shortlist.length).toBeGreaterThan(0);
    expect(workCounts([p], () => members).total).toBe(2);
    // No thin quarter, so the conflict falls on the last quarter of the window.
    expect(conflictQuarter(p)).toBe("2027-Q2");
    const picks = simulatedPicks(p);
    expect(Object.keys(picks)).toEqual(["2027-Q1", "2027-Q2"]);
  });
});

describe("a window spanning 2026 into 2027", () => {
  const seed = getPortcoSeeds().find((s) => s.id === "the-facilities-group")!;
  const members = getBoardMembers(seed.id);
  let p = T.setWindow(hydratePortco(seed), { startQuarter: "2026-Q4", quarterCount: 4 }, deps);

  it("generates 2026 availability on demand and finds windows in both years", () => {
    p = T.findDates(p, deps);
    expect(p.targetQuarters[0]).toBe("2026-Q4");
    for (const q of p.targetQuarters) {
      expect(p.quarters[q].windows.length).toBeGreaterThan(0);
      for (const w of p.quarters[q].windows) expect(w.start.startsWith(String(yearOfQuarter(q)))).toBe(true);
    }
    expect(p.log.at(-1)?.text).toContain("Q4 '26:");
    expect(p.log.at(-1)?.text).toContain("Q1 '27:");
  });

  it("carries the year through picks, the board email, the invites, and the count", () => {
    p = T.recordPortcoPicks(p, simulatedPicks(p), deps);
    expect(p.log.at(-1)?.text).toContain("Q4 '26 ");
    expect(workCounts([p], () => members).total).toBe(4);
    expect(p.quarters["2026-Q4"].portcoPick).toBeTruthy();
    const invites = T.buildInvites({ ...p, quarters: Object.fromEntries(Object.entries(p.quarters).map(([q, qs]) => [q, { ...qs, logistics: { hotel: getVenues(seed.city)[0], restaurant: getVenues(seed.city)[3], reason: "" } }])) }, deps);
    expect(invites[0].title).toContain("Q4 2026");
    expect(invites[0].start.startsWith("2026")).toBe(true);
  });
});
