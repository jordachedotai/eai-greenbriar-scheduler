"use client";

// Settings: calendar connections, the assistant roster, meeting defaults,
// team assignment per company, and adding a company.

import { getEas, getPartners } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Face } from "@/components/ui/Face";
import { LogoTile } from "@/components/ui/LogoTile";
import { TeamAssignment } from "./TeamAssignment";
import { AddCompanyForm } from "./AddCompanyForm";

function Card({ id, title, sub, children }: { id: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-[22px] shadow-[var(--shadow-card)]" data-testid={`settings-${id}`}>
      <div className="flex flex-col gap-1">
        <h3 className="serif text-[22px] font-semibold">{title}</h3>
        <p className="text-[16px] text-mut">{sub}</p>
      </div>
      {children}
    </section>
  );
}

function MeetingDefaults() {
  const defaults = useStore((s) => s.defaults);
  const setDefaults = useStore((s) => s.setDefaults);
  const sel = "rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[15px] font-semibold text-txt";
  return (
    <div className="flex flex-col gap-3" data-testid="defaults">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1 rounded-[10px] border border-line bg-bg px-3.5 py-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Planning window</span>
          <select className={sel} value={defaults.quarterCount} onChange={(e) => setDefaults({ quarterCount: Number(e.target.value) })} data-testid="default-quarters">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>Next {n} quarter{n === 1 ? "" : "s"}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 rounded-[10px] border border-line bg-bg px-3.5 py-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Meeting length</span>
          <select className={sel} value={defaults.blockHours} onChange={(e) => setDefaults({ blockHours: Number(e.target.value) })} data-testid="default-hours">
            {[3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>{h} hours</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 rounded-[10px] border border-line bg-bg px-3.5 py-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Dinner</span>
          <select className={sel} value={defaults.dinnerTime} onChange={(e) => setDefaults({ dinnerTime: e.target.value })} data-testid="default-dinner">
            {[["18:00", "6pm"], ["18:30", "6:30pm"], ["19:00", "7pm"], ["19:30", "7:30pm"]].map(([v, l]) => (
              <option key={v} value={v}>{l}, same day</option>
            ))}
          </select>
        </label>
        <div className="rounded-[10px] border border-line bg-bg px-3.5 py-3">
          <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Days and hours</div>
          <div className="text-[16px] font-semibold">Monday to Thursday, 8am to 6pm local</div>
        </div>
      </div>
      <p className="text-[14px] text-mut">A new company starts on the next {defaults.quarterCount} quarter{defaults.quarterCount === 1 ? "" : "s"}, beginning the quarter after its last locked meeting, or the next quarter if it has none.</p>
    </div>
  );
}

export function SettingsPage() {
  const portcos = useStore((s) => s.portcos);
  const eas = getEas();
  const partners = getPartners();
  return (
    <div className="flex flex-col gap-[18px]">
      <Card id="calendars" title="Calendar connections" sub="Whose calendars Find dates can read. Everyone on the roster is connected through Outlook.">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3" data-testid="calendar-connections">
          {partners.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 rounded-[10px] border border-line px-3 py-2">
              <Face person={{ id: p.id, name: p.name, avatar: p.avatar }} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                <span className="block truncate text-[13px] text-mut">Outlook</span>
              </span>
              <span className="rounded-full bg-lock-soft px-2 py-0.5 text-[12px] font-semibold text-lock">Connected</span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="assistants" title="Assistants" sub="Who owns which companies. Placeholder assignment until Peggy confirms.">
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2" data-testid="assistants">
          {eas.map((ea) => {
            const mine = Object.values(portcos).filter((p) => p.eaId === ea.id);
            return (
              <div key={ea.id} className="flex flex-col gap-2.5 rounded-[10px] border border-line px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <Face person={{ id: ea.id, name: ea.name, avatar: ea.avatar }} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{ea.name}</span>
                    <span className="block text-[13px] text-mut">{ea.title}{ea.isCurrentUser ? " · you" : ""}</span>
                  </span>
                  <span className="text-[13px] text-mut">{mine.length} companies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mine.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2 text-[13px]">
                      <LogoTile src={p.logo} name={p.name} width={32} height={22} radius={6} />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card id="defaults" title="Meeting defaults" sub="What a new company starts with. Each company can change its own window at step 1.">
        <MeetingDefaults />
      </Card>

      <Card id="teams" title="Team assignment" sub="The Greenbriar people on each company. Edit the team and Find dates checks their calendars.">
        <TeamAssignment />
      </Card>

      <Card id="add" title="Add portfolio company" sub="New companies appear in Portfolio right away, not started.">
        <AddCompanyForm />
      </Card>
    </div>
  );
}
