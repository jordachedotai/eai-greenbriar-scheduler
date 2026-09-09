"use client";

// Presenter menu. Shift+P or the header icon. Reset, jump to state,
// mock or live, show or hide the demo buttons.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getDemoStates } from "@/lib/data";

export function PresenterMenu() {
  const open = useStore((s) => s.presenterOpen);
  const setOpen = useStore((s) => s.setPresenterOpen);
  const mockMode = useStore((s) => s.mockMode);
  const setMockMode = useStore((s) => s.setMockMode);
  const showDemo = useStore((s) => s.showDemoButtons);
  const setShowDemo = useStore((s) => s.setShowDemoButtons);
  const reset = useStore((s) => s.reset);
  const loadState = useStore((s) => s.loadState);
  const working = useStore((s) => s.working);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
      if (e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setOpen(!useStore.getState().presenterOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;
  const states = getDemoStates();
  const row = "flex items-center justify-between gap-2 px-1 text-[12.5px]";
  const btn = "rounded border border-line bg-panel px-2 py-0.5 text-[11.5px] hover:border-brand disabled:opacity-40";

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] rounded-lg border border-line bg-bg p-3 shadow-2xl" data-testid="presenter-menu">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-mut">Presenter</div>
        <button type="button" className="text-[11px] text-mut hover:text-txt" onClick={() => setOpen(false)}>Close (Shift+P)</button>
      </div>
      <div className="flex flex-col gap-2">
        <label className={row}>
          <span>Jump to state</span>
          <select
            className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11.5px]"
            defaultValue=""
            disabled={!!working}
            onChange={(e) => {
              if (e.target.value) {
                loadState(e.target.value);
                router.push("/portcos");
              }
              e.target.value = "";
            }}
            data-testid="jump-state"
          >
            <option value="">Choose</option>
            {Object.keys(states).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <div className="px-1 text-[11px] leading-snug text-mut">
          {Object.entries(states).map(([k, v]) => (
            <div key={k}><span className="text-txt">{k}</span>: {v.description}</div>
          ))}
        </div>
        <div className={row}>
          <span>Agent</span>
          <button type="button" className={btn} onClick={() => setMockMode(!mockMode)} data-testid="toggle-mode">
            {mockMode ? "Demo data (offline)" : "Live"}
          </button>
        </div>
        <div className={row}>
          <span>Demo buttons</span>
          <button type="button" className={btn} onClick={() => setShowDemo(!showDemo)} data-testid="toggle-demo-buttons">
            {showDemo ? "Shown" : "Hidden"}
          </button>
        </div>
        <button
          type="button"
          className="mt-1 w-full rounded border border-line bg-panel px-2.5 py-1.5 text-left text-[12.5px] hover:border-brand disabled:opacity-40"
          disabled={!!working}
          onClick={() => {
            reset();
            router.push("/portcos");
          }}
          data-testid="presenter-reset"
        >
          Reset to council state
        </button>
      </div>
    </div>
  );
}
