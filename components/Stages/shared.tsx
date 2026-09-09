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

// The one-line explanation every stage panel opens with.
export function Explain({ children, testId = "explain" }: { children: ReactNode; testId?: string }) {
  return (
    <p className="mb-4 text-[13.5px] leading-relaxed" data-testid={testId}>
      {children}
    </p>
  );
}

export function Section({ title, children, testId }: { title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="mb-4" data-testid={testId}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-mut">{title}</div>
      {children}
    </section>
  );
}

// Who we are waiting on, since when, and the demo control.
export function WaitingState({ children }: { children?: ReactNode }) {
  const { portco } = useDetail();
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber/40 bg-amber-soft/50 px-4 py-3" data-testid="waiting-state">
      <div className="text-[13px]">
        <span className="font-semibold text-amber">Waiting on {waitingLabel(portco.waitingOn)}</span>
        {portco.waitingSince ? <span className="text-mut">, {sinceLabel(portco.waitingSince)}.</span> : null}
        <span className="ml-1 text-mut">Replies land in Activity.</span>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

export function WindowCard({ w, showReason = true }: { w: Window; showReason?: boolean }) {
  return (
    <div className="rounded border border-line bg-panel px-2.5 py-2" data-testid="window">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-medium">
          {w.rank ? <span className="mr-1 text-mut">Option {w.rank}</span> : null}
          {fmtDate(w.start)}
        </span>
        <span className="shrink-0 text-[11.5px] text-mut">
          {fmtTime(w.start)} to {fmtTime(w.end)}
        </span>
      </div>
      {showReason && w.reason ? <div className="mt-1 text-[12px] text-txt/80">{w.reason}</div> : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {w.attendeesFree.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-0.5 pl-0.5 pr-2 text-[11px] text-brand" title={`Free on ${personName(id)}'s calendar`}>
            <Face person={resolvePerson(id)} size={18} />
            {shortName(personName(id))}
          </span>
        ))}
        <span className="text-[11px] text-mut">· dinner {fmtTime(w.dinnerStart)}</span>
      </div>
    </div>
  );
}

// Compact list of who has replied and who has not.
export function ReplyTracker({ rows, testId }: { rows: { person: Person; state: "yes" | "pending" | "declined"; note?: string }[]; testId?: string }) {
  return (
    <ul className="flex flex-col gap-1" data-testid={testId}>
      {rows.map((r) => (
        <li key={r.person.name} className="flex items-center justify-between rounded border border-line bg-panel px-3 py-1.5 text-[12.5px]">
          <span className="inline-flex items-center gap-2">
            <Face person={r.person} size={24} />
            {r.person.name}
            {r.note ? <span className="text-mut"> · {r.note}</span> : null}
          </span>
          <span
            className={
              "rounded px-1.5 py-0.5 text-[11px] " +
              (r.state === "yes" ? "bg-brand-soft text-brand" : r.state === "declined" ? "bg-red-soft text-red" : "bg-panel2 text-mut")
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
