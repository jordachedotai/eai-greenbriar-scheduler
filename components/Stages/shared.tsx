"use client";

// Pieces shared by the five stage panels.

import type { ReactNode } from "react";
import { personName } from "@/lib/data";
import { sinceLabel, shortName } from "@/lib/format";
import { waitingLabel } from "@/lib/pipeline";
import { fmtDate, fmtTime } from "@/lib/scheduling";
import type { Window } from "@/lib/types";
import { useDetail } from "@/components/Detail/DetailContext";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { ViewEmail } from "@/components/Drafts/EmailDrawer";

// Every stage panel opens with a serif title and one plain sentence.
export function PanelHeader({ title, children, testId = "explain" }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h3 className="serif text-[22px] font-semibold leading-tight">{title}</h3>
      <p className="text-[16px] leading-relaxed text-mut" data-testid={testId}>
        {children}
      </p>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{children}</span>;
}

export function Section({ title, children, testId }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="mb-4 flex flex-col gap-1.5" data-testid={testId}>
      <Label>{title}</Label>
      {children}
    </section>
  );
}

// Who we are waiting on and since when. No button: simulations live in
// the presenter menu (Shift+P).
export function WaitingState() {
  const { portco } = useDetail();
  return (
    <div className="mb-4 flex items-center gap-3 rounded-[10px] border border-wait-line bg-wait-soft px-4 py-3 text-[15px]" data-testid="waiting-state">
      <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-amber" />
      <span>
        <span className="font-semibold text-wait">Waiting on {waitingLabel(portco.waitingOn)}</span>
        {portco.waitingSince ? <span className="text-mut">, {sinceLabel(portco.waitingSince)}.</span> : null}
        <span className="ml-1 text-mut">Replies land in Activity.</span>
      </span>
    </div>
  );
}

// One date option. The date sits on one line with the time beneath it.
// `actions` is the control slot, top right: Use this, Remove, arrows.
export function WindowCard({ w, showReason = true, actions, selected, testId = "window" }: { w: Window; showReason?: boolean; actions?: ReactNode; selected?: boolean; testId?: string }) {
  return (
    <div
      className={"rounded-[10px] border bg-white px-3 py-2.5 " + (selected ? "border-[#cfdfd2] bg-[#f4f8f5]" : "border-line")}
      data-testid={testId}
      data-date={fmtDate(w.start)}
      data-selected={selected === undefined ? undefined : selected ? "true" : "false"}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          {w.rank ? <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Option {w.rank}</span> : null}
          <span className="whitespace-nowrap text-[15px] font-semibold leading-tight">{fmtDate(w.start)}</span>
          <span className="text-[14px] text-mut">
            {fmtTime(w.start)} to {fmtTime(w.end)}
          </span>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
      {showReason && w.reason ? <div className="mt-1 text-[14px] leading-snug text-txt/80">{w.reason}</div> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {w.attendeesFree.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-lock-soft py-0.5 pl-0.5 pr-2 text-[12px] font-medium text-lock" title={`Free on ${personName(id)}'s calendar`}>
            <Face person={resolvePerson(id)} size={20} />
            {shortName(personName(id))}
          </span>
        ))}
        <span className="text-[13px] text-mut">· dinner {fmtTime(w.dinnerStart)}</span>
      </div>
    </div>
  );
}

// Compact list of who has replied and who has not.
export function ReplyTracker({ rows, testId }: { rows: { person: Person; state: "yes" | "pending" | "declined"; note?: string; replyId?: string }[]; testId?: string }) {
  const { portco } = useDetail();
  return (
    <ul className="flex flex-col gap-1.5" data-testid={testId}>
      {rows.map((r) => (
        <li key={r.person.name} className="flex items-center justify-between rounded-[10px] border border-line bg-white px-3 py-2 text-[15px]">
          <span className="inline-flex items-center gap-2.5">
            <Face person={r.person} size={28} />
            <span className="font-medium">{r.person.name}</span>
            {r.note ? <span className="text-[14px] text-mut">· {r.note}</span> : null}
            {r.replyId ? <ViewEmail portcoId={portco.id} replyId={r.replyId} testId={`reply-view-${r.person.id ?? r.person.name}`} /> : null}
          </span>
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-[13px] font-semibold " +
              (r.state === "yes" ? "bg-lock-soft text-lock" : r.state === "declined" ? "bg-red-soft text-red" : "bg-idle-soft text-idle")
            }
            data-state={r.state}
          >
            {r.state === "yes" ? "Yes" : r.state === "declined" ? "Declined" : "No reply yet"}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Pill in the status colors.
export function Pill({ tone, children }: { tone: "you" | "wait" | "lock" | "idle" | "red"; children: ReactNode }) {
  const cls = tone === "you" ? "bg-you-soft text-you" : tone === "wait" ? "bg-wait-soft text-wait" : tone === "lock" ? "bg-lock-soft text-lock" : tone === "red" ? "bg-red-soft text-red" : "bg-idle-soft text-idle";
  return <span className={"rounded-full px-2 py-0.5 text-[12px] font-semibold " + cls}>{children}</span>;
}
