"use client";

// Stage 4. Board email, per-member confirmations, and the conflict path.

import { simulateBoardConfirms, simulateBoardConflict } from "@/lib/actions";
import { personName } from "@/lib/data";
import { joinNames, shortName } from "@/lib/format";
import { allBoardConfirmed, openConflicts } from "@/lib/pipeline";
import { fmtWindow } from "@/lib/scheduling";
import type { ConflictData } from "@/lib/types";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { SimulateButton } from "@/components/Presenter/SimulateButton";
import { useDetail } from "@/components/Detail/DetailContext";
import { Explain, Section, WaitingState } from "./shared";

export function BoardConfirms({ readOnly }: { readOnly: boolean }) {
  const { portco, members, phase, working } = useDetail();
  const names = joinNames(members.map((m) => m.name));
  const draft = portco.drafts.boardEmail;
  const confirmed = allBoardConfirmed(portco, members);
  const conflicts = openConflicts(portco);
  const anyDeclined = portco.targetQuarters.some((q) => members.some((m) => portco.quarters[q].boardResponses[m.id] === "declined"));
  const conflictWorking = !!working && phase !== "needsDraft" && !!draft?.approved;

  return (
    <div>
      <Explain>
        {readOnly || confirmed
          ? `${names} confirmed every quarter.`
          : phase === "conflict"
            ? "A board member declined a date. The agent went back to the shortlist the partners approved, proposed the next window, and re-checked the partners. Read the re-send and approve it."
            : phase === "waiting"
              ? `Sent to ${names}. Each member confirms the four dates. If one declines, the agent proposes the next window from the approved shortlist.`
              : working
                ? `${names} confirm the dates ${portco.execContact.name} picked.`
                : `${names} confirm the dates ${portco.execContact.name} picked. Read the email and approve it to send.`}
        {!readOnly && confirmed ? " Press Lock and book." : ""}
      </Explain>

      {!readOnly && phase === "waiting" ? (
        <WaitingState>
          <SimulateButton label="simulate board confirms" onClick={() => simulateBoardConfirms(portco.id)} testId="sim-board-confirms" />
          {!anyDeclined ? <SimulateButton label="simulate board conflict" onClick={() => void simulateBoardConflict(portco.id)} testId="sim-board-conflict" /> : null}
        </WaitingState>
      ) : null}

      {conflictWorking && conflicts.length === 0 ? <Working label={working as string} /> : null}

      {conflicts.map((q) => {
        const d = portco.drafts[`conflict:${q}`];
        const data = d?.data as ConflictData | undefined;
        if (!d || !data) return null;
        const declined = portco.quarters[q].shortlist.find((w) => w.id === data.declinedWindowId);
        const fallback = portco.quarters[q].shortlist.find((w) => w.id === data.fallbackWindowId);
        return (
          <div key={q} className="mb-4 rounded-lg border border-amber/40 bg-amber-soft/40 p-3" data-testid={`conflict-${q}`}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber">{personName(data.memberId)} declined {q}</div>
            <p className="text-[13px]" data-testid="conflict-note">{data.note}</p>
            <div className="mt-2 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-[12px]">
              <span className="text-mut">Declined</span>
              <span>{declined ? fmtWindow(declined) : ""}</span>
              <span className="text-mut">Proposed</span>
              <span>{fallback ? `${fmtWindow(fallback)}, option ${fallback.rank} on the shortlist the partners approved` : "No other window on the shortlist"}</span>
              <span className="text-mut">Re-checked</span>
              <span data-testid="reverify">
                {data.reverify.ok
                  ? `${joinNames(portco.partnerIds.map((id) => shortName(personName(id))))} still free`
                  : `Now busy: ${joinNames(data.reverify.busy.map(personName))}`}
              </span>
            </div>
            <div className="mt-3">
              <DraftViewer draftKey={`conflict:${q}`} title={`Re-send to the board for ${q}`} testId="draft-conflict" />
            </div>
          </div>
        );
      })}

      {draft?.approved || readOnly ? (
        <Section title="Board replies" testId="board-matrix">
          <div className="overflow-x-auto rounded-lg border border-line bg-panel">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[11px] text-mut">
                  <th className="px-3 py-1.5 font-medium">Quarter</th>
                  <th className="px-3 py-1.5 font-medium">Date</th>
                  {members.map((m) => (
                    <th key={m.id} className="px-3 py-1.5 font-medium">{shortName(m.name)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portco.targetQuarters.map((q) => {
                  const qs = portco.quarters[q];
                  const w = qs.shortlist.find((x) => x.id === qs.portcoPick);
                  return (
                    <tr key={q} className="border-t border-line">
                      <td className="px-3 py-1.5 font-medium">{q}</td>
                      <td className="px-3 py-1.5">{w ? fmtWindow(w) : ""}</td>
                      {members.map((m) => {
                        const r = qs.status === "boardConfirmed" || qs.status === "locked" ? "confirmed" : (qs.boardResponses[m.id] ?? "pending");
                        return (
                          <td key={m.id} className="px-3 py-1.5" data-testid={`resp-${q}-${m.id}`} data-response={r}>
                            <span className={"rounded px-1.5 py-0.5 text-[11px] " + (r === "confirmed" ? "bg-brand-soft text-brand" : r === "declined" ? "bg-red-soft text-red" : "bg-panel2 text-mut")}>
                              {r === "confirmed" ? "Yes" : r === "declined" ? "Declined" : "No reply yet"}
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
        </Section>
      ) : null}

      <Section title="Email to the board">
        {working && !draft ? <Working label={working} /> : <DraftViewer draftKey="boardEmail" title={`To ${names}`} />}
      </Section>
    </div>
  );
}
