"use client";

import Link from "next/link";
import { getBoardMembers } from "@/lib/data";
import { portcoPhase, portcoStage, primaryAction } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import type { Portco, Stage } from "@/lib/types";
import { QUARTERS, STAGES, STAGE_NAMES } from "@/lib/types";
import { QuarterChip } from "./QuarterChip";
import { waitingText } from "./PortcoRow";
import { usePortcoList } from "./usePortcoList";

export function BoardView() {
  const { visible } = usePortcoList();
  return (
    <section aria-label="Board" className="overflow-x-auto" data-testid="board-view">
      <div className="grid min-w-[1000px] grid-cols-5 gap-2">
        {STAGES.map((stage) => {
          const cards = visible.filter((p) => portcoStage(p) === stage);
          return (
            <div key={stage} className={"flex min-h-[360px] flex-col rounded-lg border p-2 " + (stage === 5 ? "border-brand/30 bg-brand-soft/40" : "border-line bg-panel2/60")} data-testid={`column-${stage}`}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-mut">
                  <span className="mr-1 text-mut/60">{stage}</span>
                  {STAGE_NAMES[stage as Stage]}
                </div>
                <div className="text-[11px] text-mut" data-testid={`column-count-${stage}`}>{cards.length}</div>
              </div>
              <div className="flex flex-col gap-2">
                {cards.map((p) => (
                  <BoardCard key={p.id} portco={p} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BoardCard({ portco }: { portco: Portco }) {
  const eaFilter = useStore((s) => s.eaFilter);
  const members = getBoardMembers(portco.id);
  const action = primaryAction(portco, members);
  const phase = portcoPhase(portco, members);
  return (
    <Link href={`/portcos/${portco.id}`} className="block rounded-lg border border-line bg-panel px-3 py-2.5 hover:border-brand" data-testid={`card-${portco.id}`}>
      <div className="text-[13px] font-semibold leading-snug">{portco.name}</div>
      <div className="text-[11.5px] text-mut">
        {portco.city}
        {eaFilter === "all" ? <span> · {portco.eaId === "ea1" ? "Peggy" : portco.eaId.toUpperCase()}</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => (
          <QuarterChip key={q} portco={portco} quarter={q} />
        ))}
      </div>
      <div className="mt-2 text-[11.5px] text-mut">{waitingText(portco)}</div>
      {action && action.enabled && phase !== "done" ? <div className="mt-1 text-[11.5px] font-medium text-brand">Next: {action.label}</div> : null}
    </Link>
  );
}
