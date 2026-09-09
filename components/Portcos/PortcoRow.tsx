"use client";

import Link from "next/link";
import { getBoardMembers, getEa } from "@/lib/data";
import { portcoPhase, portcoStage, primaryAction, waitingLabel } from "@/lib/pipeline";
import { sinceLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Portco } from "@/lib/types";
import { QUARTERS, STAGE_NAMES } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { QuarterChip } from "./QuarterChip";

export function waitingText(p: Portco): string {
  const members = getBoardMembers(p.id);
  const phase = portcoPhase(p, members);
  if (phase === "done") return "Done. Invites go out from Outlook.";
  if (phase === "waiting") return `Waiting on ${waitingLabel(p.waitingOn)}${p.waitingSince ? `, ${sinceLabel(p.waitingSince)}` : ""}`;
  if (phase === "idle") return "Not started";
  if (phase === "ready") return "Replies are in. Your move.";
  if (phase === "conflict") return "A board member declined. Re-send ready for you.";
  return "Draft ready for you";
}

export function PortcoRow({ portco }: { portco: Portco }) {
  const eaFilter = useStore((s) => s.eaFilter);
  const members = getBoardMembers(portco.id);
  const stage = portcoStage(portco);
  const phase = portcoPhase(portco, members);
  const action = primaryAction(portco, members);
  const ea = getEa(portco.eaId);
  return (
    <div
      className="grid items-center gap-4 rounded-lg border border-line bg-panel px-4 py-3"
      style={{ gridTemplateColumns: eaFilter === "all" ? "220px 110px 150px 1fr 190px 190px" : "220px 150px 1fr 190px 190px" }}
      data-testid={`row-${portco.id}`}
      data-row={portco.id}
    >
      <div className="min-w-0">
        <Link href={`/portcos/${portco.id}`} className="block truncate text-[13.5px] font-semibold hover:text-brand">
          {portco.name}
        </Link>
        <div className="truncate text-[11.5px] text-mut">{portco.city}</div>
      </div>
      {eaFilter === "all" ? <div className="truncate text-[12px] text-mut" data-testid="row-ea">{ea?.name}</div> : null}
      <div>
        <ProgressBar stage={stage} done={phase === "done"} />
        <div className="mt-1 truncate text-[11px] text-mut">
          {phase === "done" ? "All five steps done" : `Step ${stage} of 5, ${STAGE_NAMES[stage]}`}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => (
          <QuarterChip key={q} portco={portco} quarter={q} />
        ))}
      </div>
      <div className="text-[12px] text-mut" data-testid="row-waiting">{waitingText(portco)}</div>
      <div className="text-right">
        {action ? (
          <Link
            href={`/portcos/${portco.id}`}
            data-testid={`row-action-${portco.id}`}
            className={
              "inline-block rounded-md px-3 py-1.5 text-[12.5px] font-medium " +
              (action.enabled ? "bg-brand text-white hover:bg-brand2" : "border border-line bg-panel text-mut")
            }
          >
            {action.enabled ? action.label : "Open"}
          </Link>
        ) : (
          <Link href={`/portcos/${portco.id}`} className="inline-block rounded-md border border-line px-3 py-1.5 text-[12.5px] text-mut" data-testid={`row-action-${portco.id}`}>
            View
          </Link>
        )}
      </div>
    </div>
  );
}
