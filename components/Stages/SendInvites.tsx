"use client";

// Stage 6. One calendar invite per meeting to read and send. After sending,
// the same panel is the attendance tracker. Order: what needs the EA first
// (the drafts, or nothing), then the evidence (replies), then history (the
// folded sent row).

import { getVenue } from "@/lib/data";
import { fmtStamp } from "@/lib/format";
import { allAccepted, inviteCounts } from "@/lib/pipeline";
import { fmtDate, fmtTime } from "@/lib/scheduling";
import type { Invite } from "@/lib/types";
import { useDetail } from "@/components/Detail/DetailContext";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { IconCalendar } from "@/components/ui/icons";
import { Attendance } from "./Attendance";
import { Label, PanelHeader, Pill, WaitingState } from "./shared";
import { quarterLabel } from "@/lib/quarters";

export function SendInvites({ readOnly }: { readOnly: boolean }) {
  const { portco, members, phase } = useDetail();
  const draft = portco.drafts.invites;
  const invites = (draft?.data ?? []) as Invite[];
  const sent = !!draft?.approved;
  const done = allAccepted(portco, members);
  const counts = inviteCounts(portco, members);
  const sentAt = [...portco.log].reverse().find((e) => e.text.startsWith("Sent four calendar invites"))?.at;
  const personOf = (id: string): Person => (id === "exec" ? { name: portco.execContact.name } : resolvePerson(id));

  const title = done ? "Every invite accepted" : sent ? "Invites are out" : "Send the calendar invites";
  const sentence = done
    ? "Every meeting is on every calendar and travel is booked. Nothing left to do for this window."
    : sent
      ? `Replies land here as they come in. ${counts.accepted} of ${counts.total} accepted so far.`
      : `One invite per meeting, to the ${invites[0]?.attendeeIds.length ?? 0} people in the room, with the dinner as a second entry. Read them and press Approve and send invites.`;

  return (
    <div>
      <PanelHeader title={title}>{sentence}</PanelHeader>

      {!sent && !readOnly ? (
        <div className="mb-4 flex flex-col gap-3" data-testid="invite-drafts">
          {invites.map((inv) => (
            <InviteCard key={inv.quarter} inv={inv} personOf={personOf} label={quarterLabel(inv.quarter, portco.targetQuarters)} />
          ))}
        </div>
      ) : null}

      {sent && !done && !readOnly ? <WaitingState /> : null}

      {sent ? (
        <div className="mb-4">
          <Attendance />
        </div>
      ) : null}

      {sent ? (
        <div className="flex items-center justify-between rounded-[10px] border border-idle-line bg-[#fafbf9] px-3.5 py-2.5" data-testid="invites-sent">
          <span className="flex items-center gap-2.5 text-[14px] text-mut">
            <span className="rounded-full bg-lock-soft px-2 py-0.5 text-[12px] font-semibold text-lock">Sent</span>
            <span>
              {invites.length === 4 ? "Four" : invites.length} calendar invite{invites.length === 1 ? "" : "s"}{sentAt ? ` · ${fmtStamp(sentAt)}` : ""} · {invites[0]?.attendeeIds.length ?? 0} people each
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function InviteCard({ inv, personOf, label }: { inv: Invite; personOf: (id: string) => Person; label: string }) {
  const w = { start: inv.start, end: inv.end };
  return (
    <div className="overflow-hidden rounded-[12px] border border-line" data-testid={`invite-${inv.quarter}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-bg px-[18px] py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-mut"><IconCalendar size={18} stroke="#61705f" /></span>
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">Invite · {label}</span>
          <Pill tone="wait">Draft</Pill>
        </div>
        <span className="text-[13px] text-mut">{inv.attendeeIds.length} attendees</span>
      </div>
      <div className="flex flex-col gap-2.5 bg-white px-[18px] py-4 text-[16px]">
        <span className="font-semibold">{inv.title}</span>
        <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1.5 text-[15px]">
          <span className={label}>When</span>
          <span className="font-semibold">
            {fmtDate(w.start)}, {fmtTime(w.start)} to {fmtTime(w.end)}
          </span>
          <span className={label}>Where</span>
          <span>{inv.location}</span>
          <span className={label}>Dinner</span>
          <span>
            {inv.dinner.venue}, {fmtTime(inv.dinner.start)} <span className="text-mut">· sent as a second invite</span>
          </span>
          <span className={label}>Attendees</span>
          <span className="flex flex-wrap gap-1.5">
            {inv.attendeeIds.map((id) => {
              const p = personOf(id);
              return (
                <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2 text-[13px]">
                  <Face person={p} size={22} />
                  {p.name}
                </span>
              );
            })}
          </span>
        </div>
        <p className="text-[15px] text-mut">{inv.body}</p>
      </div>
    </div>
  );
}

const label = "text-[13px] font-semibold uppercase tracking-[0.04em] text-mut";
export { getVenue };
