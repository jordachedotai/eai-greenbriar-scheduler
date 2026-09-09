"use client";

// Replaces the v1 metrics tiles. Three counts plus one goal. Clicking a
// count filters the list.

import { useStore } from "@/lib/store";
import type { Bucket } from "@/lib/pipeline";
import { usePortcoList } from "./usePortcoList";

export function WorkStrip() {
  const { counts } = usePortcoList();
  const workFilter = useStore((s) => s.workFilter);
  const setWorkFilter = useStore((s) => s.setWorkFilter);
  const tiles: { key: Bucket; label: string; value: number; hint: string; tone: string }[] = [
    { key: "you", label: "Waiting on you", value: counts.you, hint: "a draft or a decision needs you", tone: "text-brand" },
    { key: "others", label: "Waiting on others", value: counts.others, hint: "partners, the portco, or the board", tone: "text-amber" },
    { key: "notStarted", label: "Not started", value: counts.notStarted, hint: "press Find dates to begin", tone: "text-txt" },
  ];
  return (
    <section aria-label="Work strip" className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {tiles.map((t) => {
        const active = workFilter === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => setWorkFilter(active ? null : t.key)}
            data-testid={`strip-${t.key}`}
            aria-pressed={active}
            className={
              "rounded-lg border bg-panel px-3 py-2.5 text-left transition " +
              (active ? "border-brand shadow-[0_0_0_1px_var(--color-brand)]" : "border-line hover:border-brand/50")
            }
          >
            <div className="text-[10.5px] uppercase tracking-wide text-mut">{t.label}</div>
            <div className={"mt-0.5 text-[22px] font-semibold leading-tight " + t.tone} data-testid={`count-${t.key}`}>
              {t.value}
            </div>
            <div className="text-[11px] text-mut">{active ? "showing these, click to clear" : t.hint}</div>
          </button>
        );
      })}
      <div className="rounded-lg border border-line bg-panel px-3 py-2.5" data-testid="strip-confirmed">
        <div className="text-[10.5px] uppercase tracking-wide text-mut">Confirmed meetings</div>
        <div className="mt-0.5 text-[22px] font-semibold leading-tight text-brand" data-testid="count-confirmed">
          {counts.confirmed} of {counts.total}
        </div>
        <div className="text-[11px] text-mut">for 2027, board confirmed or locked</div>
      </div>
    </section>
  );
}
