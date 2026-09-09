// Builds the small JSON payloads each agent step receives. Shared by the
// client actions and by scripts/gen-mock.ts so mock and live see the same
// data. Only windows, names, cities, and venues. Never calendars.

import { getBoardMembers, getCurrentEa, getPartner, getVenues, personName } from "./data";
import { activePartners } from "./pipeline";
import { fmtDate, fmtTime } from "./scheduling";
import { eaSignature } from "./simulate";
import type {
  BoardEmailPayload,
  ConflictPayload,
  LogisticsPayload,
  PartnerEmailPayload,
  PortcoEmailPayload,
  ShortlistPayload,
  WindowPayload,
} from "./prompts";
import type { Portco, Quarter, Window } from "./types";

export const QUARTER_MONTHS_LABEL: Record<Quarter, string> = {
  Q1: "January to March",
  Q2: "April to June",
  Q3: "July to September",
  Q4: "October to December",
};

export function timeRange(w: Window): string {
  return `${fmtTime(w.start)} to ${fmtTime(w.end)}`;
}

export function windowPayload(w: Window): WindowPayload {
  return {
    id: w.id,
    rank: w.rank ?? 0,
    date: fmtDate(w.start),
    time: timeRange(w),
    dinner: fmtTime(w.dinnerStart),
    partnersFree: w.attendeesFree.map(personName),
    confirmByEmail: w.attendeesUnknown.map(personName),
  };
}

export function partnerNames(p: Portco): string[] {
  return p.partnerIds.map((id) => getPartner(id)?.name ?? id);
}

export function boardNames(p: Portco): string[] {
  return getBoardMembers(p.id).map((b) => b.name);
}

export function shortlistPayload(p: Portco, replyBy: string): ShortlistPayload {
  return {
    portco: { name: p.name, city: p.city, officeAddress: p.officeAddress },
    execContact: p.execContact,
    partners: activePartners(p).map((id) => getPartner(id)?.name ?? id),
    replyBy,
    quarters: p.targetQuarters.map((q) => ({
      quarter: q,
      months: QUARTER_MONTHS_LABEL[q],
      thin: !!p.quarters[q].thin,
      windows: p.quarters[q].shortlist.map(windowPayload),
    })),
    eaSignature: eaSignature(getCurrentEa()),
  };
}

function quarterOptions(p: Portco) {
  return p.targetQuarters.map((q) => ({
    quarter: q,
    months: QUARTER_MONTHS_LABEL[q],
    thin: !!p.quarters[q].thin,
    windows: p.quarters[q].shortlist.map(windowPayload),
  }));
}

export function partnerEmailPayload(p: Portco, onepager: string, replyBy: string): PartnerEmailPayload {
  return {
    portco: { name: p.name, city: p.city },
    execContact: p.execContact,
    partners: partnerNames(p),
    replyBy,
    onepager,
    quarters: quarterOptions(p),
    eaSignature: eaSignature(getCurrentEa()),
  };
}

export function portcoEmailPayload(p: Portco, onepager: string, replyBy: string): PortcoEmailPayload {
  return {
    portco: { name: p.name, city: p.city },
    execContact: p.execContact,
    partners: partnerNames(p),
    replyBy,
    onepager,
    quarters: quarterOptions(p),
    attachmentName: `${p.name} 2027 meeting options.pdf`,
    eaSignature: eaSignature(getCurrentEa()),
  };
}

export function pickedWindow(p: Portco, q: Quarter): Window | undefined {
  const qs = p.quarters[q];
  return qs.shortlist.find((w) => w.id === qs.portcoPick);
}

export function boardEmailPayload(p: Portco, replyBy: string): BoardEmailPayload {
  return {
    portco: { name: p.name, city: p.city, officeAddress: p.officeAddress },
    boardMembers: boardNames(p),
    partners: partnerNames(p),
    replyBy,
    picks: p.targetQuarters.flatMap((q) => {
      const w = pickedWindow(p, q);
      return w ? [{ quarter: q, date: fmtDate(w.start), time: timeRange(w), dinner: fmtTime(w.dinnerStart) }] : [];
    }),
    eaSignature: eaSignature(getCurrentEa()),
  };
}

export function conflictPayload(
  p: Portco,
  q: Quarter,
  memberId: string,
  declined: Window,
  fallback: Window | null,
  reverify: { ok: boolean; busy: string[] },
): ConflictPayload {
  return {
    portco: { name: p.name },
    quarter: q,
    member: personName(memberId),
    declined: { date: fmtDate(declined.start), time: timeRange(declined) },
    fallback: fallback
      ? { date: fmtDate(fallback.start), time: timeRange(fallback), dinner: fmtTime(fallback.dinnerStart), rank: fallback.rank ?? 0 }
      : null,
    reverify: { ok: reverify.ok, busy: reverify.busy.map(personName) },
    partners: partnerNames(p),
    boardMembers: boardNames(p),
    eaSignature: eaSignature(getCurrentEa()),
  };
}

export function logisticsPayload(p: Portco): LogisticsPayload {
  return {
    portco: { name: p.name, city: p.city, officeAddress: p.officeAddress },
    partners: partnerNames(p),
    meetings: p.targetQuarters.flatMap((q) => {
      const w = pickedWindow(p, q);
      return w ? [{ quarter: q, date: fmtDate(w.start), time: timeRange(w), dinner: fmtTime(w.dinnerStart) }] : [];
    }),
    venues: getVenues(p.city).map((v) => ({ id: v.id, type: v.type, name: v.name, distanceMi: v.distanceMi, note: v.note })),
  };
}
