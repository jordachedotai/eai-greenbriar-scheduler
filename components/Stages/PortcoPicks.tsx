"use client";

// Stage 3. Proposal email to the portco executive, then their picks.

import { simulatePortcoPicks } from "@/lib/actions";
import { allPicked } from "@/lib/pipeline";
import { fmtWindow } from "@/lib/scheduling";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { SimulateButton } from "@/components/Presenter/SimulateButton";
import { useDetail } from "@/components/Detail/DetailContext";
import { Explain, Section, WaitingState } from "./shared";

export function PortcoPicks({ readOnly }: { readOnly: boolean }) {
  const { portco, phase, working } = useDetail();
  const exec = portco.execContact.name;
  const draft = portco.drafts.portcoEmail;
  const picked = allPicked(portco);

  return (
    <div>
      <Explain>
        {readOnly || picked
          ? `${exec} picked one option per quarter from the one-pager.`
          : phase === "waiting"
            ? `Sent to ${exec}. They choose one option per quarter and reply.`
            : working
              ? `${exec} gets the one-pager and chooses one option per quarter.`
              : `${exec} gets the one-pager and chooses one option per quarter. Read the cover email and approve it to send.`}
        {!readOnly && picked ? " Draft the email to the board." : ""}
      </Explain>

      {!readOnly && phase === "waiting" ? (
        <WaitingState>
          <SimulateButton label="simulate company picks" onClick={() => simulatePortcoPicks(portco.id)} testId="sim-portco-picks" />
        </WaitingState>
      ) : null}

      {draft?.approved || readOnly ? (
        <Section title={`${exec}'s picks`} testId="portco-picks">
          <ul className="flex flex-col gap-1 text-[12.5px]">
            {portco.targetQuarters.map((q) => {
              const qs = portco.quarters[q];
              const w = qs.shortlist.find((x) => x.id === qs.portcoPick);
              return (
                <li key={q} className="flex gap-3 rounded border border-line bg-panel px-3 py-1.5">
                  <span className="w-8 font-medium">{q}</span>
                  {w ? (
                    <span>
                      {fmtWindow(w)} <span className="text-mut">(option {w.rank})</span>
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

      <Section title="Email to the company">
        {working && !draft ? <Working label={working} /> : <DraftViewer draftKey="portcoEmail" title={`To ${exec}`} />}
      </Section>
    </div>
  );
}
