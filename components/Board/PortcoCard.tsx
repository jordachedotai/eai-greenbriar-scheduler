"use client";

import type { Portco } from "@/lib/types";
import { QUARTERS } from "@/lib/types";
import { isFinal, nextAction } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import { QuarterChip } from "./QuarterChip";

export function PortcoCard({ portco }: { portco: Portco }) {
  const select = useStore((s) => s.selectPortco);
  return (
    <button
      type="button"
      onClick={() => select(portco.id)}
      data-testid={`card-${portco.id}`}
      className="w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-brand hover:shadow-[0_0_0_1px_var(--color-brand)]"
    >
      <div className="text-[13px] font-semibold leading-snug">{portco.name}</div>
      <div className="text-[11.5px] text-mut">{portco.city}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => (
          <QuarterChip key={q} quarter={q} status={portco.quarters[q].status} final={isFinal(portco, q)} />
        ))}
      </div>
      <div className="mt-2 text-[11.5px] text-brand">Next: {nextAction(portco)}</div>
    </button>
  );
}
