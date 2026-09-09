"use client";

// Three counts plus one goal, per reference/design/Main.dc.html. Clicking a
// count filters the list.

import { useStore } from "@/lib/store";
import type { Bucket } from "@/lib/pipeline";
import { usePortcoList } from "./usePortcoList";

export function WorkStrip() {
  const { counts } = usePortcoList();
  const workFilter = useStore((s) => s.workFilter);
  const setWorkFilter = useStore((s) => s.setWorkFilter);
  const tiles: { key: Bucket; label: string; value: number; hint: string; dot: string; num: string }[] = [
    { key: "you", label: "Waiting on you", value: counts.you, hint: "a draft or a decision needs you", dot: "#2b5f9e", num: "text-you" },
    { key: "others", label: "Waiting on others", value: counts.others, hint: "partners, the company, or the board", dot: "#b9770c", num: "text-amber" },
    { key: "notStarted", label: "Not started", value: counts.notStarted, hint: "press Find dates to begin", dot: "#9aa89a", num: "text-txt" },
  ];
  return (
    <section aria-label="Work strip" className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
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
              "flex flex-col gap-1.5 rounded-[12px] border bg-white px-[18px] py-4 text-left shadow-[0_1px_2px_rgba(23,34,26,0.05)] transition " +
              (active ? "border-brand shadow-[0_0_0_1px_var(--color-brand)]" : "border-line hover:border-brand/50")
            }
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">
              <span className="h-2 w-2 rounded-full" style={{ background: t.dot }} />
              {t.label}
            </span>
            <span className={"serif text-[34px] font-semibold leading-none " + t.num} data-testid={`count-${t.key}`}>{t.value}</span>
            <span className="text-[14px] text-mut">{active ? "showing these, click to clear" : t.hint}</span>
          </button>
        );
      })}
      <div className="flex flex-col gap-1.5 rounded-[12px] border border-[#cfdfd2] bg-brand-soft px-[18px] py-4" data-testid="strip-confirmed">
        <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-brand">
          <span className="h-2 w-2 rounded-full bg-green" />
          Confirmed meetings
        </span>
        <span className="serif text-[34px] font-semibold leading-none text-brand2" data-testid="count-confirmed">
          {counts.confirmed} of {counts.total}
        </span>
        <span className="text-[14px] text-brand">for 2027, board confirmed or locked</span>
      </div>
    </section>
  );
}
