"use client";

import { QUARTERS, STATUS_LABEL } from "@/lib/types";
import { fmtWindow } from "@/lib/scheduling";
import { QuarterChip } from "@/components/Portcos/QuarterChip";
import { useDetail } from "./DetailContext";

export function QuarterStrip() {
  const { portco } = useDetail();
  return (
    <div className="grid grid-cols-4 gap-2 border-b border-line bg-panel2/50 px-6 py-3" data-testid="quarter-strip">
      {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => {
        const qs = portco.quarters[q];
        const pick = qs.shortlist.find((w) => w.id === qs.portcoPick);
        const top = qs.shortlist.find((w) => w.rank === 1);
        return (
          <div key={q} className="rounded-lg border border-line bg-panel px-3 py-2" data-testid={`quarter-${q}`}>
            <div className="flex items-center justify-between">
              <QuarterChip portco={portco} quarter={q} variant="row" />
              <span className="text-[11px] text-mut">{STATUS_LABEL[qs.status]}</span>
            </div>
            <div className="mt-1 truncate text-[12px]">
              {pick ? fmtWindow(pick) : top ? <span className="text-mut">Proposed {fmtWindow(top)}</span> : <span className="text-mut">No dates yet</span>}
            </div>
            {qs.logistics ? <div className="truncate text-[11px] text-mut">{qs.logistics.hotel.name} · {qs.logistics.restaurant.name}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
