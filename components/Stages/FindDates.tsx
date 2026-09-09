"use client";

// Stage 1, per reference/design/FindDates.dc.html. Before dates exist: the
// attendee picker. After: who was checked, the top three per quarter with
// reasons, the full grid behind an expander, the one-pager.

import { useState } from "react";
import Link from "next/link";
import { addPartner, togglePartner } from "@/lib/actions";
import { getBoardMembers, getPartner, getTeam, personName } from "@/lib/data";
import { joinNames } from "@/lib/format";
import { activePartners, heldDays } from "@/lib/pipeline";
import { boardMembersOf } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { useDetail } from "@/components/Detail/DetailContext";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { IconCheck, IconPlus } from "@/components/ui/icons";
import { Label, PanelHeader, Pill, Section, WindowCard } from "./shared";

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

function PersonRow({ person, sub, tag, checked, dimmed, onToggle, testId }: { person: Person; sub: string; tag: "Calendar" | "Email"; checked?: boolean; dimmed?: boolean; onToggle?: () => void; testId: string }) {
  const box = onToggle ? (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      onClick={onToggle}
      data-testid={`${testId}-check`}
      className={"inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] " + (checked ? "bg-brand text-white" : "border-2 border-ring bg-white")}
    >
      {checked ? <IconCheck size={14} /> : null}
    </button>
  ) : null;
  return (
    <div className={"flex items-center gap-3 rounded-[10px] border px-3 py-2.5 " + (checked ? "border-[#cfdfd2] bg-[#f4f8f5]" : "border-line bg-white")} data-testid={testId} data-checked={checked ? "true" : "false"}>
      {box}
      <Face person={person} size={32} className={dimmed ? "opacity-60" : ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={"text-[15px] font-semibold " + (dimmed ? "text-mut" : "")}>{person.name}</span>
        <span className={"text-[13px] " + (dimmed ? "text-idle-text" : "text-mut")}>{sub}</span>
      </div>
      <Pill tone={tag === "Calendar" ? (dimmed ? "idle" : "lock") : "wait"}>{tag}</Pill>
    </div>
  );
}

export function FindDates({ readOnly }: { readOnly: boolean }) {
  const { portco, phase, working } = useDetail();
  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const checked = activePartners(portco);
  const partnerPeople = checked.map(resolvePerson);
  const members = boardMembersOf(portco);
  const emailPeople: Person[] = members.filter((m) => !m.calendarVisible).map((m) => ({ id: m.id, name: m.name }));
  const exec: Person = { name: portco.execContact.name };
  const found = portco.targetQuarters.some((q) => portco.quarters[q].windows.length > 0);
  const total = portco.targetQuarters.reduce((n, q) => n + portco.quarters[q].windows.length, 0);
  const held = useStore((s) => heldDays(Object.values(s.portcos).filter((o) => o.id !== portco.id), portco.partnerIds).size);
  const roster = getTeam().filter((t) => !portco.partnerIds.includes(t.id));

  if (!found && !readOnly) {
    return (
      <div className="flex flex-col gap-4">
        <PanelHeader title="Who needs to be in the room">
          Tick the people whose calendars we check. The rest are asked by email in later steps.
        </PanelHeader>

        <div className="flex flex-col gap-1.5">
          <Label>Greenbriar partners · calendars checked</Label>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2" data-testid="picker-partners">
            {portco.partnerIds.map((id) => {
              const p = getPartner(id);
              const on = checked.includes(id);
              return (
                <PersonRow
                  key={id}
                  person={resolvePerson(id)}
                  sub={on ? p?.title ?? "" : `${p?.title ?? ""} · optional`}
                  tag="Calendar"
                  checked={on}
                  dimmed={!on}
                  onToggle={() => togglePartner(portco.id, id)}
                  testId={`picker-${id}`}
                />
              );
            })}
            {adding ? (
              <select
                className="rounded-[10px] border border-dashed border-ring bg-white px-3 py-2.5 text-[15px] font-semibold text-brand"
                defaultValue=""
                autoFocus
                data-testid="picker-add-select"
                onBlur={() => setAdding(false)}
                onChange={(e) => {
                  if (e.target.value) addPartner(portco.id, e.target.value);
                  setAdding(false);
                }}
              >
                <option value="">Choose from People</option>
                {roster.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}, {t.title}
                  </option>
                ))}
              </select>
            ) : (
              <button type="button" className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-ring bg-white px-3 py-2.5 text-[15px] font-semibold text-brand hover:border-brand" onClick={() => setAdding(true)} data-testid="picker-add">
                <IconPlus size={18} />
                Add someone from People
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Company and board · asked by email</Label>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2" data-testid="picker-email">
            <PersonRow person={exec} sub={`${shortTitle(portco.execContact.title)} · picks the dates in step 3`} tag="Email" testId="picker-exec" />
            {members.map((m) => (
              <PersonRow key={m.id} person={{ id: m.id, name: m.name }} sub={`${m.role.replace("Independent Director", "Director")} · asked in step 4`} tag="Email" testId={`picker-${m.id}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[10px] border border-idle-line bg-bg px-3.5 py-3 text-[14px] text-mut">
          <span className="flex flex-col">
            <span className="text-[12px] font-semibold uppercase tracking-[0.04em]">Looking for</span>
            <span className="text-[15px] font-semibold text-txt">Four 4-hour blocks in 2027, one per quarter, dinner after</span>
          </span>
          <Link href="/settings" className="ml-auto hover:text-txt">Change in Settings</Link>
        </div>
        <p className="text-[14px] text-mut">
          Calendars are checked for the people ticked. Email people are asked in later steps.
          {held > 0 ? ` ${held} days are already held for other portfolio company meetings and will be skipped.` : ""}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader title={readOnly ? "Dates found" : phase === "review" ? "Read the one-pager, then approve it" : "Dates found"}>
        {readOnly ? null : phase === "review" ? <>Approving moves it to the partners for sign-off. </> : phase === "needsDraft" && !working ? <>Draft the one-pager to continue. </> : null}
        Checked calendars for <Names people={partnerPeople} />. <Names people={emailPeople} /> have not shared calendars and will be asked by email in step 4.{" "}
        <span className="inline-flex items-center gap-1 align-middle"><Face person={exec} size={24} /><span>{portco.execContact.name}</span></span> picks from the options in step 3.
        {held > 0 ? ` Skipped ${held} days already held for other portfolio company meetings.` : ""}
      </PanelHeader>

      <Section title="One-pager for the company">
        {working && !portco.drafts.onepager ? <Working label={working} /> : <DraftViewer draftKey="onepager" title={`One-pager to ${portco.execContact.name}`} sentLabel="Approved" />}
      </Section>
      <Section title="Top three per quarter" testId="shortlist">
        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
          {portco.targetQuarters.map((q) => {
            const qs = portco.quarters[q];
            return (
              <div key={q} className="rounded-[12px] border border-idle-line bg-idle-soft p-2.5" data-testid={`shortlist-${q}`}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <span className="text-[15px] font-semibold">{q}</span>
                  <span className="text-[13px] text-mut">{qs.windows.length} windows</span>
                </div>
                {qs.thin ? (
                  <div className="mb-2 rounded-[8px] border border-wait-line bg-wait-soft px-2.5 py-2 text-[13px] text-wait" data-testid={`thin-${q}`}>
                    Only {qs.windows.length} windows in {q}. Consider widening to 3-hour blocks.
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  {qs.shortlist.map((w) => (
                    <WindowCard key={w.id} w={w} showReason={!working} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="mt-1 self-start text-[14px] font-semibold text-brand hover:underline" onClick={() => setShowAll(!showAll)} data-testid="see-all-windows">
          {showAll ? "Hide the full list" : `See all ${total} windows`}
        </button>
        {showAll ? (
          <div className="mt-2 grid grid-cols-2 gap-3 2xl:grid-cols-4" data-testid="all-windows">
            {portco.targetQuarters.map((q) => (
              <div key={q} className="max-h-[360px] overflow-y-auto rounded-[12px] border border-idle-line bg-idle-soft p-2.5">
                <div className="mb-1 px-1 text-[13px] font-semibold text-mut">{q}</div>
                <div className="flex flex-col gap-1.5">
                  {portco.quarters[q].windows.map((w) => (
                    <WindowCard key={w.id} w={w} showReason={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

    </div>
  );
}

function shortTitle(t: string): string {
  return t.replace("Chief Executive Officer", "CEO").replace("Chief Financial Officer", "CFO");
}

export { joinNames, personName };
