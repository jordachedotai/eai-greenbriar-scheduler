"use client";

// Stage 1, per reference/design/FindDates.dc.html. Before dates exist: the
// attendee picker. After: who was checked, the top three per quarter with
// reasons, the full grid behind an expander, the one-pager.

import { useState } from "react";
import { addPartner, setWindow, togglePartner } from "@/lib/actions";
import { quarterLabel, quarterLong, quarterRange, MAX_QUARTERS } from "@/lib/quarters";
import { getBoardMembers, getPartner, getTeam, personName } from "@/lib/data";
import { joinNames } from "@/lib/format";
import { activePartners, heldDays } from "@/lib/pipeline";
import { boardMembersOf } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { useDetail } from "@/components/Detail/DetailContext";
import { Face, FaceStack, resolvePerson, type Person } from "@/components/ui/Face";
import { IconCheck, IconPlus } from "@/components/ui/icons";
import { Label, PanelHeader, Pill, Section, WindowCard } from "./shared";

// Faces or initials inline with names, comma separated.
function Names({ people }: { people: Person[] }) {
  return (
    <>
      {people.map((p, i) => (
        <span key={p.id ?? p.name} className="inline-flex items-center gap-1.5 align-middle">
          <Face person={p} size={24} />
          <span>{i < people.length - 1 ? `${p.name}, ` : `${p.name} `}</span>
        </span>
      ))}
    </>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{children}</span>;
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

        <LookingFor />
        <p className="text-[14px] text-mut">
          Calendars are checked for the people ticked. Email people are asked in later steps.
          {held > 0 ? ` ${held} days are already held for other portfolio company meetings and will be skipped.` : ""}
        </p>
      </div>
    );
  }

  const skipped = portco.skippedDays ?? held;
  return (
    <div>
      <PanelHeader title={readOnly ? "Dates found" : phase === "review" ? "Read the one-pager, then approve it" : "Dates found"}>
        {readOnly ? "Dates found and the one-pager approved." : phase === "review" ? "Approving moves it to the partners for sign-off." : working ? "Writing the reasons and the one-pager from the ranked windows." : "Draft the one-pager to continue."}
      </PanelHeader>

      <div className="mb-4 grid grid-cols-[170px_1fr] items-center gap-x-4 gap-y-2.5 rounded-[12px] border border-line bg-bg px-[18px] py-3.5 text-[15px]" data-testid="who-block">
        <RowLabel>Calendars checked</RowLabel>
        <span className="flex flex-wrap items-center gap-2" data-testid="who-calendars">
          <FaceStack ids={checked} size={24} />
          <span>{partnerPeople.map((p) => p.name).join(", ")}</span>
        </span>
        <RowLabel>Asked by email</RowLabel>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1" data-testid="who-email">
          {emailPeople.length ? <Names people={emailPeople} /> : <span>No one. Every board member shares a calendar.</span>}
          <span className="text-mut">· in step 4</span>
        </span>
        <RowLabel>Picks the dates</RowLabel>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1" data-testid="who-picks">
          <span className="inline-flex items-center gap-1.5 align-middle"><Face person={exec} size={24} /><span>{portco.execContact.name} </span></span>
          <span className="text-mut">· in step 3</span>
        </span>
        <RowLabel>Skipped</RowLabel>
        <span data-testid="who-skipped">{skipped > 0 ? `${skipped} days already held for other portfolio company meetings` : "No days held for other portfolio company meetings"}</span>
      </div>

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
                  <span className="text-[15px] font-semibold">{quarterLabel(q, portco.targetQuarters)}</span>
                  <span className="text-[13px] text-mut">{qs.windows.length} windows</span>
                </div>
                {qs.thin ? (
                  <div className="mb-2 rounded-[8px] border border-wait-line bg-wait-soft px-2.5 py-2 text-[13px] text-wait" data-testid={`thin-${q}`}>
                    Only {qs.windows.length} windows in {quarterLabel(q, portco.targetQuarters)}. Consider widening to 3-hour blocks.
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
                <div className="mb-1 px-1 text-[13px] font-semibold text-mut">{quarterLabel(q, portco.targetQuarters)}</div>
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

// The planning window, and a Change control to set it before dates are found.
function LookingFor() {
  const { portco } = useDetail();
  const [editing, setEditing] = useState(false);
  const qs = portco.targetQuarters;
  const [start, setStart] = useState(portco.startQuarter);
  const [count, setCount] = useState(portco.quarterCount);
  const [hours, setHours] = useState(portco.blockHours ?? 4);
  const [dinner, setDinner] = useState(portco.dinnerTime ?? "18:30");
  const first = qs[0];
  const last = qs[qs.length - 1];
  const span = qs.length === 1 ? quarterLong(first) : `${quarterLong(first)} to ${quarterLong(last)}`;
  const countWord = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"][qs.length] ?? String(qs.length);
  const dinnerLabel = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`;
  };
  if (!editing) {
    return (
      <div className="flex items-center gap-3.5 rounded-[10px] border border-idle-line bg-bg px-3.5 py-3 text-[14px] text-mut" data-testid="looking-for">
        <span className="flex flex-col">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em]">Looking for</span>
          <span className="text-[15px] font-semibold text-txt">
            {countWord} {portco.blockHours ?? 4}-hour block{qs.length === 1 ? "" : "s"}, {span}, one per quarter, dinner at {dinnerLabel(portco.dinnerTime ?? "18:30")}
          </span>
        </span>
        <button type="button" className="ml-auto font-semibold text-brand hover:underline" onClick={() => setEditing(true)} data-testid="looking-for-change">
          Change
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-brand/40 bg-bg px-3.5 py-3" data-testid="looking-for-form">
      <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Planning window</span>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 text-[13px] text-mut">
          Starting quarter
          <select className={sel} value={start} onChange={(e) => setStart(e.target.value)} data-testid="window-start">
            {quarterRange(2026, 2028).map((q) => (
              <option key={q} value={q}>{quarterLong(q)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-mut">
          How many quarters
          <select className={sel} value={count} onChange={(e) => setCount(Number(e.target.value))} data-testid="window-count">
            {Array.from({ length: MAX_QUARTERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-mut">
          Block length
          <select className={sel} value={hours} onChange={(e) => setHours(Number(e.target.value))} data-testid="window-hours">
            {[3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>{h} hours</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-mut">
          Dinner
          <select className={sel} value={dinner} onChange={(e) => setDinner(e.target.value)} data-testid="window-dinner">
            {["18:00", "18:30", "19:00", "19:30"].map((t) => (
              <option key={t} value={t}>{dinnerLabel(t)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-mut">{quarterLong(start)}{count > 1 ? ` to ${quarterLong(quarterRange(2026, 2030)[quarterRange(2026, 2030).indexOf(start) + count - 1] ?? start)}` : ""}. Chips show the year when the window crosses one.</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-[8px] border border-ring bg-white px-3 py-1.5 text-[13px] font-semibold" onClick={() => setEditing(false)}>Cancel</button>
          <button
            type="button"
            className="rounded-[8px] bg-brand px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-brand2"
            onClick={() => {
              setWindow(portco.id, { startQuarter: start, quarterCount: count, blockHours: hours, dinnerTime: dinner });
              setEditing(false);
            }}
            data-testid="window-save"
          >
            Save window
          </button>
        </div>
      </div>
    </div>
  );
}

const sel = "rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[14px] text-txt";

function shortTitle(t: string): string {
  return t.replace("Chief Executive Officer", "CEO").replace("Chief Financial Officer", "CFO");
}

export { joinNames, personName };
