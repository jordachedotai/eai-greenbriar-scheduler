import type { Stage } from "@/lib/types";
import { STAGE_NAMES, STAGES } from "@/lib/types";

// Five steps. Done filled, current outlined, future muted.
export function ProgressBar({ stage, done }: { stage: Stage; done: boolean }) {
  return (
    <div className="flex items-center gap-1" title={done ? "All five steps done" : `Step ${stage} of 5: ${STAGE_NAMES[stage]}`} data-testid="progress">
      {STAGES.map((s) => {
        const state = done || s < stage ? "done" : s === stage ? "current" : "future";
        return (
          <span
            key={s}
            data-step={s}
            data-state={state}
            className={
              "h-1.5 flex-1 rounded-full " +
              (state === "done" ? "bg-brand" : state === "current" ? "bg-brand/30 ring-1 ring-brand" : "bg-line")
            }
          />
        );
      })}
    </div>
  );
}
