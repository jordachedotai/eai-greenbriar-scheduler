"use client";

// Four tiles, one per quarter. "Q1 · Jan to Mar" with "No date yet" before
// dates exist; then "Q1", the window, and a caption in the status color.

import { quarterLabel, quarterMonthsShort } from "@/lib/quarters";
import { fmtWindow } from "@/lib/scheduling";
import { quarterChip, type Tone } from "@/components/Portcos/status";
import { IconLock } from "@/components/ui/icons";
import { useDetail } from "./DetailContext";

const BOX: Record<Tone, string> = {
  you: "bg-you-soft border-you-line",
  wait: "bg-wait-soft border-wait-line",
  lock: "bg-lock-soft border-lock-line",
  idle: "bg-idle-bg border-idle-line",
};
const TEXT: Record<Tone, string> = { you: "text-you", wait: "text-wait", lock: "text-lock", idle: "text-idle" };

export function QuarterStrip() {
  const { portco } = useDetail();
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(4, portco.targetQuarters.length)}, minmax(0, 1fr))` }} data-testid="quarter-strip">
      {portco.targetQuarters.map((q) => {
        const qs = portco.quarters[q];
        const c = quarterChip(portco, q);
        const w = qs.shortlist.find((x) => x.id === qs.portcoPick) ?? (qs.status !== "notStarted" ? qs.shortlist.find((x) => x.rank === 1) : undefined);
        return (
          <div key={q} className={`flex items-center justify-between gap-2 rounded-[10px] border px-3.5 py-2.5 ${BOX[c.tone]}`} data-testid={`quarter-${q}`} data-status={qs.status} data-final={c.locked ? "true" : "false"}>
            {w ? (
              <>
                <span className={`flex shrink-0 items-center gap-1 whitespace-nowrap text-[14px] font-bold ${TEXT[c.tone]}`}>
                  {c.locked ? <IconLock size={12} /> : null}
                  {quarterLabel(q, portco.targetQuarters)}
                </span>
                <span className="min-w-0 truncate text-[14px] font-semibold">{fmtWindow(w)}</span>
                <span className={`shrink-0 text-[13px] ${TEXT[c.tone]}`}>{c.caption}</span>
              </>
            ) : (
              <>
                <span className="whitespace-nowrap text-[14px] font-bold text-idle">
                  {quarterLabel(q, portco.targetQuarters)} · {quarterMonthsShort(q)}
                </span>
                <span className="text-[14px] text-idle-text">No date yet</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
