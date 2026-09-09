"use client";

// 2027 at a glance, to reference/design/Tokens.dc.html. Confirmed and
// locked days are solid green (the Locked status color); proposed days are
// hollow amber (Waiting on others). Filtered by assistant in the header.

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getCurrentEa } from "@/lib/data";
import { boardConfirmedQuarter, boardMembersOf } from "@/lib/pipeline";
import { addDays, dayKey, fmtTime, pad, weekdayOf } from "@/lib/scheduling";
import type { Portco, Window } from "@/lib/types";
import { LogoTile } from "@/components/ui/LogoTile";

type Meeting = { day: string; portco: Portco; w: Window; kind: "locked" | "proposed" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function meetingsOf(list: Portco[]): Meeting[] {
  const out: Meeting[] = [];
  for (const p of list) {
    const members = boardMembersOf(p);
    for (const q of p.targetQuarters) {
      const qs = p.quarters[q];
      if (qs.status === "notStarted") continue;
      const w = qs.shortlist.find((x) => x.id === qs.portcoPick) ?? qs.shortlist.find((x) => x.rank === 1);
      if (!w) continue;
      out.push({ day: dayKey(w.start), portco: p, w, kind: boardConfirmedQuarter(p, q, members) ? "locked" : "proposed" });
    }
  }
  return out.sort((a, b) => a.w.start.localeCompare(b.w.start));
}

export function YearView() {
  const portcos = useStore((s) => s.portcos);
  const eaFilter = useStore((s) => s.eaFilter);
  const meetings = useMemo(() => {
    const me = getCurrentEa().id;
    return meetingsOf(Object.values(portcos).filter((p) => eaFilter === "all" || p.eaId === me));
  }, [portcos, eaFilter]);
  const locked = meetings.filter((m) => m.kind === "locked").length;
  const byDay = new Map<string, Meeting[]>();
  for (const m of meetings) byDay.set(m.day, [...(byDay.get(m.day) ?? []), m]);

  return (
    <div className="flex flex-col gap-4" data-testid="year-view">
      <div className="flex flex-wrap items-center gap-5 rounded-[12px] border border-line bg-white px-[18px] py-3.5 shadow-[0_1px_2px_rgba(23,34,26,0.05)]">
        <span className="serif text-[22px] font-semibold">2027</span>
        <span className="text-[16px] text-mut">
          <span className="font-semibold text-lock" data-testid="cal-locked">{locked} confirmed</span>
          {" and "}
          <span className="font-semibold text-wait" data-testid="cal-proposed">{meetings.length - locked} proposed</span>
          {" meetings"}
        </span>
        <span className="ml-auto inline-flex items-center gap-2 text-[14px] text-mut">
          <span className="inline-block h-3.5 w-3.5 rounded-[4px] bg-lock" /> confirmed or locked
        </span>
        <span className="inline-flex items-center gap-2 text-[14px] text-mut">
          <span className="inline-block h-3.5 w-3.5 rounded-[4px] border-2 border-amber" /> proposed
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 2xl:grid-cols-4">
        {MONTHS.map((name, i) => (
          <Month key={name} name={name} month={i + 1} byDay={byDay} />
        ))}
      </div>
    </div>
  );
}

function Month({ name, month, byDay }: { name: string; month: number; byDay: Map<string, Meeting[]> }) {
  const first = `2027-${pad(month)}-01`;
  const startWd = weekdayOf(first);
  const days: string[] = [];
  for (let d = first; d.slice(5, 7) === pad(month); d = addDays(d, 1)) days.push(d);
  const list = days.flatMap((d) => byDay.get(d) ?? []);
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-4 shadow-[var(--shadow-card)]" data-testid={`month-${month}`}>
      <div className="flex items-baseline justify-between">
        <span className="serif text-[20px] font-semibold">{name}</span>
        <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{list.length ? `${list.length} meeting${list.length === 1 ? "" : "s"}` : ""}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-[12px] font-semibold text-idle-text">{d}</span>
        ))}
        {Array.from({ length: startWd }).map((_, i) => (
          <span key={`e${i}`} />
        ))}
        {days.map((d) => {
          const ms = byDay.get(d) ?? [];
          const kind = ms.some((m) => m.kind === "locked") ? "locked" : ms.length ? "proposed" : "";
          return (
            <span
              key={d}
              title={ms.map((m) => `${m.portco.name}, ${fmtTime(m.w.start)}`).join("\n")}
              className={
                "flex h-7 items-center justify-center rounded-[6px] " +
                (kind === "locked" ? "bg-lock font-semibold text-white" : kind === "proposed" ? "border-2 border-amber font-semibold text-wait" : "text-txt/70")
              }
              data-kind={kind}
            >
              {Number(d.slice(8, 10))}
            </span>
          );
        })}
      </div>
      {list.length ? (
        <ul className="flex flex-col gap-1.5 border-t border-idle-soft pt-3">
          {list.map((m) => (
            <li key={m.portco.id + m.w.id} className="flex items-center gap-2.5 text-[14px]">
              <LogoTile src={m.portco.logo} name={m.portco.name} width={40} height={28} radius={6} />
              <span className={"w-6 shrink-0 text-[13px] font-bold " + (m.kind === "locked" ? "text-lock" : "text-wait")}>{Number(m.day.slice(8, 10))}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{m.portco.name}</span>
              <span className="shrink-0 text-[13px] text-mut">{m.portco.city.split(",")[0]}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
