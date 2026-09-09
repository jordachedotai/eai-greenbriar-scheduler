"use client";

// Hidden presenter menu. Shift+P toggles it. Never shown to the room by
// default. Simulations act on the open portco, or the first card if none.

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  simulateBoardConfirmAll,
  simulateBoardConflict,
  simulateInternalApprovals,
  simulatePortcoReply,
} from "@/lib/actions";
import { getDemoStates } from "@/lib/data";
import { portcoStage } from "@/lib/pipeline";
import { STAGE_NAMES } from "@/lib/types";

export function PresenterMenu() {
  const open = useStore((s) => s.presenterOpen);
  const setOpen = useStore((s) => s.setPresenterOpen);
  const selected = useStore((s) => s.selectedPortcoId);
  const portcos = useStore((s) => s.portcos);
  const mockMode = useStore((s) => s.mockMode);
  const setMockMode = useStore((s) => s.setMockMode);
  const reset = useStore((s) => s.reset);
  const loadState = useStore((s) => s.loadState);
  const working = useStore((s) => s.working);

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
  const target = selected ?? Object.keys(portcos)[0];
  const portco = portcos[target];
  const stage = portco ? portcoStage(portco) : 0;
  const states = getDemoStates();

  const Item = ({ label, onClick, disabled, testId }: { label: string; onClick: () => void; disabled?: boolean; testId: string }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !!working}
      data-testid={testId}
      className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-left text-[12.5px] hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-20 left-4 z-50 w-[300px] rounded-lg border border-line bg-bg p-3 shadow-2xl" data-testid="presenter-menu">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-mut">Presenter</div>
        <button type="button" className="text-[11px] text-mut hover:text-txt" onClick={() => setOpen(false)}>
          Close (Shift+P)
        </button>
      </div>
      <div className="mb-2 text-[12px] text-mut">
        Acting on <span className="text-txt">{portco?.name ?? "no portco"}</span>
        {portco ? <span> · stage {stage}, {STAGE_NAMES[stage]}</span> : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Item label="Simulate partner sign-offs" onClick={() => simulateInternalApprovals(target)} disabled={stage !== 3} testId="sim-approvals" />
        <Item label="Simulate portco reply" onClick={() => simulatePortcoReply(target)} disabled={stage !== 4 || !portco?.drafts.portcoEmail?.approved} testId="sim-portco-reply" />
        <Item label="Simulate board replies, all confirm" onClick={() => simulateBoardConfirmAll(target)} disabled={stage !== 5 || !portco?.drafts.boardEmail?.approved} testId="sim-board-confirm" />
        <Item label="Simulate board conflict, one declines Q3" onClick={() => void simulateBoardConflict(target)} disabled={stage !== 5 || !portco?.drafts.boardEmail?.approved} testId="sim-board-conflict" />
        <div className="my-1 border-t border-line" />
        <label className="flex items-center justify-between px-1 text-[12.5px]">
          <span>Mode</span>
          <button
            type="button"
            className="rounded border border-line bg-panel px-2 py-0.5 text-[11.5px]"
            onClick={() => setMockMode(!mockMode)}
            data-testid="toggle-mode"
          >
            {mockMode ? "Demo data (offline)" : "Live agent"}
          </button>
        </label>
        <label className="flex items-center justify-between px-1 text-[12.5px]">
          <span>Jump to state</span>
          <select
            className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11.5px]"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) loadState(e.target.value);
              e.target.value = "";
            }}
            data-testid="jump-state"
          >
            <option value="">Choose</option>
            {Object.entries(states).map(([k, v]) => (
              <option key={k} value={k} title={v.description}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <div className="px-1 text-[11px] leading-snug text-mut">
          {Object.entries(states).map(([k, v]) => (
            <div key={k}>
              <span className="text-txt">{k}</span>: {v.description}
            </div>
          ))}
        </div>
        <label className="hidden">
          <select>
          </select>
        </label>
        <Item label="Reset demo" onClick={() => reset()} testId="presenter-reset" />
      </div>
    </div>
  );
}
