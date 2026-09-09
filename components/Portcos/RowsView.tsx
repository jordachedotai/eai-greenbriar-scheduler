"use client";

import { useStore } from "@/lib/store";
import { PortcoRow } from "./PortcoRow";
import { usePortcoList } from "./usePortcoList";

export function RowsView() {
  const { visible } = usePortcoList();
  const eaFilter = useStore((s) => s.eaFilter);
  return (
    <section aria-label="Portcos" className="flex flex-col gap-2" data-testid="rows-view">
      <div
        className="grid px-4 text-[10.5px] uppercase tracking-wide text-mut"
        style={{ gridTemplateColumns: eaFilter === "all" ? "220px 110px 150px 1fr 190px 190px" : "220px 150px 1fr 190px 190px", gap: "16px" }}
      >
        <span>Portco</span>
        {eaFilter === "all" ? <span>EA</span> : null}
        <span>Progress</span>
        <span>2027 quarters</span>
        <span>Waiting on</span>
        <span className="text-right">Next action</span>
      </div>
      {visible.map((p) => (
        <PortcoRow key={p.id} portco={p} />
      ))}
      {visible.length === 0 ? <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-mut">Nothing here.</div> : null}
    </section>
  );
}
