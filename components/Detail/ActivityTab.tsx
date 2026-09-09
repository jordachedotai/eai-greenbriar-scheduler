"use client";

// The activity log as a card beside the stage panel. Newest first, with a
// face for people, the agent mark for the agent. Seven shown, then "Show more".

import { useState } from "react";
import { fmtStamp } from "@/lib/format";
import type { LogActor } from "@/lib/types";
import { getCurrentEa } from "@/lib/data";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { IconClock, IconSparkle } from "@/components/ui/icons";
import { useDetail } from "./DetailContext";

const SHOW = 7;

export function AgentMark({ size = 28 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-header text-white" title="Agent">
      <IconSparkle size={Math.round(size / 2)} />
    </span>
  );
}

function timeOnly(iso: string): string {
  return fmtStamp(iso).replace(/^\w+ \d+, /, "");
}

export function ActivityTab() {
  const { portco } = useDetail();
  const [all, setAll] = useState(false);
  const ea = getCurrentEa();
  const entries = [...portco.log].reverse();
  const shown = all ? entries : entries.slice(0, SHOW);
  const faceFor = (actor: LogActor, personId?: string): Person | null => {
    if (actor === "agent") return null;
    if (actor === "ea") return { id: ea.id, name: ea.name, avatar: ea.avatar };
    if (personId) return resolvePerson(personId);
    if (actor === "portco") return { name: portco.execContact.name };
    return null;
  };
  const who = (actor: LogActor, personId?: string): string => {
    if (actor === "agent") return "Agent";
    if (actor === "ea") return "You";
    if (personId) return resolvePerson(personId).name;
    if (actor === "portco") return portco.execContact.name;
    return actor === "board" ? "Board" : actor === "partner" ? "Partners" : actor;
  };

  return (
    <aside className="flex flex-col gap-3 self-start rounded-[14px] border border-line bg-white p-[18px] shadow-[0_1px_2px_rgba(23,34,26,0.05)]" data-testid="activity">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">Activity</span>
        <span className="text-[13px] text-idle-text">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-line px-3 py-9 text-center">
          <IconClock size={28} />
          <span className="text-[15px] text-mut">Nothing has happened yet.</span>
          <span className="text-[14px] text-idle-text">Press Find dates and the log starts here.</span>
        </div>
      ) : (
        <ol data-testid="timeline">
          {shown.map((e, i) => {
            const f = faceFor(e.actor, e.personId);
            const declined = e.actor === "board" && /cannot make/i.test(e.text);
            return (
              <li key={i} className="flex gap-2.5 border-b border-idle-soft py-2.5 last:border-b-0">
                {f ? (
                  declined && !f.avatar ? (
                    <span className="face-initials inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-soft text-[12px] font-bold text-red" data-initials={f.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} data-testid="face" />
                  ) : (
                    <Face person={f} size={28} />
                  )
                ) : e.actor === "agent" ? (
                  <AgentMark />
                ) : (
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-idle-soft text-[12px] font-bold text-mut" title={who(e.actor)}>
                    {who(e.actor)[0]}
                  </span>
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] text-mut">
                    <span className={"font-semibold " + (e.actor === "agent" ? "text-header" : "text-txt")}>{who(e.actor, e.personId)}</span> · {timeOnly(e.at)}
                  </span>
                  <span className="text-[14px] leading-[1.4]">{e.text}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {entries.length > SHOW ? (
        <button type="button" className="text-center text-[14px] font-semibold text-brand hover:underline" onClick={() => setAll(!all)} data-testid="activity-more">
          {all ? "Show fewer" : `Show ${entries.length - SHOW} more`}
        </button>
      ) : null}
    </aside>
  );
}
