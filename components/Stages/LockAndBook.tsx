"use client";

// Stage 5. A hotel and a restaurant per meeting, then lock.

import { useState } from "react";
import { setLogisticsPick } from "@/lib/actions";
import { getCurrentEa, getVenue, getVenues } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { isLocked } from "@/lib/pipeline";
import { fmtTime, fmtWindow } from "@/lib/scheduling";
import type { LogisticsData } from "@/lib/types";
import { Working } from "@/components/Drafts/DraftViewer";
import { IconLock } from "@/components/ui/icons";
import { useDetail } from "@/components/Detail/DetailContext";
import { PanelHeader } from "./shared";

export function LockAndBook({ readOnly }: { readOnly: boolean }) {
  const { portco, phase, working } = useDetail();
  const draft = portco.drafts.logistics;
  const data = (draft?.data ?? {}) as LogisticsData;
  const done = readOnly || portco.targetQuarters.every((q) => isLocked(portco, q));
  const customVenues = useStore((s) => s.customVenues);
  const addVenue = useStore((s) => s.addVenue);
  const ea = getCurrentEa();
  const hotels = getVenues(portco.city).filter((v) => v.type === "hotel");
  const restaurants = getVenues(portco.city).filter((v) => v.type === "restaurant");
  void customVenues; // re-render when a venue is added

  const addedReason = (v: Venue) => `Added by ${ea.name}, ${new Date(v.addedAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })}.`;

  // Choose a venue for one quarter. A venue the EA added carries its own reason line.
  const choose = (q: (typeof portco.targetQuarters)[number], type: "hotel" | "restaurant", id: string) => {
    const v = getVenue(id);
    const patch = type === "hotel" ? { hotelId: id } : { restaurantId: id };
    setLogisticsPick(portco.id, q, v?.addedBy ? { ...patch, reason: addedReason(v) } : patch);
  };

  const useForAll = (q: (typeof portco.targetQuarters)[number], type: "hotel" | "restaurant") => {
    const pick = data[q];
    if (!pick) return;
    const id = type === "hotel" ? pick.hotelId : pick.restaurantId;
    for (const other of portco.targetQuarters) if (other !== q) choose(other, type, id);
  };

  const onAdd = (q: (typeof portco.targetQuarters)[number], type: "hotel" | "restaurant", form: { name: string; address: string; note: string }) => {
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const v: Venue = {
      id: `custom:${portco.city}:${type}:${slug}`,
      city: portco.city,
      type,
      name: form.name.trim(),
      distanceMi: 0,
      note: form.note.trim() || `Added by ${ea.name}`,
      address: form.address.trim() || undefined,
      addedBy: ea.id,
      addedAt: new Date().toISOString(),
    };
    addVenue(v);
    setLogisticsPick(portco.id, q, type === "hotel" ? { hotelId: v.id, reason: addedReason(v) } : { restaurantId: v.id, reason: addedReason(v) });
  };

  return (
    <div>
      <PanelHeader title={done ? "Dates and venues locked" : "Lock the dates and book"}>
        {done
          ? "Each meeting has a hotel and a dinner. The invites are the next step."
          : working
            ? "The board confirmed all four dates. Picking a hotel and a restaurant near the office for each meeting."
            : phase === "needsDraft"
              ? "The board confirmed all four dates. Press the button to pick a hotel and a restaurant for each meeting."
              : "Check the hotel and dinner for each meeting. Change a pick if you know better. Approve and lock."}
      </PanelHeader>

      {working ? <Working label={working} /> : null}

      {!working && (draft || done) ? (
        <div className="flex flex-col gap-2.5" data-testid="logistics">
          {portco.targetQuarters.map((q) => {
            const qs = portco.quarters[q];
            const w = qs.shortlist.find((x) => x.id === qs.portcoPick);
            const final = qs.logistics;
            const pick = data[q];
            const hotel = final?.hotel ?? (pick && getVenue(pick.hotelId));
            const restaurant = final?.restaurant ?? (pick && getVenue(pick.restaurantId));
            const locked = isLocked(portco, q);
            return (
              <div key={q} className={"rounded-[12px] border px-4 py-3.5 " + (locked ? "border-lock-line bg-lock-soft/40" : "border-line bg-white")} data-testid={`logistics-${q}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[16px] font-semibold">
                    {locked ? <span className="text-lock"><IconLock size={14} /></span> : null}
                    <span className="text-mut">{q}</span> {w ? fmtWindow(w) : ""}
                  </div>
                  {w ? <span className="text-[14px] text-mut">Dinner {fmtTime(w.dinnerStart)}</span> : null}
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-3 text-[15px]">
                  <VenueField label="Hotel" value={hotel?.id} options={hotels} locked={locked || readOnly} onChange={(id) => choose(q, "hotel", id)} onAdd={(f) => onAdd(q, "hotel", f)} onUseForAll={() => useForAll(q, "hotel")} testId={`venue-hotel-${q}`} />
                  <VenueField label="Dinner" value={restaurant?.id} options={restaurants} locked={locked || readOnly} onChange={(id) => choose(q, "restaurant", id)} onAdd={(f) => onAdd(q, "restaurant", f)} onUseForAll={() => useForAll(q, "restaurant")} testId={`venue-restaurant-${q}`} />
                </div>
                <div className="mt-2 text-[14px] leading-snug text-txt/80">{final?.reason ?? pick?.reason}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type VenueForm = { name: string; address: string; note: string };

function VenueField({ label, value, options, locked, onChange, onAdd, onUseForAll, testId }: { label: string; value: string | undefined; options: Venue[]; locked: boolean; onChange: (id: string) => void; onAdd: (f: VenueForm) => void; onUseForAll: () => void; testId: string }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<VenueForm>({ name: "", address: "", note: "" });
  const v = options.find((o) => o.id === value);
  if (locked) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">{label}</span>
        <span className="font-medium">
          {v?.name} {v?.addedBy ? <span className="font-normal text-mut">· your venue</span> : <span className="font-normal text-mut">· {v?.distanceMi} mi</span>}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1" data-testid={testId}>
      <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">{label}</span>
      {adding ? (
        <div className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-ring bg-bg p-2.5" data-testid={`${testId}-form`}>
          <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid={`${testId}-name`} autoFocus />
          <input className={inputCls} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid={`${testId}-address`} />
          <input className={inputCls} placeholder="Note, optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex gap-2">
            <button type="button" className="rounded-[8px] bg-brand px-3 py-1 text-[13px] font-semibold text-white disabled:opacity-50" disabled={!form.name.trim()} onClick={() => { onAdd(form); setAdding(false); setForm({ name: "", address: "", note: "" }); }} data-testid={`${testId}-save`}>
              Save
            </button>
            <button type="button" className="rounded-[8px] border border-ring bg-white px-3 py-1 text-[13px] font-semibold" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <select
          className="rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[15px]"
          value={value ?? ""}
          onChange={(e) => (e.target.value === "__add__" ? setAdding(true) : onChange(e.target.value))}
          data-testid={`${testId}-select`}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.addedBy ? " (yours)" : ` (${o.distanceMi} mi)`}
            </option>
          ))}
          <option value="__add__">Add your own</option>
        </select>
      )}
      <button type="button" className="self-start text-[13px] font-semibold text-brand hover:underline" onClick={onUseForAll} data-testid={`${testId}-all`}>
        Use for all four
      </button>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-[8px] border border-line bg-white px-2.5 text-[14px]";
