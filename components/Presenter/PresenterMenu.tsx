"use client";

// Presenter menu, per reference/design/Decline.dc.html. Shift+P or the
// header icon. Dark brand-green panel, bottom right. "Simulate for this
// company" lists the steps in order for the company on screen: done ones
// dimmed, the next one highlighted. Then the demo controls.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getBoardMembers, getDemoStates } from "@/lib/data";
import { allAccepted, allBoardConfirmed, allPartnersYes, allPicked, inviteCounts, invitesOut, openConflicts, portcoPhase, portcoStage } from "@/lib/pipeline";
import { boardMembersOf } from "@/lib/pipeline";
import { simulateBoardConfirms, simulateBoardConflict, simulateInvites, simulatePartnerReplies, simulatePortcoPicks } from "@/lib/actions";
import { conflictQuarter } from "@/lib/simulate";
import { quarterLabel } from "@/lib/quarters";
import type { Portco } from "@/lib/types";
import { IconChevronDown, IconChevronRight, IconPresenter } from "@/components/ui/icons";

type Step = { key: string; label: string; state: "done" | "next" | "later" | "off"; note?: string; run?: () => void };

function stepsFor(p: Portco | undefined): Step[] {
  if (!p) return [];
  const members = boardMembersOf(p);
  const stage = portcoStage(p);
  const phase = portcoPhase(p, members);
  const conflicts = openConflicts(p);
  const anyDeclined = p.targetQuarters.some((q) => members.some((m) => p.quarters[q].boardResponses[m.id] === "declined"));
  const declineDone = anyDeclined || Object.keys(p.drafts).some((k) => k.startsWith("conflict:"));
  const boardDone = allBoardConfirmed(p, members) || stage === 5;
  const steps: Step[] = [
    {
      key: "partners",
      label: "Partner replies",
      state: allPartnersYes(p) || stage > 2 ? "done" : phase === "waiting" && p.waitingOn === "partners" ? "next" : "later",
      run: () => simulatePartnerReplies(p.id),
    },
    {
      key: "picks",
      label: "Company picks",
      state: allPicked(p) || stage > 3 ? "done" : phase === "waiting" && p.waitingOn === "portco" ? "next" : "later",
      run: () => simulatePortcoPicks(p.id),
    },
    {
      key: "conflict",
      label: `Board conflict, one declines ${quarterLabel(conflictQuarter(p), p.targetQuarters)}`,
      state: declineDone ? "done" : phase === "waiting" && p.waitingOn === "board" ? "next" : "later",
      run: () => void simulateBoardConflict(p.id),
    },
    {
      key: "confirms",
      label: declineDone ? "Board confirms the re-send" : "Board confirms",
      state: boardDone ? "done" : phase === "waiting" && p.waitingOn === "board" && conflicts.length === 0 ? "next" : "later",
      run: () => simulateBoardConfirms(p.id),
    },
    {
      key: "invites",
      label: "Invites accepted",
      state: !invitesOut(p) ? "off" : inviteCounts(p, members).replied ? "done" : "next",
      note: "after sending",
      run: () => simulateInvites(p.id, "mixed"),
    },
    {
      key: "invites-all",
      label: "Stragglers reply, all accepted",
      state: !invitesOut(p) || !inviteCounts(p, members).replied ? "off" : allAccepted(p, members) ? "done" : "next",
      note: "after replies",
      run: () => simulateInvites(p.id, "all"),
    },
  ];
  // Only one step is "next": the first one marked next; the conflict step
  // and the confirms step can both be actionable, so the conflict wins
  // while no decline has happened, and the confirms step stays clickable.
  let seen = false;
  for (const s of steps) {
    if (s.state === "next") {
      if (seen) s.state = "later";
      seen = true;
    }
  }
  return steps;
}

