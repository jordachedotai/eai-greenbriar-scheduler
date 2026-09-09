// The five-stage flow on the walkthrough portco, using the real fixtures
// and the mock agent templates. Mirrors lib/actions.ts primary().

import { describe, expect, it } from "vitest";
import {
  getAvailability,
  getBoardMembers,
  getPartners,
  getPortcoSeeds,
  getVenues,
  hydratePortco,
  personName,
} from "@/lib/data";
import { allLocked, confirmedMeetings, portcoPhase, portcoStage, primaryAction } from "@/lib/pipeline";
import { CONFLICT_QUARTER, conflictMember, simulatedPicks } from "@/lib/simulate";
import * as T from "@/lib/transitions";
import { mockBoardEmail, mockConflict, mockLogistics, mockPartnerEmail, mockPortcoEmail, mockShortlist } from "@/lib/mockAgent";
import { boardEmailPayload, conflictPayload, logisticsPayload, partnerEmailPayload, portcoEmailPayload, shortlistPayload } from "@/lib/payloads";
import type { ConflictData, Portco } from "@/lib/types";

let t = Date.parse("2026-09-10T13:00:00Z");
const deps: T.Deps = {
  partners: getPartners(),
  boardMembers: getBoardMembers(),
  availability: getAvailability(),
  venues: getVenues(),
  name: personName,
  now: () => new Date((t += 60_000)).toISOString(),
};

const members = getBoardMembers("ait-worldwide-logistics");
const seed = getPortcoSeeds().find((s) => s.id === "ait-worldwide-logistics")!;

const RB = "Monday, September 21";

