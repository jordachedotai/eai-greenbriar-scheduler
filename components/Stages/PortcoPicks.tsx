"use client";

// Stage 3. Proposal email to the company executive, then their picks.

import { allPicked } from "@/lib/pipeline";
import { fmtWindow } from "@/lib/scheduling";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { useDetail } from "@/components/Detail/DetailContext";
import { PanelHeader, Section, WaitingState } from "./shared";

export function PortcoPicks({ readOnly }: { readOnly: boolean }) {
  const { portco, phase, working } = useDetail();
  const exec = portco.execContact.name;
  const draft = portco.drafts.portcoEmail;
  const picked = allPicked(portco);
  const title = readOnly || picked ? `${exec} picked the dates` : phase === "waiting" ? "Waiting on the company" : "The company picks";

  const sentAt = portco.log.find((e) => e.text.startsWith("Sent the proposal and one-pager"))?.at;

  // Order: what needs the EA, the reason, the evidence, history.
  return (
    <div>
      <PanelHeader title={title}>
        {readOnly || picked
          ? `${exec} picked one option per quarter from the one-pager.`
          : phase === "waiting"
            ? `Sent to ${exec}. They choose one option per quarter and reply.`
            : working
              ? `${exec} gets the one-pager and chooses one option per quarter.`
              : `${exec} gets the one-pager and chooses one option per quarter. Read the cover email and approve it to send.`}
        {!readOnly && picked ? " Draft the email to the board." : ""}
      </PanelHeader>

      {!draft?.approved ? (
        <Section title="Email to the company">
          {working && !draft ? <Working label={working} /> : <DraftViewer draftKey="portcoEmail" title="Proposal email to the company" to={exec} />}
        </Section>
      ) : null}

      {!readOnly && phase === "waiting" ? <WaitingState /> : null}

      {draft?.approved || readOnly ? (
        <Section title={`${exec}'s picks`} testId="portco-picks">
          <ul className="flex flex-col gap-1.5 text-[15px]">
            {portco.targetQuarters.map((q) => {
              const qs = portco.quarters[q];
              const w = qs.shortlist.find((x) => x.id === qs.portcoPick);
              return (
                <li key={q} className="flex gap-3 rounded-[10px] border border-line bg-white px-3 py-2">
                  <span className="w-8 font-bold text-mut">{q}</span>
                  {w ? (
                    <span>
                      <span className="font-semibold">{fmtWindow(w)}</span> <span className="text-mut">(option {w.rank})</span>
                    </span>
                  ) : (
                    <span className="text-mut">No reply yet</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {draft?.approved ? <DraftViewer draftKey="portcoEmail" title="Proposal email to the company" to={exec} collapsed sentAt={sentAt} /> : null}
    </div>
  );
}
