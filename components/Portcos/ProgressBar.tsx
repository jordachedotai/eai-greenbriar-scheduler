import type { Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import type { Tone } from "./status";

// Five 14px dots with 2px connectors. Done filled brand, current a white
// dot with a 3px ring in the status color, future a 2px gray ring. All
// green once locked.
export function ProgressBar({ stage, done, tone }: { stage: Stage; done: boolean; tone: Tone }) {
  const ring = tone === "you" ? "#2b5f9e" : tone === "wait" ? "#b9770c" : "#1f5a2d";
  return (
    <div className="flex items-center" data-testid="progress" data-stage={stage}>
      {STAGES.map((s, i) => {
        const state = done ? "locked" : s < stage ? "done" : s === stage ? "current" : "future";
        const style: React.CSSProperties =
          state === "locked"
            ? { background: "#1f9d57" }
            : state === "done"
              ? { background: "#1f5a2d" }
              : state === "current"
                ? { background: "#ffffff", border: `3px solid ${ring}`, boxSizing: "border-box" }
                : { background: "#ffffff", border: "2px solid #c9d3c8", boxSizing: "border-box" };
        const lineColor = done ? "#1f9d57" : s < stage ? "#1f5a2d" : "#dde3da";
        return (
          <span key={s} className="contents">
            <span data-step={s} data-state={state} style={{ width: 14, height: 14, borderRadius: 999, ...style }} className="shrink-0" />
            {i < STAGES.length - 1 ? <span style={{ height: 2, background: lineColor }} className="flex-1" /> : null}
          </span>
        );
      })}
    </div>
  );
}
