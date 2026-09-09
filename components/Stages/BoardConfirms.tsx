"use client";

// Stage 4, per reference/design/Decline.dc.html when a member declines:
// the conflict card, the re-send as the only full-size draft, the sent
// email folded to one line, then the board replies table.

import { personName } from "@/lib/data";
import { fmtStamp, joinNames, shortName } from "@/lib/format";
import { activePartners, allBoardConfirmed, openConflicts } from "@/lib/pipeline";
import { fmtWindow } from "@/lib/scheduling";
import type { ConflictData } from "@/lib/types";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { useDetail } from "@/components/Detail/DetailContext";
import { Face, FaceStack, resolvePerson } from "@/components/ui/Face";
import { IconCheck } from "@/components/ui/icons";
import { PanelHeader, Pill, Section, WaitingState } from "./shared";

function sentAt(log: { at: string; text: string }[], text: string): string | undefined {
  return log.find((e) => e.text === text)?.at;
}

function confirmedStatus(s: string): boolean {
  return s === "boardConfirmed" || s === "locked" || s === "invited";
}

export function BoardConfirms({ readOnly }: { readOnly: boolean }) {
  const { portco, members, phase, working } = useDetail();
  const names = joinNames(members.map((m) => m.name));
  const draft = portco.drafts.boardEmail;
  const confirmed = allBoardConfirmed(portco, members);
  const conflicts = openConflicts(portco);
  const conflictWorking = !!working && phase !== "needsDraft" && !!draft?.approved;
  const boardSent = sentAt(portco.log, "Sent the confirmation email to the board.");
  const decline = conflicts.length > 0;

  const title = readOnly || confirmed ? "The board confirmed" : decline ? "A board member declined a date" : phase === "waiting" ? "Waiting on the board" : "The board confirms the dates";

  return (
    <div>
      <PanelHeader title={title}>
        {readOnly || confirmed
          ? `${names} confirmed every quarter.`
          : decline
            ? "The agent went back to the shortlist the partners approved, proposed the next window, and re-checked the partners. Read the re-send and approve it."
            : phase === "waiting"
              ? `Sent to ${names}. Each member confirms the four dates. If one declines, the agent proposes the next window from the approved shortlist.`
              : working
                ? `${names} confirm the dates ${portco.execContact.name} picked.`
                : `${names} confirm the dates ${portco.execContact.name} picked. Read the email and approve it to send.`}
        {!readOnly && confirmed ? " Press Lock and book." : ""}
      </PanelHeader>

      {!draft?.approved ? (
        <Section title="Email to the board">
          {working && !draft ? <Working label={working} /> : <DraftViewer draftKey="boardEmail" title="Confirmation email to the board" to={members.map((m) => m.name).join(", ")} />}
        </Section>
      ) : null}

      {conflictWorking && conflicts.length === 0 ? <Working label={working as string} /> : null}

      {conflicts.map((q) => {
        const d = portco.drafts[`conflict:${q}`];
        const data = d?.data as ConflictData | undefined;
        if (!d || !data) return null;
        const member = members.find((m) => m.id === data.memberId);
        const declined = portco.quarters[q].shortlist.find((w) => w.id === data.declinedWindowId);
        const fallback = portco.quarters[q].shortlist.find((w) => w.id === data.fallbackWindowId);
        const repliedAt = [...portco.log].reverse().find((e) => e.personId === data.memberId && /cannot make/i.test(e.text))?.at;
        const checkedIds = activePartners(portco);
        return (
          <div key={q} className="mb-4 flex flex-col gap-4">
            <DraftViewer draftKey={`conflict:${q}`} title={`Re-send to the board: ${q} date change`} to={members.map((m) => m.name).join(", ")} testId="draft-conflict" />
            <div className="flex flex-col gap-3 rounded-[12px] border border-you-line border-l-4 border-l-you bg-[#f3f7fc] px-[18px] py-4" data-testid={`conflict-${q}`}>
              <div className="flex items-center gap-3">
                <span className="face-initials inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-you-line bg-white text-[13px] font-bold text-you" data-initials={(member?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)} />
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold">{personName(data.memberId)} declined {q}</span>
                  <span className="text-[14px] text-mut">
                    {member?.role}
                    {repliedAt ? ` · replied ${fmtStamp(repliedAt)}` : ""}
                  </span>
                </div>
              </div>
              <p className="text-[15px]" data-testid="conflict-note">{data.note}</p>
              <div className="grid grid-cols-[110px_1fr] items-center gap-x-4 gap-y-2 text-[15px]">
                <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">Declined</span>
                <span className="text-mut line-through">{declined ? fmtWindow(declined) : ""}</span>
                <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">Proposed</span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{fallback ? fmtWindow(fallback) : "No other window on the shortlist"}</span>
                  {fallback ? <Pill tone="you">option {fallback.rank} on the approved shortlist</Pill> : null}
                </span>
                <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">Re-checked</span>
                <span className="flex flex-wrap items-center gap-2.5" data-testid="reverify">
                  <FaceStack ids={checkedIds} size={24} />
                  <span>
                    {data.reverify.ok
                      ? `${joinNames(checkedIds.map(personName))} are still free`
                      : `${joinNames(data.reverify.busy.map(personName))} now busy`}
                  </span>
                  {data.reverify.ok ? (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-lock">
                      <IconCheck size={14} />
                      verified
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {!readOnly && phase === "waiting" ? <WaitingState /> : null}

      {draft?.approved || readOnly ? (
        <Section title="Board replies" testId="board-matrix">
          <div className="overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="bg-bg text-left">
                  <th className="px-3 py-2.5 text-[13px] font-semibold text-mut">Qtr</th>
                  <th className="px-3 py-2.5 text-[13px] font-semibold text-mut">Date</th>
                  {members.map((m) => (
                    <th key={m.id} className="px-3 py-2 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <Face person={resolvePerson(m.id)} size={24} />
                        <span className="text-[13px] font-semibold text-mut">{shortName(m.name)}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portco.targetQuarters.map((q) => {
                  const qs = portco.quarters[q];
                  const w = qs.shortlist.find((x) => x.id === qs.portcoPick);
                  const cd = portco.drafts[`conflict:${q}`]?.data as ConflictData | undefined;
                  const declinedW = cd ? qs.shortlist.find((x) => x.id === cd.declinedWindowId) : undefined;
                  const changed = !!cd && declinedW && w && declinedW.id !== w.id;
                  const hot = !!cd && (!portco.drafts[`conflict:${q}`].approved || members.some((m) => qs.boardResponses[m.id] !== "confirmed"));
                  return (
                    <tr key={q} className={"border-t border-idle-line " + (hot ? "bg-[#f3f7fc]" : "")}>
                      <td className={"px-3 py-2.5 font-bold " + (hot ? "text-you" : "text-mut")}>{q}</td>
                      <td className="px-3 py-2.5">
                        {changed ? <span className="mr-1.5 text-mut line-through">{fmtWindow(declinedW).replace(/,.*$/, "")}</span> : null}
                        <span className={changed ? "font-semibold" : ""}>{w ? fmtWindow(w) : ""}</span>
                      </td>
                      {members.map((m) => {
                        const r = confirmedStatus(qs.status) ? "confirmed" : (qs.boardResponses[m.id] ?? "pending");
                        const reasking = r === "pending" && !!cd?.fallbackWindowId && portco.drafts[`conflict:${q}`]?.approved;
                        return (
                          <td key={m.id} className="px-3 py-2" data-testid={`resp-${q}-${m.id}`} data-response={r}>
                            <span className={"rounded-full px-2.5 py-0.5 text-[13px] font-semibold " + (r === "confirmed" ? "bg-lock-soft text-lock" : r === "declined" ? "bg-red-soft text-red" : "bg-idle-soft text-idle")}>
                              {r === "confirmed" ? "Yes" : r === "declined" ? "Declined" : reasking ? "Re-asking" : "No reply yet"}
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

      {draft?.approved ? (
        <DraftViewer draftKey="boardEmail" title="Confirmation email to the board" to={members.map((m) => m.name).join(", ")} collapsed sentAt={boardSent} summary={`${portco.targetQuarters.length} dates`} />
      ) : null}
    </div>
  );
}
