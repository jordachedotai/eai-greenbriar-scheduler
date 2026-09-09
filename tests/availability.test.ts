// The seeded availability generator runs in lib so a company added in
// Settings with roster people, who have no fixture calendar, still finds dates.

import { describe, expect, it } from "vitest";
import { ensureAvailability, generatePersonAvailability, seedFrom } from "@/lib/availabilityGen";
import { getAvailability, getBoardMembers, getPartners, getVenues, hydratePortco, personName } from "@/lib/data";
import * as T from "@/lib/transitions";
import type { BoardMember, PortcoSeed } from "@/lib/types";

describe("availability generator", () => {
  it("is deterministic per person and lands near 40 percent free", () => {
    const a = generatePersonAvailability("tucker-catlin");
    const b = generatePersonAvailability("tucker-catlin");
    expect(a).toEqual(b);
    expect(seedFrom("tucker-catlin")).not.toBe(seedFrom("claire-ponnaiya"));
    let minutes = 0;
    for (const x of a) minutes += (Number(x.end.slice(11, 13)) - Number(x.start.slice(11, 13))) * 60;
    const free = minutes / (190 * 600);
    expect(free).toBeGreaterThan(0.3);
    expect(free).toBeLessThan(0.55);
  });

  it("adds blocks only for people who have none", () => {
    const base = getAvailability();
    const out = ensureAvailability(base, ["michael-wang", "tucker-catlin"]);
    expect(out.filter((b) => b.personId === "michael-wang").length).toBe(base.filter((b) => b.personId === "michael-wang").length);
    expect(out.filter((b) => b.personId === "tucker-catlin").length).toBeGreaterThan(50);
  });

  it("a new company with three roster people finds windows in every quarter", () => {
    const seed: PortcoSeed = {
      id: "northgate-industrial",
      name: "Northgate Industrial",
      city: "Columbus, OH",
      officeAddress: "100 Main Street, Columbus, OH",
      partnerIds: ["tucker-catlin", "claire-ponnaiya", "anay-saraf"],
      execContact: { name: "Dana Whitfield", title: "Chief Executive Officer" },
      targetQuarters: ["Q1", "Q2", "Q3", "Q4"],
      eaId: "ea1",
    };
    const board: BoardMember[] = [{ id: "northgate-industrial-b1", name: "Ora Lind", portcoId: seed.id, role: "Board Chair", calendarVisible: false }];
    let t = Date.parse("2026-09-10T13:00:00Z");
    const deps: T.Deps = {
      partners: getPartners(),
      boardMembers: getBoardMembers(),
      availability: getAvailability(),
      venues: getVenues(),
      name: personName,
      now: () => new Date((t += 60_000)).toISOString(),
    };
    const p = T.findDates({ ...hydratePortco(seed), boardMembers: board }, deps);
    for (const q of p.targetQuarters) {
      expect(p.quarters[q].windows.length).toBeGreaterThan(0);
      expect(p.quarters[q].shortlist.length).toBeGreaterThan(0);
      expect(p.quarters[q].shortlist[0].attendeesUnknown).toEqual(["northgate-industrial-b1"]);
    }
    // Roster people resolve by name, and a city with no fixture venues gets a generic set.
    expect(p.log[0].text).toContain("Tucker Catlin");
    expect(getVenues("Columbus, OH").length).toBeGreaterThan(0);
    expect(getVenues("Nowhere, ZZ").filter((v) => v.type === "hotel").length).toBe(3);
  });
});
