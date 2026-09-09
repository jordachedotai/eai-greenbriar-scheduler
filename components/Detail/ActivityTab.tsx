"use client";

// The timeline log as a side tab. EA and agent entries separate, newest first.

import { useState } from "react";
import { fmtStamp } from "@/lib/format";
import type { LogActor } from "@/lib/types";
import { useDetail } from "./DetailContext";
import { getCurrentEa } from "@/lib/data";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";

const LABEL: Record<LogActor, string> = { ea: "You", agent: "Agent", portco: "Company", board: "Board", partner: "Partner" };
const TONE: Record<LogActor, string> = { ea: "text-txt", agent: "text-brand", portco: "text-blue", board: "text-blue", partner: "text-blue" };

function AgentMark() {
  return <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white" title="Agent">G</span>;
}

export function ActivityTab() {
  const { portco } = useDetail();
  const ea = getCurrentEa();
  const faceFor = (actor: LogActor, personId?: string): Person | null => {
    if (actor === "agent") return null;
    if (actor === "ea") return { id: ea.id, name: ea.name, avatar: ea.avatar };
    if (personId) return resolvePerson(personId);
    if (actor === "portco") return { name: portco.execContact.name };
    return null;
  };
  const [open, setOpen] = useState(true);
  const entries = [...portco.log].reverse();
  return (
    <aside className={"flex shrink-0 flex-col border-l border-line bg-panel transition-[width] " + (open ? "w-[320px]" : "w-[40px]")} data-testid="activity" data-open={open ? "true" : "false"}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={"flex h-[56px] items-center border-b border-line text-[12px] font-semibold uppercase tracking-wide text-mut hover:text-txt " + (open ? "justify-between px-4" : "justify-center")}
        data-testid="activity-toggle"
        title={open ? "Hide activity" : "Show activity"}
      >
        {open ? (
          <>
            <span>Activity</span>
            <span className="text-mut">{entries.length} ›</span>
          </>
        ) : (
          <span className="[writing-mode:vertical-rl] rotate-180">Activity {entries.length}</span>
        )}
      </button>
      {open ? (
        <ol className="flex-1 overflow-y-auto p-3" data-testid="timeline">
          {entries.length === 0 ? <li className="text-[12.5px] text-mut">Nothing yet. Press the button below to start.</li> : null}
          {entries.map((e, i) => (
            <li key={i} className="flex gap-2 border-b border-line py-2 text-[12px] last:border-b-0">
              {(() => {
                const f = faceFor(e.actor, e.personId);
                return f ? <Face person={f} size={24} /> : <AgentMark />;
              })()}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-[11px]">
                  <span className={"font-semibold " + TONE[e.actor]}>{LABEL[e.actor]}</span>
                  <span className="text-mut">{fmtStamp(e.at)}</span>
                </div>
                <div className="mt-0.5 leading-snug">{e.text}</div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}