export function PresenterMenu() {
  const open = useStore((s) => s.presenterOpen);
  const setOpen = useStore((s) => s.setPresenterOpen);
  const mockMode = useStore((s) => s.mockMode);
  const setMockMode = useStore((s) => s.setMockMode);
  const showDemoTag = useStore((s) => s.showDemoTag);
  const setShowDemoTag = useStore((s) => s.setShowDemoTag);
  const reset = useStore((s) => s.reset);
  const loadState = useStore((s) => s.loadState);
  const working = useStore((s) => s.working);
  const pathname = usePathname();
  const id = pathname.startsWith("/portfolio/") ? pathname.split("/")[2] : undefined;
  const portco = useStore((s) => (id ? s.portcos[id] : undefined));
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
  const steps = stepsFor(portco);
  // The board step can be run while a re-send is out too (after approving it).
  const rowBase = "flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[15px]";

  return (
    <div className="fixed bottom-[92px] right-7 z-50 flex w-[340px] flex-col overflow-hidden rounded-[14px] bg-header text-white shadow-[0_18px_48px_-12px_rgba(20,63,31,0.55),inset_0_0_0_1px_rgba(255,255,255,0.08)]" data-testid="presenter-menu">
      <div className="flex items-center justify-between border-b border-white/12 px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <IconPresenter size={18} />
          <span className="text-[15px] font-semibold">Presenter</span>
        </div>
        <button type="button" className="text-[12px] text-white/60 hover:text-white" onClick={() => setOpen(false)}>Shift+P to close</button>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <span className="px-1.5 pt-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-white/55">Simulate for this company</span>
        {!portco ? (
          <div className={rowBase + " bg-white/6 text-white/60"}>Open a company to simulate its replies.</div>
        ) : (
          steps.map((s) => {
            const testId = `sim-${s.key === "partners" ? "partner-replies" : s.key === "picks" ? "portco-picks" : s.key === "conflict" ? "board-conflict" : s.key === "confirms" ? "board-confirms" : s.key}`;
            if (s.state === "next" || (s.key === "confirms" && portco.waitingOn === "board" && !working)) {
              const next = s.state === "next";
              return (
                <button key={s.key} type="button" onClick={s.run} disabled={!!working} data-testid={testId} data-state={s.state} className={rowBase + (next ? " bg-white/14 font-semibold hover:bg-white/20" : " bg-white/6 text-white/70 hover:bg-white/12") + " disabled:opacity-50"}>
                  <span>{s.label}</span>
                  <IconChevronRight size={16} />
                </button>
              );
            }
            return (
              <div key={s.key} data-testid={testId} data-state={s.state} className={rowBase + " bg-white/6 text-white/45"}>
                <span>{s.label}</span>
                <span className="text-[12px]">{s.state === "done" ? "done" : s.note ?? "later"}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-white/12 px-3 pb-3 pt-1">
        <span className="px-1.5 pb-0.5 pt-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-white/55">Demo</span>
        <label className={rowBase}>
          <span>Jump to state</span>
          <span className="relative inline-flex items-center gap-1.5 rounded-[6px] bg-white/12 px-2.5 py-1 text-[13px]">
            <select
              className="absolute inset-0 cursor-pointer opacity-0"
              defaultValue=""
              disabled={!!working}
              onChange={(e) => {
                if (e.target.value) {
                  loadState(e.target.value);
                  router.push("/portfolio");
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
            council
            <IconChevronDown size={12} />
          </span>
        </label>
        <div className={rowBase}>
          <span>Agent</span>
          <button type="button" className="rounded-[6px] bg-white/12 px-2.5 py-1 text-[13px] hover:bg-white/20" onClick={() => setMockMode(!mockMode)} data-testid="toggle-mode">
            {mockMode ? "Demo data, offline" : "Live"}
          </button>
        </div>
        <div className={rowBase}>
          <span>Show demo tag in header</span>
          <button
            type="button"
            role="switch"
            aria-checked={showDemoTag}
            onClick={() => setShowDemoTag(!showDemoTag)}
            data-testid="toggle-demo-tag"
            className={"inline-flex h-5 w-9 items-center rounded-full p-0.5 transition " + (showDemoTag ? "justify-end bg-green" : "justify-start bg-white/25")}
          >
            <span className="h-4 w-4 rounded-full bg-white" />
          </button>
        </div>
        <button
          type="button"
          className="mt-1 rounded-[8px] border border-white/25 px-3 py-2.5 text-[15px] font-semibold hover:bg-white/10 disabled:opacity-40"
          disabled={!!working}
          onClick={() => {
            reset();
            router.push("/portfolio");
          }}
          data-testid="presenter-reset"
        >
          Reset to council state
        </button>
      </div>
    </div>
  );
}
