"use client";

// Five 30px circles with 2px connectors. Done filled brand with a check,
// current a white circle with a 3px ring and a 4px halo, future a gray ring.
// Blue when the step needs the EA. Done steps open read-only.

import { STAGES, STAGE_NAMES } from "@/lib/types";
import { IconCheck } from "@/components/ui/icons";
import { useDetail } from "./DetailContext";

export function Stepper() {
  const { stage, phase, viewStep, setViewStep } = useDetail();
  const allDone = phase === "done";
  const you = phase === "conflict";
  const ring = you ? "#2b5f9e" : "#1f5a2d";
  const halo = you ? "#e5edf7" : "#e6efe7";
  return (
    <ol className="grid grid-cols-5" data-testid="stepper">
      {STAGES.map((s, i) => {
        const done = allDone || s < stage;
        const current = !allDone && s === stage;
        const viewing = viewStep === s;
        const leftLine = i === 0 ? "transparent" : done || current ? "#1f5a2d" : "#dde3da";
        const rightLine = i === STAGES.length - 1 ? "transparent" : done ? "#1f5a2d" : "#dde3da";
        return (
          <li key={s} className="flex flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span className="h-0.5 flex-1" style={{ background: leftLine }} />
              <button
                type="button"
                disabled={!done && !current}
                onClick={() => setViewStep(done ? (viewing ? null : s) : null)}
                data-testid={`step-${s}`}
                data-state={done ? "done" : current ? "current" : "future"}
                aria-current={current ? "step" : undefined}
                title={done ? `See what happened in ${STAGE_NAMES[s]}` : STAGE_NAMES[s]}
                className={"inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold " + (done ? "bg-brand text-white hover:bg-brand2" : "bg-white")}
                style={
                  current
                    ? { border: `3px solid ${ring}`, color: ring, boxShadow: `0 0 0 4px ${viewing ? halo : halo}` }
                    : done
                      ? viewing
                        ? { boxShadow: "0 0 0 4px #e6efe7" }
                        : undefined
                      : { border: "2px solid #c9d3c8", color: "#8a978a" }
                }
              >
                {done ? <IconCheck size={14} /> : s}
              </button>
              <span className="h-0.5 flex-1" style={{ background: rightLine }} />
            </div>
            <span className={"text-[14px] " + (current ? "font-semibold" : "font-medium")} style={{ color: done || current ? ring : "#8a978a" }}>
              {STAGE_NAMES[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
