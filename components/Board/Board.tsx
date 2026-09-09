"use client";

import { useStore } from "@/lib/store";
import { portcoStage } from "@/lib/pipeline";
import type { Stage } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { PortcoCard } from "./PortcoCard";

const STAGES: Stage[] = [0, 1, 2, 3, 4, 5, 6];

export function Board() {
  const portcos = useStore((s) => s.portcos);
  const list = Object.values(portcos);

  return (
    <section aria-label="Pipeline" className="overflow-x-auto">
      <div className="grid min-w-[1120px] grid-cols-7 gap-2">
        {STAGES.map((stage) => {
          const cards = list.filter((p) => portcoStage(p) === stage);
          return (
            <div
              key={stage}
              className={"flex min-h-[320px] flex-col rounded-lg border p-2 " + (stage === 6 ? "border-brand/30 bg-brand-soft/50" : "border-line bg-panel2/60")}
              data-testid={`column-${stage}`}
            >
              <div className="mb-2 flex items-baseline justify-between px-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-mut">
                  <span className="mr-1 text-mut/60">{stage}</span>
                  {STAGE_NAMES[stage]}
                </div>
                <div className="text-[11px] text-mut" data-testid={`column-count-${stage}`}>{cards.length}</div>
              </div>
              <div className="flex flex-col gap-2">
                {cards.map((p) => (
                  <PortcoCard key={p.id} portco={p} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
