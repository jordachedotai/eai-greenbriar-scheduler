"use client";

// After lock: per meeting, per attendee, invite accepted, tentative, or no
// reply. Travel booked per partner. Simulated from the presenter menu.

import { fmtDate } from "@/lib/scheduling";
import { personName } from "@/lib/data";
import { shortName } from "@/lib/format";
import { activePartners, attendeeIds, inviteCounts, travelBookedCount } from "@/lib/pipeline";
import type { AttendanceStatus } from "@/lib/types";
import { useDetail } from "@/components/Detail/DetailContext";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { Label } from "./shared";

const PILL: Record<AttendanceStatus, string> = {
  accepted: "bg-lock-soft text-lock",
  tentative: "bg-wait-soft text-wait",
  noReply: "bg-idle-soft text-idle",
};
const TEXT: Record<AttendanceStatus, string> = { accepted: "Accepted", tentative: "Tentative", noReply: "No reply" };

export function Attendance() {
  const { portco, members } = useDetail();
  const ids = attendeeIds(portco, members);
  const counts = inviteCounts(portco, members);
  const travel = travelBookedCount(portco);
  const personOf = (id: string): Person => (id === "exec" ? { name: portco.execContact.name } : resolvePerson(id));
  const nameOf = (id: string): string => (id === "exec" ? portco.execContact.name : personName(id));

  return (
    <div className="flex flex-col gap-4" data-testid="attendance">
      <div className="flex items-center justify-between">
        <Label>Attendance</Label>
        <span className="text-[14px] text-mut" data-testid="attendance-summary">
          {counts.replied ? `Invites accepted ${counts.accepted} of ${counts.total}` : "Invites out. No replies yet."}
          {counts.tentative ? ` · ${counts.tentative} tentative` : ""}
          {counts.replied && counts.noReply ? ` · ${counts.noReply} no reply` : ""}
        </span>
      </div>
      <div className="overflow-x-auto rounded-[10px] border border-line">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="bg-bg text-left">
              <th className="px-3 py-2.5 text-[13px] font-semibold text-mut">Meeting</th>
              {ids.map((id) => (
                <th key={id} className="px-2 py-2 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Face person={personOf(id)} size={24} />
                    <span className="text-[13px] font-semibold text-mut">{shortName(nameOf(id))}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portco.targetQuarters.map((q) => {
              const qs = portco.quarters[q];
              const w = qs.shortlist.find((x) => x.id === qs.portcoPick);
              return (
                <tr key={q} className="border-t border-idle-line">
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="mr-2 font-bold text-mut">{q}</span>
                    {w ? fmtDate(w.start) : ""}
                  </td>
                  {ids.map((id) => {
                    const st: AttendanceStatus = portco.attendance?.[q]?.[id] ?? "noReply";
                    return (
                      <td key={id} className="px-2 py-2" data-testid={`inv-${q}-${id}`} data-status={st}>
                        <span className={"rounded-full px-2 py-0.5 text-[12px] font-semibold " + PILL[st]}>{TEXT[st]}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Partner travel</Label>
        <div className="flex flex-wrap gap-2" data-testid="travel">
          {activePartners(portco).map((id) => {
            const st = portco.travel?.[id] ?? "pending";
            return (
              <span key={id} className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-[14px]" data-testid={`travel-${id}`} data-status={st}>
                <Face person={resolvePerson(id)} size={24} />
                <span className="font-medium">{shortName(personName(id))}</span>
                <span className={"rounded-full px-2 py-0.5 text-[12px] font-semibold " + (st === "booked" ? "bg-lock-soft text-lock" : "bg-idle-soft text-idle")}>{st === "booked" ? "Booked" : "Pending"}</span>
              </span>
            );
          })}
        </div>
        <span className="text-[13px] text-mut">
          {travel.booked} of {travel.total} booked. In production the replies and bookings come from Outlook and the travel desk.
        </span>
      </div>
    </div>
  );
}
