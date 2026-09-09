"use client";

// 2027 at a glance. Locked meetings solid, proposed hollow. Filtered by EA.

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getBoardMembers, getCurrentEa } from "@/lib/data";
import { boardConfirmedQuarter } from "@/lib/pipeline";
import { addDays, dayKey, fmtTime, pad, weekdayOf } from "@/lib/scheduling";
import type { Portco, Window } from "@/lib/types";

type Meeting = { day: string; portco: Portco; w: Window; kind: "locked" | "proposed" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function meetingsOf(list: Portco[]): Meeting[] {
  const out: Meeting[] = [];
  for (const p of list) {
    const members = getBoardMembers(p.id);
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
    <div data-testid="year-view">
      <div className="mb-3 flex items-center gap-4 text-[12.5px] text-mut">
        <span>
          2027: <span className="text-txt" data-testid="cal-locked">{locked} confirmed</span>, <span className="text-txt" data-testid="cal-proposed">{meetings.length - locked} proposed</span>
        </span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand" /> confirmed or locked</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm border-2 border-blue" /> proposed</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
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
    <div className="rounded-lg border border-line bg-panel p-3" data-testid={`month-${month}`}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold">{name}</span>
        <span className="text-[11px] text-mut">{list.length ? `${list.length} meeting${list.length === 1 ? "" : "s"}` : ""}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-mut">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
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
                "flex h-5 items-center justify-center rounded-sm " +
                (kind === "locked" ? "bg-brand font-semibold text-white" : kind === "proposed" ? "border-2 border-blue text-blue" : "text-txt/70")
              }
              data-kind={kind}
            >
              {Number(d.slice(8, 10))}
            </span>
          );
        })}
      </div>
      {list.length ? (
        <ul className="mt-2 flex flex-col gap-0.5 border-t border-line pt-2 text-[11px]">
          {list.map((m) => (
            <li key={m.portco.id + m.w.id} className="flex justify-between gap-2">
              <span className={"truncate " + (m.kind === "locked" ? "text-txt" : "text-blue")}>
                {Number(m.day.slice(8, 10))} · {m.portco.name}
              </span>
              <span className="shrink-0 text-mut">{m.portco.city.split(",")[0]}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
