"use client";

// Stage 3: internal approval. A human gate. No agent.

import { useStore } from "@/lib/store";
import { allInternalApproved, markInternalApproval, sendToPortco } from "@/lib/actions";
import { getPartner } from "@/lib/data";
import type { Portco } from "@/lib/types";
import { STAGE_BUTTONS } from "@/lib/types";
import { ghost } from "@/components/Drafts/DraftViewer";
import { StageFrame } from "./StageFrame";

export function ApprovalStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => s.working);
  const ready = allInternalApproved(portco);
  const firstQ = portco.targetQuarters[0];
  return (
    <StageFrame
      stage={3}
      hint="Before anything goes to the portco, every partner signs off on the one-pager. Record each sign-off as it arrives. The presenter menu can simulate them."
      button={{
        label: STAGE_BUTTONS[3],
        onClick: () => void sendToPortco(portco.id),
        disabled: !ready || !!working,
        title: ready ? undefined : "Waiting on partner sign-off",
      }}
    >
      <ul className="flex flex-col gap-1.5" data-testid="approval-list">
        {portco.partnerIds.map((pid) => {
          const p = getPartner(pid);
          const ok = !!portco.quarters[firstQ].internalApprovals[pid];
          return (
            <li key={pid} className="flex items-center justify-between rounded border border-line bg-bg px-3 py-2 text-[12.5px]">
              <span>
                {p?.name ?? pid} <span className="text-mut">· {p?.title}</span>
              </span>
              {ok ? (
                <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand" data-testid={`approved-${pid}`}>
                  Signed off
                </span>
              ) : (
                <button type="button" className={ghost} onClick={() => markInternalApproval(portco.id, pid)} data-testid={`mark-${pid}`}>
                  Mark signed off
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <details className="text-[12px] text-mut">
        <summary className="cursor-pointer">Approved one-pager</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded border border-line bg-bg p-3 font-[inherit] text-[12.5px] text-txt">
          {portco.drafts.onepager?.text}
        </pre>
      </details>
    </StageFrame>
  );
}
