import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  findWindows,
  intersectIntervals,
  mergeIntervals,
  nextBestWindow,
  pickStart,
  rankWindows,
  reverifyWindow,
  quarterDayRange,
  weekdayOf,
} from "@/lib/scheduling";
import type { AvailabilityBlock, BoardMember, Partner, PortcoSeed, Window } from "@/lib/types";

const partners: Partner[] = [
  { id: "p1", name: "A", title: "Partner", homeCity: "X" },
  { id: "p2", name: "B", title: "Partner", homeCity: "X" },
];

const board: BoardMember[] = [
  { id: "b1", name: "Board One", portcoId: "pc", role: "Chair", calendarVisible: false },
];

const portco: PortcoSeed = {
  id: "pc",
  name: "Test Co",
  city: "Denver, CO",
  officeAddress: "1 Main St",
  partnerIds: ["p1", "p2"],
  execContact: { name: "E", title: "CEO" },
  startQuarter: "2027-Q1",
  quarterCount: 1,
  targetQuarters: ["2027-Q1"],
  eaId: "ea1",
};

function block(personId: string, day: string, h1: number, h2: number): AvailabilityBlock {
  return { personId, start: `${day}T${String(h1).padStart(2, "0")}:00:00`, end: `${day}T${String(h2).padStart(2, "0")}:00:00` };
}

describe("date helpers", () => {
  it("knows weekdays", () => {
    expect(weekdayOf("2027-01-04")).toBe(1); // Monday
    expect(weekdayOf("2027-01-08")).toBe(5); // Friday
  });
  it("adds days across month ends", () => {
    expect(addDays("2027-01-31", 1)).toBe("2027-02-01");
    expect(daysBetween("2027-01-01", "2027-03-31")).toBe(89);
  });
  it("gives quarter ranges", () => {
    expect(quarterDayRange("2027-Q2")).toEqual({ first: "2027-04-01", last: "2027-06-30" });
    expect(quarterDayRange("2026-Q4")).toEqual({ first: "2026-10-01", last: "2026-12-31" });
  });
});

describe("intervals", () => {
  it("merges overlapping intervals", () => {
    expect(mergeIntervals([{ start: 0, end: 10 }, { start: 5, end: 20 }, { start: 30, end: 40 }])).toEqual([
      { start: 0, end: 20 },
      { start: 30, end: 40 },
    ]);
  });
  it("intersects", () => {
    expect(intersectIntervals([{ start: 0, end: 10 }], [{ start: 5, end: 20 }])).toEqual([{ start: 5, end: 10 }]);
    expect(intersectIntervals([{ start: 0, end: 5 }], [{ start: 5, end: 20 }])).toEqual([]);
  });
  it("picks a start near 10am inside the feasible range", () => {
    expect(pickStart(8 * 60, 18 * 60)).toBe(10 * 60);
    expect(pickStart(13 * 60, 18 * 60)).toBe(13 * 60);
    expect(pickStart(8 * 60, 11 * 60)).toBe(-1);
    expect(pickStart(8 * 60, 11 * 60, 10, 3)).toBe(8 * 60); // a 3-hour block fits
  });

  it("honors the block length and dinner time", () => {
    const availability = [block("p1", "2027-02-09", 8, 18), block("p2", "2027-02-09", 8, 18)];
    const res = findWindows({ portco: { ...portco, blockHours: 5, dinnerTime: "19:00" }, partners, boardMembers: board, availability });
    const w = res["2027-Q1"].windows[0];
    expect(w.start).toBe("2027-02-09T10:00:00");
    expect(w.end).toBe("2027-02-09T15:00:00");
    expect(w.dinnerStart).toBe("2027-02-09T19:00:00");
  });
});

describe("findWindows", () => {
  it("finds a 4-hour block only where every partner is free", () => {
    const availability = [
      block("p1", "2027-02-09", 8, 18), // Tue
      block("p2", "2027-02-09", 9, 14),
      block("p1", "2027-02-10", 8, 12), // Wed, p2 busy
      block("p1", "2027-02-11", 8, 18), // Thu
      block("p2", "2027-02-11", 8, 11), // only 3 hours
    ];
    const res = findWindows({ portco, partners, boardMembers: board, availability });
    expect(res["2027-Q1"].windows).toHaveLength(1);
    const w = res["2027-Q1"].windows[0];
    expect(w.start).toBe("2027-02-09T10:00:00");
    expect(w.end).toBe("2027-02-09T14:00:00");
    expect(w.attendeesFree).toEqual(["p1", "p2"]);
    expect(w.attendeesUnknown).toEqual(["b1"]);
    expect(w.dinnerStart).toBe("2027-02-09T18:30:00");
    expect(res["2027-Q1"].thin).toBe(true);
  });

  it("skips Fridays and weekends", () => {
    const availability = [block("p1", "2027-02-12", 8, 18), block("p2", "2027-02-12", 8, 18)];
    const res = findWindows({ portco, partners, boardMembers: board, availability });
    expect(res["2027-Q1"].windows).toHaveLength(0);
  });

  it("emits two windows when morning and afternoon are split", () => {
    const availability = [
      block("p1", "2027-02-09", 8, 12),
      block("p1", "2027-02-09", 13, 18),
      block("p2", "2027-02-09", 8, 18),
    ];
    const res = findWindows({ portco, partners, boardMembers: board, availability });
    expect(res["2027-Q1"].windows.map((w) => w.start)).toEqual(["2027-02-09T08:00:00", "2027-02-09T13:00:00"]);
  });
});

describe("rankWindows", () => {
  function w(id: string, start: string): Window {
    const end = start.replace(/T(\d\d)/, (_, h) => `T${String(Number(h) + 4).padStart(2, "0")}`);
    return { id, quarter: "2027-Q1", start, end, attendeesFree: [], attendeesUnknown: [], dinnerStart: "" };
  }
  it("prefers mid-week, 10am, and the middle of the quarter", () => {
    const list = [
      w("mon-early", "2027-01-11T08:00:00"),
      w("wed-mid", "2027-02-17T10:00:00"),
      w("thu-late", "2027-03-25T14:00:00"),
      w("tue-mid", "2027-02-16T10:00:00"),
    ];
    const ranked = rankWindows(list);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].rank).toBe(1);
    expect(["wed-mid", "tue-mid"]).toContain(ranked[0].id);
    expect(ranked.map((r) => r.id)).not.toContain("thu-late");
  });
});

describe("conflict fallback", () => {
  it("returns the next ranked window", () => {
    const shortlist: Window[] = [1, 2, 3].map((r) => ({
      id: `w${r}`, quarter: "2027-Q3", start: "", end: "", attendeesFree: [], attendeesUnknown: [], dinnerStart: "", rank: r as 1 | 2 | 3,
    }));
    expect(nextBestWindow(shortlist, "w1")?.id).toBe("w2");
    expect(nextBestWindow(shortlist, "w3")).toBeNull();
  });

  it("re-verifies attendees against availability", () => {
    const win: Window = {
      id: "w", quarter: "2027-Q1", start: "2027-02-09T10:00:00", end: "2027-02-09T14:00:00",
      attendeesFree: ["p1", "p2"], attendeesUnknown: [], dinnerStart: "",
    };
    const availability = [block("p1", "2027-02-09", 8, 18), block("p2", "2027-02-09", 11, 18)];
    expect(reverifyWindow(win, ["p1", "p2"], availability)).toEqual({ ok: false, busy: ["p2"] });
    expect(reverifyWindow(win, ["p1"], availability).ok).toBe(true);
  });
});
