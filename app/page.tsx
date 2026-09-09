"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { MetricsStrip } from "@/components/Metrics/MetricsStrip";
import { Board } from "@/components/Board/Board";
import { PortcoDrawer } from "@/components/PortcoDetail/PortcoDrawer";
import { PresenterMenu } from "@/components/Presenter/PresenterMenu";

export default function Page() {
  // Wait for the persisted store to load so server and client markup match.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const reset = useStore((s) => s.reset);
  const mockMode = useStore((s) => s.mockMode);

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-4">
      <header className="mb-4 flex items-end justify-between border-b-2 border-brand/80 pb-3">
        <div className="flex items-end gap-4">
          <Image src="/greenbriar-logo.png" alt="Greenbriar" width={154} height={25} priority />
          <div>
            <h1 className="text-[18px] font-semibold leading-tight">Portco meeting scheduler</h1>
            <div className="text-[12px] text-mut">Quarterly meetings, 2027. Five portfolio companies.</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-mut">
          <span className="rounded border border-line bg-panel px-2 py-0.5" data-testid="mode-tag">
            {mockMode ? "Demo data" : "Live agent"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset the demo? This clears every portco back to Setup.")) reset();
            }}
            className="rounded border border-line bg-panel px-2.5 py-1 hover:text-txt"
            data-testid="reset-demo"
          >
            Reset demo
          </button>
        </div>
      </header>

      {ready ? (
        <>
          <div className="mb-4">
            <MetricsStrip />
          </div>
          <Board />
          <PortcoDrawer />
          <PresenterMenu />
        </>
      ) : (
        <div className="py-20 text-center text-mut">Loading</div>
      )}
    </main>
  );
}
