"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { getBoardMembers, getPartner, personName } from "@/lib/data";
import { isFinal, portcoStage, nextAction } from "@/lib/pipeline";
import { fmtWindow } from "@/lib/scheduling";
import type { Portco, Quarter } from "@/lib/types";
import { QUARTERS, STAGE_NAMES, STATUS_LABEL } from "@/lib/types";
import { QuarterChip } from "@/components/Board/QuarterChip";
import { StagePanel } from "@/components/Stages/StagePanel";

export function PortcoDrawer() {
  const id = useStore((s) => s.selectedPortcoId);
  const portco = useStore((s) => (id ? s.portcos[id] : undefined));
  const select = useStore((s) => s.selectPortco);

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, select]);

  if (!portco) return null;
  const stage = portcoStage(portco);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`${portco.name} detail`}>
      <div className="absolute inset-0 bg-txt/30" onClick={() => select(null)} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[1040px] flex-col bg-bg shadow-2xl"
        data-testid="portco-drawer"
      >
        <header className="flex items-start justify-between border-b border-line bg-panel px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-mut">
              Stage {stage}: {STAGE_NAMES[stage]}
            </div>
            <h2 className="text-[18px] font-semibold leading-tight">{portco.name}</h2>
            <div className="text-[12.5px] text-mut">
              {portco.city} · {portco.officeAddress}
            </div>
          </div>
          <button
            type="button"
            onClick={() => select(null)}
            className="rounded border border-line bg-panel px-2.5 py-1 text-[12px] text-mut hover:text-txt"
            aria-label="Close"
          >
            Close
          </button>
        </header>

        <div className="grid flex-1 grid-cols-[300px_1fr] gap-4 overflow-y-auto p-5">
          <QuarterList portco={portco} />
          <div className="min-w-0">
            <StagePanel portco={portco} />
          </div>
          <div className="col-span-2">
            <Timeline portco={portco} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function QuarterList({ portco }: { portco: Portco }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-mut">Quarters, 2027</div>
      {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => (
        <QuarterRow key={q} portco={portco} quarter={q} />
      ))}
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-mut">Next action</div>
      <div className="text-[13px] text-brand">{nextAction(portco)}</div>
    </div>
  );
}

function QuarterRow({ portco, quarter }: { portco: Portco; quarter: Quarter }) {
  const qs = portco.quarters[quarter];
  const pick = qs.portcoPick ? qs.shortlist.find((w) => w.id === qs.portcoPick) : undefined;
  const top = qs.shortlist.find((w) => w.rank === 1);
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2" data-testid={`quarter-${quarter}`}>
      <div className="flex items-center justify-between">
        <QuarterChip quarter={quarter} status={qs.status} final={isFinal(portco, quarter)} />
        <span className="text-[11.5px] text-mut">{STATUS_LABEL[qs.status]}</span>
      </div>
      <div className="mt-1.5 text-[12.5px]">
        {pick ? (
          <span>
            {fmtWindow(pick)}
            {qs.logistics ? <span className="block text-[11.5px] text-mut">{qs.logistics.hotel.name} · {qs.logistics.restaurant.name}</span> : null}
          </span>
        ) : top ? (
          <span className="text-mut">Proposed: {fmtWindow(top)}</span>
        ) : qs.windows.length > 0 ? (
          <span className="text-mut">
            {qs.windows.length} window{qs.windows.length === 1 ? "" : "s"} found
            {qs.thin ? ", thin" : ""}
          </span>
        ) : (
          <span className="text-mut">No dates yet</span>
        )}
      </div>
    </div>
  );
}

function Timeline({ portco }: { portco: Portco }) {
  const entries = [...portco.log].reverse();
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-mut">Timeline</div>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-3 py-3 text-[12.5px] text-mut">
          Nothing has happened yet. Press the stage button to start.
        </div>
      ) : (
        <ol className="flex flex-col gap-1.5" data-testid="timeline">
          {entries.map((e, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-[12.5px]">
              <span className="w-[112px] shrink-0 text-mut">{fmtStamp(e.at)}</span>
              <span className={"w-[52px] shrink-0 font-medium " + actorTone(e.actor)}>{actorLabel(e.actor)}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function actorLabel(a: string): string {
  return a === "ea" ? "EA" : a === "agent" ? "Agent" : a === "portco" ? "Portco" : "Board";
}

function actorTone(a: string): string {
  return a === "ea" ? "text-txt" : a === "agent" ? "text-brand" : "text-blue";
}

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

// Setup information, reused by the stage 0 panel.
export function SetupSummary({ portco }: { portco: Portco }) {
  const members = getBoardMembers(portco.id);
  return (
    <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-2 text-[12.5px]">
      <dt className="text-mut">Greenbriar partners</dt>
      <dd>
        {portco.partnerIds.map((id) => {
          const p = getPartner(id);
          return (
            <div key={id}>
              {p?.name ?? personName(id)} <span className="text-mut">· {p?.title}</span>
            </div>
          );
        })}
      </dd>
      <dt className="text-mut">Portco contact</dt>
      <dd>
        {portco.execContact.name} <span className="text-mut">· {portco.execContact.title}</span>
      </dd>
      <dt className="text-mut">Board members</dt>
      <dd>
        {members.map((b) => (
          <div key={b.id}>
            {b.name} <span className="text-mut">· {b.role}</span>
            {!b.calendarVisible ? <span className="ml-1 text-[11px] text-amber">calendar not shared, confirm by email</span> : null}
          </div>
        ))}
      </dd>
      <dt className="text-mut">Target quarters</dt>
      <dd>{portco.targetQuarters.join(", ")} 2027, four hours each, dinner after</dd>
      <dt className="text-mut">Office</dt>
      <dd>{portco.officeAddress}</dd>
    </dl>
  );
}
