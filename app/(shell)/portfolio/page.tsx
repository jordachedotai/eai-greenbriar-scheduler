"use client";

import { useStore } from "@/lib/store";
import { WorkStrip } from "@/components/Portcos/WorkStrip";
import { RowsView } from "@/components/Portcos/RowsView";
import { BoardView } from "@/components/Portcos/BoardView";

export default function PortcosPage() {
  const view = useStore((s) => s.view);
  // Rows keep a comfortable reading width. The board fills the main area.
  return (
    <div className={(view === "rows" ? "mx-auto max-w-[1400px] " : "") + "px-7 py-[22px]"}>
      <WorkStrip />
      <div className="mt-5">{view === "rows" ? <RowsView /> : <BoardView />}</div>
    </div>
  );
}
