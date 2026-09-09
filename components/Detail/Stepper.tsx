"use client";

import { STAGES, STAGE_NAMES } from "@/lib/types";
import { useDetail } from "./DetailContext";

export function Stepper() {
  const { stage, phase, viewStep, setViewStep } = useDetail();
  const allDone = phase === "done";
  return (
    <ol className="mt-3 flex gap-1" data-testid="stepper">
      {STAGES.map((s) => {
        const done = allDone || s < stage;
        const current = !allDone && s === stage;
        const viewing = viewStep === s;
        return (
          <li key={s} className="flex-1">
            <button
              type="button"
              disabled={!done && !current}
              onClick={() => setViewStep(done ? (viewing ? null : s) : null)}
              data-testid={`step-${s}`}
              data-state={done ? "done" : current ? "current" : "future"}
              aria-current={current ? "step" : undefined}
              className={
                "flex w-full items-center gap-2 border-b-2 px-1 pb-2 text-left text-[12.5px] " +
                (current ? "border-brand font-semibold text-txt" : done ? "border-brand/40 text-txt hover:border-brand" : "border-line text-mut") +
                (viewing ? " bg-brand-soft/60" : "")
              }
            >
              <span
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] " +
                  (done ? "bg-brand text-white" : current ? "border-2 border-brand text-brand" : "border border-line text-mut")
                }
              >
                {done ? "✓" : s}
              </span>
              <span className="truncate">{STAGE_NAMES[s]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
