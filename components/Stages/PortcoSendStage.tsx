"use client";

// Stage 4: proposal email draft, then the portco's picks.

import { useStore } from "@/lib/store";
import { allPicked, approvePortcoEmail, editDraft, regeneratePortcoEmail, sendToBoard } from "@/lib/actions";
import { pickedWindow } from "@/lib/payloads";
import { fmtWindow } from "@/lib/scheduling";
import type { Portco } from "@/lib/types";
import { STAGE_BUTTONS } from "@/lib/types";
import { DraftViewer } from "@/components/Drafts/DraftViewer";
import { StageFrame } from "./StageFrame";

export function PortcoSendStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => (s.working?.portcoId === portco.id ? s.working.label : null));
  const draft = portco.drafts.portcoEmail;
  const sent = !!draft?.approved;
  const picked = allPicked(portco);
  return (
    <StageFrame
      stage={4}
      hint={
        sent
          ? picked
            ? `${portco.execContact.name} picked one window per quarter. Send the dates to the board.`
            : `Proposal sent to ${portco.execContact.name}. Waiting for their picks. The presenter menu can simulate the reply.`
          : `The cover email that goes to ${portco.execContact.name} with the one-pager attached. Approve to send.`
      }
      button={{
        label: STAGE_BUTTONS[4],
        onClick: () => void sendToBoard(portco.id),
        disabled: !picked || !!working,
        title: picked ? undefined : "Waiting for the portco to pick dates",
      }}
    >
      <DraftViewer
        draft={draft}
        title={`Proposal email to ${portco.execContact.name}`}
        approveLabel="Approve and send"
        approvedLabel="Sent"
        onApprove={() => approvePortcoEmail(portco.id)}
        onEdit={(t) => editDraft(portco.id, "portcoEmail", t)}
        onRegenerate={() => void regeneratePortcoEmail(portco.id)}
        working={working}
        testId="draft-portco-email"
      />
      {sent ? (
        <div className="rounded-lg border border-line bg-bg p-3" data-testid="portco-picks">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-mut">Portco picks</div>
          <ul className="flex flex-col gap-1 text-[12.5px]">
            {portco.targetQuarters.map((q) => {
              const w = pickedWindow(portco, q);
              return (
                <li key={q} className="flex gap-3">
                  <span className="w-8 font-medium">{q}</span>
                  {w ? (
                    <span>
                      {fmtWindow(w)} <span className="text-mut">(option {w.rank})</span>
                    </span>
                  ) : (
                    <span className="text-mut">Waiting for reply</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </StageFrame>
  );
}
