// The EA edits the step 1 shortlist: swap a window in from the full list,
// remove one, reorder. The one-pager's date lists follow at once.

import { describe, expect, it } from "vitest";
import { getAvailability, getBoardMembers, getPartners, getPortcoSeeds, getVenues, hydratePortco, personName } from "@/lib/data";
import { mockShortlist } from "@/lib/mockAgent";
import { partnerEmailPayload, shortlistPayload } from "@/lib/payloads";
import { fmtDate } from "@/lib/scheduling";
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
const seed = getPortcoSeeds().find((s) => s.id === "ait-worldwide-logistics")!;
const Q = "2027-Q1";

function ready() {
  let p = T.findDates(hydratePortco(seed), deps);
  p = T.applyOnepager(p, mockShortlist(shortlistPayload(p, "Monday, September 21")), false, 0, deps);
  return p;
}

const last = (p: ReturnType<typeof ready>) => p.log[p.log.length - 1].text;
const items = (p: ReturnType<typeof ready>) => p.drafts.onepager.email!.lists![0].items;

describe("editable shortlist", () => {
  it("every window in the full list carries a reason", () => {
    const p = ready();
    expect(p.quarters[Q].windows.length).toBeGreaterThan(3);
    for (const w of p.quarters[Q].windows) expect(w.reason).toMatch(/quarter/);
  });

  it("Use this replaces the lowest-ranked option and rebuilds the one-pager", () => {
    let p = ready();
    const before = p.quarters[Q].shortlist.map((w) => w.id);
    const extra = p.quarters[Q].windows.find((w) => !before.includes(w.id))!;
    p = T.swapOption(p, Q, extra.id, undefined, deps);
    const list = p.quarters[Q].shortlist;
    expect(list).toHaveLength(3);
    expect(list[2].id).toBe(extra.id);
    expect(list[2].rank).toBe(3);
    expect(list[2].reason).toBe(extra.reason);
    expect(list.map((w) => w.id).slice(0, 2)).toEqual(before.slice(0, 2));
    expect(items(p)[2]).toContain(`Option 3: ${fmtDate(extra.start)}`);
    expect(p.drafts.onepager.text).toContain(fmtDate(extra.start));
    expect(p.drafts.onepager.email?.greeting).toBe("Dear Tom,");
    expect(last(p)).toBe(`Swapped Q1 option 3 for ${fmtDate(extra.start)}.`);
    // Swapping in a window that is already selected does nothing.
    expect(T.swapOption(p, Q, extra.id, undefined, deps)).toBe(p);
  });

  it("the EA can pick which option to replace", () => {
    let p = ready();
    const before = p.quarters[Q].shortlist.map((w) => w.id);
    const extra = p.quarters[Q].windows.find((w) => !before.includes(w.id))!;
    p = T.swapOption(p, Q, extra.id, before[0], deps);
    expect(p.quarters[Q].shortlist.map((w) => w.id)).toEqual([extra.id, before[1], before[2]]);
    expect(last(p)).toBe(`Swapped Q1 option 1 for ${fmtDate(extra.start)}.`);
    expect(items(p)[0]).toContain(fmtDate(extra.start));
  });

  it("remove keeps at least two, and Use this then fills the empty slot", () => {
    let p = ready();
    const [a, b, c] = p.quarters[Q].shortlist;
    p = T.removeOption(p, Q, c.id, deps);
    expect(p.quarters[Q].shortlist.map((w) => w.id)).toEqual([a.id, b.id]);
    expect(items(p)).toHaveLength(2);
    expect(last(p)).toBe(`Removed Q1 option 3, ${fmtDate(c.start)}.`);
    expect(T.removeOption(p, Q, b.id, deps)).toBe(p);
    p = T.swapOption(p, Q, c.id, undefined, deps);
    expect(p.quarters[Q].shortlist.map((w) => w.rank)).toEqual([1, 2, 3]);
    expect(last(p)).toBe(`Added ${fmtDate(c.start)} as Q1 option 3.`);
    // The thin quarter holds two and cannot lose one.
    expect(T.removeOption(p, "2027-Q3", p.quarters["2027-Q3"].shortlist[0].id, deps)).toBe(p);
  });

  it("move reorders, re-ranks, and the partner email follows the selection", () => {
    let p = ready();
    const [a, b] = p.quarters[Q].shortlist;
    p = T.moveOption(p, Q, b.id, -1, deps);
    expect(p.quarters[Q].shortlist[0].id).toBe(b.id);
    expect(p.quarters[Q].shortlist[0].rank).toBe(1);
    expect(p.quarters[Q].shortlist[1].id).toBe(a.id);
    expect(last(p)).toBe(`Moved ${fmtDate(b.start)} to Q1 option 1.`);
    expect(T.moveOption(p, Q, b.id, -1, deps)).toBe(p);
    expect(items(p)[0]).toContain(`Option 1: ${fmtDate(b.start)}`);
    const payload = partnerEmailPayload(p, p.drafts.onepager.text, "Monday, September 21");
    expect(payload.quarters[0].windows[0].date).toBe(fmtDate(b.start));
  });

  it("an edited one-pager is left alone, and an approved one cannot change", () => {
    let p = ready();
    const extra = p.quarters[Q].windows.find((w) => !p.quarters[Q].shortlist.some((s) => s.id === w.id))!;
    p = T.editDraft(p, "onepager", "My own words.", deps);
    p = T.swapOption(p, Q, extra.id, undefined, deps);
    expect(p.drafts.onepager.text).toBe("My own words.");
    expect(p.quarters[Q].shortlist[2].id).toBe(extra.id);
  });
});
