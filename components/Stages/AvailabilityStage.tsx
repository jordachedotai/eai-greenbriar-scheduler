"use client";

// Stage 0 (Setup) and stage 1 (Availability grid).

import { useStore } from "@/lib/store";
import { buildShortlist, pullAvailability } from "@/lib/actions";
import { personName } from "@/lib/data";
import { fmtDate, fmtTime } from "@/lib/scheduling";
import type { Portco, Quarter, Window } from "@/lib/types";
import { STAGE_BUTTONS } from "@/lib/types";
import { SetupSummary } from "@/components/PortcoDetail/PortcoDrawer";
import { StageFrame } from "./StageFrame";

export function SetupStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => s.working);
  return (
    <StageFrame
      stage={0}
      hint="Confirm who needs to be in the room. Then pull availability for every quarter."
      button={{ label: STAGE_BUTTONS[0], onClick: () => pullAvailability(portco.id), disabled: !!working }}
    >
      <SetupSummary portco={portco} />
    </StageFrame>
  );
}

export function AvailabilityStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => s.working);
  return (
    <StageFrame
      stage={1}
      hint="Four-hour blocks where every partner is free. Each block says whose calendar it came from. Board members without a shared calendar are confirmed by email later."
      button={{ label: STAGE_BUTTONS[1], onClick: () => void buildShortlist(portco.id), disabled: !!working }}
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {portco.targetQuarters.map((q) => (
          <QuarterGrid key={q} quarter={q} windows={portco.quarters[q].windows} thin={!!portco.quarters[q].thin} />
        ))}
      </div>
    </StageFrame>
  );
}

function QuarterGrid({ quarter, windows, thin }: { quarter: Quarter; windows: Window[]; thin: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-bg p-2" data-testid={`grid-${quarter}`}>
      <div className="mb-1.5 flex items-baseline justify-between px-1">
        <span className="text-[12px] font-semibold">{quarter}</span>
        <span className="text-[11px] text-mut">
          {windows.length} window{windows.length === 1 ? "" : "s"}
        </span>
      </div>
      {thin ? (
        <div className="mb-2 rounded border border-amber/30 bg-amber-soft px-2 py-1.5 text-[11.5px] text-amber" data-testid={`thin-${quarter}`}>
          Only {windows.length} window{windows.length === 1 ? "" : "s"} found in {quarter}. Consider widening to 3-hour blocks.
        </div>
      ) : null}
      <div className="flex max-h-[360px] flex-col gap-1.5 overflow-y-auto pr-0.5">
        {windows.map((w) => (
          <WindowBlock key={w.id} w={w} />
        ))}
      </div>
    </div>
  );
}

export function WindowBlock({ w, rank, reason }: { w: Window; rank?: number; reason?: string }) {
  return (
    <div className="rounded border border-line bg-panel px-2 py-1.5" data-testid="window">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-medium">
          {rank ? <span className="mr-1 text-mut">#{rank}</span> : null}
          {fmtDate(w.start)}
        </span>
        <span className="text-[11.5px] text-mut">
          {fmtTime(w.start)} to {fmtTime(w.end)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {w.attendeesFree.map((id) => (
          <span key={id} className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] text-brand" title={`Free, from ${personName(id)}'s calendar`}>
            {shortName(personName(id))} · calendar
          </span>
        ))}
        {w.attendeesUnknown.map((id) => (
          <span key={id} className="rounded bg-amber-soft px-1.5 py-0.5 text-[10.5px] text-amber" title={`${personName(id)} has no shared calendar. Confirm by email.`}>
            {shortName(personName(id))} · email
          </span>
        ))}
      </div>
      {reason ? <div className="mt-1.5 text-[12px] text-txt/80">{reason}</div> : null}
      <div className="mt-1 text-[11px] text-mut">Dinner {fmtTime(w.dinnerStart)}</div>
    </div>
  );
}

export function shortName(full: string): string {
  const parts = full.split(" ");
  return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : full;
}