describe("five-stage flow for AIT Worldwide Logistics", () => {
  let p = hydratePortco(seed);

  it("starts idle at stage 1", () => {
    expect(portcoStage(p)).toBe(1);
    expect(portcoPhase(p, members)).toBe("idle");
    expect(primaryAction(p, members)?.label).toBe("Find dates");
  });

  it("finds dates, ranks, drafts, and flags Q3 thin", () => {
    p = T.findDates(p, deps);
    expect(p.quarters.Q3.thin).toBe(true);
    expect(p.quarters.Q3.shortlist).toHaveLength(2);
    expect(p.quarters.Q1.shortlist).toHaveLength(3);
    expect(p.quarters.Q1.shortlist[0].attendeesFree).toEqual(["michael-wang", "jill-raker", "niall-mccomiskey", "max-elgart", "ben-cox"]);
    expect(p.quarters.Q1.shortlist[0].attendeesUnknown).toEqual(members.map((m) => m.id));
    expect(portcoPhase(p, members)).toBe("needsDraft");
    const result = mockShortlist(shortlistPayload(p, RB));
    p = T.applyOnepager(p, result, false, 0, deps);
    expect(p.quarters.Q1.shortlist[0].reason).toBeTruthy();
    expect(p.quarters.Q3.shortlist[0].reason).toContain("One of only 2 days");
    expect(p.drafts.onepager.text).toContain("Dear Tom");
    expect(p.drafts.onepager.text).toContain(RB);
    expect(p.drafts.onepager.text).not.toContain("—");
    expect(portcoPhase(p, members)).toBe("review");
    expect(primaryAction(p, members)?.label).toBe("Approve one-pager");
  });

  it("moves to partner sign-off and waits", () => {
    p = T.approveOnepager(p, deps);
    expect(portcoStage(p)).toBe(2);
    expect(portcoPhase(p, members)).toBe("needsDraft");
    p = T.applyPartnerEmail(p, mockPartnerEmail(partnerEmailPayload(p, p.drafts.onepager.text, RB)), false, 0, deps);
    expect(primaryAction(p, members)?.label).toBe("Approve and send to partners");
    p = T.sendToPartners(p, deps);
    expect(p.waitingOn).toBe("partners");
    expect(p.waitingSince).toBeTruthy();
    expect(primaryAction(p, members)?.enabled).toBe(false);
    p = T.partnerReplies(p, ["michael-wang"], deps);
    expect(p.waitingOn).toBe("partners");
    p = T.partnerReplies(p, ["jill-raker", "niall-mccomiskey", "max-elgart", "ben-cox"], deps);
    expect(p.waitingOn).toBe("none");
    expect(p.log.filter((e) => e.actor === "partner")).toHaveLength(5);
    expect(primaryAction(p, members)).toEqual({ label: "Draft the email to the portco", enabled: true });
  });

  it("moves to portco picks", () => {
    p = T.startPortcoPicks(p, deps);
    expect(portcoStage(p)).toBe(3);
    p = T.applyPortcoEmail(p, mockPortcoEmail(portcoEmailPayload(p, p.drafts.onepager.text, RB)), false, 0, deps);
    p = T.sendToPortco(p, deps);
    expect(p.waitingOn).toBe("portco");
    p = T.recordPortcoPicks(p, simulatedPicks(p), deps);
    expect(p.quarters.Q3.portcoPick).toBe(p.quarters.Q3.shortlist[0].id);
    expect(primaryAction(p, members)?.label).toBe("Draft the email to the board");
  });

  it("runs the board conflict path back to the approved rank 2 window", () => {
    p = T.startBoardConfirms(p, deps);
    expect(portcoStage(p)).toBe(4);
    p = T.applyBoardEmail(p, mockBoardEmail(boardEmailPayload(p, RB)), false, 0, deps);
    expect(p.drafts.boardEmail.text).toContain("Helen Marsh, Raymond Cho and Denise Walker");
    p = T.sendToBoard(p, deps);
    expect(p.waitingOn).toBe("board");
    const member = conflictMember(members)!;
    expect(member.name).toBe("Raymond Cho");
    const c = T.boardConflict(p, member.id, CONFLICT_QUARTER, deps);
    p = c.portco;
    expect(p.quarters.Q3.boardResponses[member.id]).toBe("declined");
    expect(p.quarters.Q1.boardResponses[member.id]).toBe("confirmed");
    expect(c.fallback?.rank).toBe(2);
    expect(c.reverify.ok).toBe(true);
    const wording = mockConflict(conflictPayload(p, CONFLICT_QUARTER, member.id, c.declined!, c.fallback, c.reverify));
    expect(wording.note).toContain("option 2");
    p = T.applyConflict(p, CONFLICT_QUARTER, member.id, c.declined!, c.fallback, c.reverify, wording, false, deps);
    expect(portcoPhase(p, members)).toBe("conflict");
    expect(primaryAction(p, members)?.label).toBe("Approve and re-send to board");
    const data = p.drafts["conflict:Q3"].data as ConflictData;
    expect(data.fallbackWindowId).toBe(c.fallback!.id);
    p = T.approveResend(p, CONFLICT_QUARTER, deps);
    expect(p.quarters.Q3.portcoPick).toBe(c.fallback!.id);
    expect(p.quarters.Q3.boardResponses[member.id]).toBe("pending");
    expect(p.waitingOn).toBe("board");
    p = T.boardConfirmAll(p, deps);
    expect(confirmedMeetings(p, members)).toBe(4);
    expect(primaryAction(p, members)).toEqual({ label: "Lock and book", enabled: true });
  });

  it("locks and books with venues from the list only", () => {
    p = T.lockAndBook(p, deps);
    expect(portcoStage(p)).toBe(5);
    const result = mockLogistics(logisticsPayload(p));
    const wrongCity = deps.venues.find((v) => v.city !== p.city && v.type === "hotel")!;
    const wrongRest = deps.venues.find((v) => v.city !== p.city && v.type === "restaurant")!;
    const tampered = { picks: { ...result.picks, Q2: { hotelId: wrongCity.id, restaurantId: wrongRest.id, reason: "wrong city" } } };
    p = T.applyLogistics(p, tampered, false, 0, deps);
    const picks = p.drafts.logistics.data as Record<string, unknown>;
    expect(picks.Q2).toBeUndefined();
    expect(picks.Q1).toBeDefined();
    expect(primaryAction(p, members)?.label).toBe("Approve and lock");
    p = T.applyLogistics(p, result, false, 0, deps);
    p = T.approveAndLock(p, deps);
    expect(allLocked(p)).toBe(true);
    expect(portcoPhase(p, members)).toBe("done");
    expect(primaryAction(p, members)).toBeNull();
    expect(p.quarters.Q3.logistics?.hotel.city).toBe("Itasca, IL");
  });
});
