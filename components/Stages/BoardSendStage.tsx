"use client";

// Stage 5: board email draft, per-member confirmations, and the conflict
// path where a decline falls back to the next window on the shortlist.

import { useStore } from "@/lib/store";
import {
  allBoardConfirmed,
  approveBoardEmail,
  approveConflictResend,
  editDraft,
  lockAndPlan,
  openConflicts,
  regenerateBoardEmail,
} from "@/lib/actions";
import { getBoardMembers, personName } from "@/lib/data";
import { pickedWindow } from "@/lib/payloads";
import { fmtWindow } from "@/lib/scheduling";
import type { ConflictData, Portco } from "@/lib/types";
import { STAGE_BUTTONS } from "@/lib/types";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { StageFrame } from "./StageFrame";
import { shortName } from "./AvailabilityStage";

export function BoardSendStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => (s.working?.portcoId === portco.id ? s.working.label : null));
  const draft = portco.drafts.boardEmail;
  const sent = !!draft?.approved;
  const members = getBoardMembers(portco.id);
  const confirmed = allBoardConfirmed(portco);
  const conflicts = openConflicts(portco);
  const isConflictWork = !!working && working.toLowerCase().includes("shortlist");

  return (
    <StageFrame
      stage={5}
      hint={
        !sent
          ? "The email confirming the chosen dates with the board. Approve to send."
          : confirmed
            ? "Every board member confirmed every quarter. Lock the dates and plan logistics."
            : "Sent to the board. Replies land here. If a member declines, the agent proposes the next window from the approved shortlist and re-checks the partners."
      }
      button={{
        label: STAGE_BUTTONS[5],
        onClick: () => void lockAndPlan(portco.id),
        disabled: !confirmed || !!working,
        title: confirmed ? undefined : "Waiting on board confirmations",
      }}
    >
      <DraftViewer
        draft={draft}
        title="Confirmation email to the board"
        approveLabel="Approve and send"
        approvedLabel="Sent"
        onApprove={() => approveBoardEmail(portco.id)}
        onEdit={(t) => editDraft(portco.id, "boardEmail", t)}
        onRegenerate={() => void regenerateBoardEmail(portco.id)}
        working={isConflictWork ? null : working}
        testId="draft-board-email"
      />

      {sent ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-3" data-testid="board-matrix">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-mut">Board responses</div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[11px] text-mut">
                <th className="py-1 font-medium">Quarter</th>
                <th className="py-1 font-medium">Date</th>
                {members.map((m) => (
                  <th key={m.id} className="py-1 font-medium">{shortName(m.name)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portco.targetQuarters.map((q) => {
                const w = pickedWindow(portco, q);
                return (
                  <tr key={q} className="border-t border-line">
                    <td className="py-1.5 font-medium">{q}</td>
                    <td className="py-1.5">{w ? fmtWindow(w) : ""}</td>
                    {members.map((m) => {
                      const r = portco.quarters[q].boardResponses[m.id] ?? "pending";
                      return (
                        <td key={m.id} className="py-1.5" data-testid={`resp-${q}-${m.id}`} data-response={r}>
                          <span
                            className={
                              "rounded px-1.5 py-0.5 text-[11px] " +
                              (r === "confirmed" ? "bg-brand-soft text-brand" : r === "declined" ? "bg-red-soft text-red" : "bg-panel2 text-mut")
                            }
                          >
                            {r === "confirmed" ? "Yes" : r === "declined" ? "Declined" : "Pending"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {isConflictWork ? <Working label={working as string} /> : null}

      {conflicts.map((q) => {
        const d = portco.drafts[`conflict:${q}`];
        const data = d?.data as ConflictData | undefined;
        if (!d || !data) return null;
        const fallback = portco.quarters[q].shortlist.find((w) => w.id === data.fallbackWindowId);
        return (
          <div key={q} className="rounded-lg border border-amber/40 bg-amber-soft/40 p-3" data-testid={`conflict-${q}`}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber">Conflict in {q}</div>
            <p className="text-[13px]" data-testid="conflict-note">{data.note}</p>
            <div className="mt-2 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-[12px]">
              <span className="text-mut">Declined</span>
              <span>
                {personName(data.memberId)}, {fmtWindow(portco.quarters[q].shortlist.find((w) => w.id === data.declinedWindowId) as NonNullable<typeof fallback>)}
              </span>
              <span className="text-mut">Proposed</span>
              <span>{fallback ? `${fmtWindow(fallback)} (option ${fallback.rank} on the approved shortlist)` : "No other window on the shortlist"}</span>
              <span className="text-mut">Re-checked</span>
              <span data-testid="reverify">
                {data.reverify.ok
                  ? `All partners still free: ${portco.partnerIds.map((id) => shortName(personName(id))).join(", ")}`
                  : `Now busy: ${data.reverify.busy.map(personName).join(", ")}`}
              </span>
            </div>
            <div className="mt-3">
              <DraftViewer
                draft={d}
                title={`Re-send to the board for ${q}`}
                approveLabel="Approve re-send"
                approvedLabel="Sent"
                onApprove={() => approveConflictResend(portco.id, q)}
                onEdit={(t) => editDraft(portco.id, `conflict:${q}`, t)}
                disabled={!fallback}
                testId="draft-conflict"
              />
            </div>
          </div>
        );
      })}
    </StageFrame>
  );
}
