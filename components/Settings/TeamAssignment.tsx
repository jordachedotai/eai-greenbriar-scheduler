"use client";

// Team assignment per portfolio company: the assigned assistant and the
// Greenbriar team as face chips, with Edit over the People roster. Saving
// updates the company and Find dates picks up the change.

import { Fragment, useState } from "react";
import { getEas } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Portco } from "@/lib/types";
import { FaceStack } from "@/components/ui/Face";
import { LogoTile } from "@/components/ui/LogoTile";
import { Menu } from "@/components/ui/Menu";
import { PeoplePicker } from "./PeoplePicker";

export function TeamAssignment() {
  const portcos = useStore((s) => s.portcos);
  const setTeam = useStore((s) => s.setTeam);
  const setEa = useStore((s) => s.setEa);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const eas = getEas();
  const list = Object.values(portcos).sort((a, b) => a.name.localeCompare(b.name));

  const open = (p: Portco) => {
    setEditing(p.id);
    setDraft(p.partnerIds);
  };

  return (
    <div className="overflow-hidden rounded-[12px] border border-line" data-testid="team-assignment">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="bg-bg text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">
            <th className="px-4 py-2.5">Company</th>
            <th className="px-4 py-2.5">Assistant</th>
            <th className="px-4 py-2.5">Greenbriar team</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <Fragment key={p.id}>
              <tr className="border-t border-idle-line" data-testid={`team-row-${p.id}`}>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-3">
                    <LogoTile src={p.logo} name={p.name} width={56} height={36} radius={8} />
                    <span className="min-w-0">
                      <span className="block font-semibold">{p.name}</span>
                      <span className="block text-[13px] text-mut">{p.city}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Menu value={p.eaId} onChange={(v) => setEa(p.id, v)} options={eas.map((e) => ({ value: e.id, label: e.name }))} testId={`team-ea-${p.id}`} className="w-[200px]" ariaLabel="Assistant" />
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <FaceStack ids={p.partnerIds} size={26} max={6} />
                    <span className="text-[13px] text-mut" data-testid={`team-count-${p.id}`}>{p.partnerIds.length}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button type="button" className="rounded-[8px] border border-ring bg-white px-3 py-1.5 text-[14px] font-semibold hover:border-brand" onClick={() => (editing === p.id ? setEditing(null) : open(p))} data-testid={`team-edit-${p.id}`}>
                    {editing === p.id ? "Cancel" : "Edit"}
                  </button>
                </td>
              </tr>
              {editing === p.id ? (
                <tr className="bg-bg">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="flex flex-col gap-3">
                      <PeoplePicker value={draft} onChange={setDraft} testId={`team-picker-${p.id}`} />
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] text-mut">{draft.length} on the team. Find dates checks their calendars.</span>
                        <button
                          type="button"
                          disabled={draft.length === 0}
                          className="rounded-[8px] bg-brand px-3.5 py-1.5 text-[14px] font-semibold text-white hover:bg-brand2 disabled:opacity-50"
                          onClick={() => {
                            setTeam(p.id, draft);
                            setEditing(null);
                          }}
                          data-testid={`team-save-${p.id}`}
                        >
                          Save team
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
