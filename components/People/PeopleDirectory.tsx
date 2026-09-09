"use client";

// The Greenbriar roster from the team page, grouped. Click a person to see
// the portfolio companies they sit on.

import { useState } from "react";
import Link from "next/link";
import { getTeam, type TeamMember } from "@/lib/data";
import { useStore } from "@/lib/store";
import { portcoStage } from "@/lib/pipeline";
import { STAGE_NAMES } from "@/lib/types";
import { Face } from "@/components/ui/Face";
import { LogoTile } from "@/components/ui/LogoTile";

const GROUPS: { key: string; title: string }[] = [
  { key: "investment", title: "Investment team" },
  { key: "operations", title: "Portfolio support, finance and administration" },
];

export function PeopleDirectory() {
  const team = getTeam();
  const portcos = useStore((s) => s.portcos);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = team.find((t) => t.id === selectedId) ?? null;
  const companiesOf = (id: string) => Object.values(portcos).filter((p) => p.partnerIds.includes(id));

  return (
    <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        {GROUPS.map((g) => {
          const people = team.filter((t) => t.group === g.key);
          return (
            <section key={g.key} className="flex flex-col gap-3" data-testid={`people-${g.key}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="serif text-[22px] font-semibold">{g.title}</h3>
                <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{people.length} people</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                {people.map((t) => (
                  <PersonCard key={t.id} person={t} count={companiesOf(t.id).length} selected={selectedId === t.id} onClick={() => setSelectedId(selectedId === t.id ? null : t.id)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {/* Sticky inside the scrolling main, offset by the page padding, so the
          card stays in view as the roster scrolls and swaps in place. */}
      <aside className="sticky top-[22px] max-h-[calc(100vh-108px)] self-start overflow-y-auto rounded-[14px] border border-line bg-white p-[18px] shadow-[0_1px_2px_rgba(23,34,26,0.05)]" data-testid="person-panel">
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Face person={{ id: selected.id, name: selected.name, avatar: selected.avatar }} size={56} />
              <div>
                <div className="text-[18px] font-semibold leading-tight">{selected.name}</div>
                <div className="text-[14px] text-mut">{selected.title}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">Portfolio companies</span>
              {companiesOf(selected.id).length === 0 ? (
                <p className="text-[15px] text-mut">Not on a deal team for a current portfolio company.</p>
              ) : (
                <ul className="flex flex-col gap-2" data-testid="person-companies">
                  {companiesOf(selected.id).map((p) => (
                    <li key={p.id}>
                      <Link href={`/portfolio/${p.id}`} className="flex items-center gap-3 rounded-[10px] border border-line px-2.5 py-2 hover:border-brand">
                        <LogoTile src={p.logo} name={p.name} width={56} height={36} radius={8} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                          <span className="block text-[13px] text-mut">
                            {p.city} · step {portcoStage(p)}, {STAGE_NAMES[portcoStage(p)]}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[13px] text-mut">Calendar connected through Outlook. Not shown in this demo.</p>
          </div>
        ) : (
          <p className="text-[15px] text-mut">Click a person to see the portfolio companies they sit on.</p>
        )}
      </aside>
    </div>
  );
}

function PersonCard({ person, count, selected, onClick }: { person: TeamMember; count: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`person-${person.id}`}
      className={"card-lift flex items-center gap-3 rounded-[12px] border bg-white px-3.5 py-3 text-left shadow-[var(--shadow-card)] " + (selected ? "border-brand shadow-[0_0_0_1px_var(--color-brand)]" : "border-line")}
    >
      <Face person={{ id: person.id, name: person.name, avatar: person.avatar }} size={48} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold">{person.name}</span>
        <span className="block truncate text-[14px] text-mut">{person.title}</span>
      </span>
      {count > 0 ? <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand">{count}</span> : null}
    </button>
  );
}
