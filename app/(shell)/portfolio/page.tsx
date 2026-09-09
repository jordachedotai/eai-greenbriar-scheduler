"use client";

import { useStore } from "@/lib/store";
import { WorkStrip } from "@/components/Portcos/WorkStrip";
import { RowsView } from "@/components/Portcos/RowsView";
import { BoardView } from "@/components/Portcos/BoardView";

export default function PortcosPage() {
  const view = useStore((s) => s.view);
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-4">
      <WorkStrip />
      <div className="mt-4">{view === "rows" ? <RowsView /> : <BoardView />}</div>
    </div>
  );
}
