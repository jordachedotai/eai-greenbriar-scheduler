"use client";

// Multi-select over the People roster with faces. Used for team assignment
// and for adding a company.

import { getTeam } from "@/lib/data";
import { Face } from "@/components/ui/Face";
import { IconCheck } from "@/components/ui/icons";

export function PeoplePicker({ value, onChange, testId = "people-picker" }: { value: string[]; onChange: (ids: string[]) => void; testId?: string }) {
  const team = getTeam();
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="grid max-h-[360px] grid-cols-1 gap-1.5 overflow-y-auto rounded-[10px] border border-line bg-bg p-2 md:grid-cols-2" data-testid={testId}>
      {team.map((t) => {
        const on = value.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(t.id)}
            data-testid={`${testId}-${t.id}`}
            className={"flex items-center gap-2.5 rounded-[8px] border px-2.5 py-1.5 text-left " + (on ? "border-[#cfdfd2] bg-[#f4f8f5]" : "border-transparent bg-white hover:border-line")}
          >
            <span className={"inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] " + (on ? "bg-brand text-white" : "border-2 border-ring bg-white")}>{on ? <IconCheck size={12} /> : null}</span>
            <Face person={{ id: t.id, name: t.name, avatar: t.avatar }} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{t.name}</span>
              <span className="block truncate text-[12px] text-mut">{t.title}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
