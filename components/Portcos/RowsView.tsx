"use client";

import { PortcoRow, ROW_GRID } from "./PortcoRow";
import { usePortcoList } from "./usePortcoList";

export function RowsView() {
  const { visible } = usePortcoList();
  return (
    <section aria-label="Portfolio" className="flex flex-col gap-3" data-testid="rows-view">
      <div className="grid gap-4 px-5 text-[13px] font-semibold uppercase tracking-[0.04em] text-mut" style={{ gridTemplateColumns: ROW_GRID }}>
        <span>Company</span>
        <span>Progress</span>
        <span>2027 quarters</span>
        <span>Status</span>
        <span className="text-right">Next</span>
      </div>
      {visible.map((p) => (
        <PortcoRow key={p.id} portco={p} />
      ))}
      {visible.length === 0 ? <div className="rounded-[14px] border border-dashed border-line px-4 py-10 text-center text-[15px] text-mut">No portfolio companies here.</div> : null}
    </section>
  );
}
