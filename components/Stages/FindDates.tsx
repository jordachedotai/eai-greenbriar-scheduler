"use client";

// Stage 1. Explains who was checked, shows the top three per quarter with
// reasons, the raw grid behind an expander, thin warnings, the one-pager.

import { useState } from "react";
import { getBoardMembers, personName } from "@/lib/data";
import { heldDays } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import { joinNames } from "@/lib/format";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { useDetail } from "@/components/Detail/DetailContext";
import { Explain, Section, WindowCard } from "./shared";

// Names with a 24px face before each, joined with commas and "and", so the
// sentence still reads as a sentence.
function Names({ people }: { people: Person[] }) {
  return (
    <>
      {people.map((p, i) => (
        <span key={p.id ?? p.name}>
          {i > 0 ? (i === people.length - 1 ? " and " : ", ") : ""}
          <span className="inline-flex items-center gap-1 align-middle">
            <Face person={p} size={24} />
            <span>{p.name}</span>
          </span>
        </span>
      ))}
    </>
  );
}

export function FindDates({ readOnly }: { readOnly: boolean }) {
  const { portco, phase, working } = useDetail();
  const [showAll, setShowAll] = useState(false);
  const held = useStore((s) => heldDays(Object.values(s.portcos).filter((o) => o.id !== portco.id), portco.partnerIds).size);
  const partners = joinNames(portco.partnerIds.map(personName));
  const partnerPeople = portco.partnerIds.map(resolvePerson);
  const members = getBoardMembers(portco.id);
  const byEmail = joinNames(members.filter((m) => !m.calendarVisible).map((m) => m.name));
  const emailPeople: Person[] = members.filter((m) => !m.calendarVisible).map((m) => ({ id: m.id, name: m.name }));
  const exec: Person = { name: portco.execContact.name };
  const found = portco.targetQuarters.some((q) => portco.quarters[q].windows.length > 0);
  const total = portco.targetQuarters.reduce((n, q) => n + portco.quarters[q].windows.length, 0);

  if (!found && !readOnly) {
    return (
      <div>
        <Explain>
          Find four hour blocks in 2027 when {partners} are all free, ranked, three per quarter, with a one-pager for {portco.execContact.name}. Press Find dates.
        </Explain>
        <div className="rounded-lg border border-dashed border-line px-4 py-6 text-[12.5px] text-mut">
          Only the assigned partners' calendars are checked, because those are the calendars Greenbriar has: <Names people={partnerPeople} />. {byEmail} have not shared calendars and will be asked by email in step 4. {portco.execContact.name} picks from the options in step 3.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Explain>
        {readOnly ? (
          <>Finished. </>
        ) : phase === "review" ? (
          <>Read the one-pager below. Approve it to move to partner sign-off. </>
        ) : phase === "needsDraft" && !working ? (
          <>Dates are found. Draft the one-pager to continue. </>
        ) : null}
        Checked calendars for <Names people={partnerPeople} />. <Names people={emailPeople} /> have not shared calendars and will be asked by email in step 4.{" "}
        <span className="inline-flex items-center gap-1 align-middle"><Face person={exec} size={24} /><span>{portco.execContact.name}</span></span> picks from the options in step 3.
        {held > 0 ? ` Skipped ${held} days already held for other portfolio company meetings.` : ""}
      </Explain>

      <Section title="Top three per quarter" testId="shortlist">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {portco.targetQuarters.map((q) => {
            const qs = portco.quarters[q];
            return (
              <div key={q} className="rounded-lg border border-line bg-bg p-2" data-testid={`shortlist-${q}`}>
                <div className="mb-1.5 flex items-baseline justify-between px-1">
                  <span className="text-[12px] font-semibold">{q}</span>
                  <span className="text-[11px] text-mut">{qs.windows.length} windows</span>
                </div>
                {qs.thin ? (
                  <div className="mb-2 rounded border border-amber/30 bg-amber-soft px-2 py-1.5 text-[11.5px] text-amber" data-testid={`thin-${q}`}>
                    Only {qs.windows.length} windows in {q}. Consider widening to 3-hour blocks.
                  </div>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  {qs.shortlist.map((w) => (
                    <WindowCard key={w.id} w={w} showReason={!working} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="mt-2 text-[12px] text-brand hover:underline" onClick={() => setShowAll(!showAll)} data-testid="see-all-windows">
          {showAll ? "Hide the full list" : `See all ${total} windows`}
        </button>
        {showAll ? (
          <div className="mt-2 grid grid-cols-2 gap-3 xl:grid-cols-4" data-testid="all-windows">
            {portco.targetQuarters.map((q) => (
              <div key={q} className="max-h-[320px] overflow-y-auto rounded-lg border border-line bg-bg p-2">
                <div className="mb-1 px-1 text-[11px] font-semibold text-mut">{q}</div>
                <div className="flex flex-col gap-1">
                  {portco.quarters[q].windows.map((w) => (
                    <WindowCard key={w.id} w={w} showReason={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="One-pager for the portco">
        {working && !portco.drafts.onepager ? <Working label={working} /> : <DraftViewer draftKey="onepager" title={`To ${portco.execContact.name}`} sentLabel="Approved" />}
      </Section>
    </div>
  );
}
