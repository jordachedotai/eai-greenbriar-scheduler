"use client";

// Stage 5. A hotel and a dinner per meeting as venue cards, like the step 1
// option cards: icon, name, distance, one reason line. Change opens the
// alternatives with Use this and an Add your own card. Use for all copies a
// pick to every quarter, which then reads "Same as Q1". Then lock.

import { useState } from "react";
import { setLogisticsPick } from "@/lib/actions";
import { getCurrentEa, getVenue, getVenues } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { LogisticsData, LogisticsPick, Quarter, Venue } from "@/lib/types";
import { quarterLabel } from "@/lib/quarters";
import { isLocked } from "@/lib/pipeline";
import { fmtTime, fmtWindow } from "@/lib/scheduling";
import { Working } from "@/components/Drafts/DraftViewer";
import { IconDinner, IconHotel, IconLock, IconPlus } from "@/components/ui/icons";
import { useDetail } from "@/components/Detail/DetailContext";
import { PanelHeader } from "./shared";

type VenueType = "hotel" | "restaurant";
type VenueForm = { name: string; address: string; note: string };

function addedReason(v: Venue, eaName: string): string {
  return `Added by ${eaName}, ${new Date(v.addedAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })}.`;
}

function ownReason(v: Venue, eaName: string): string {
  return v.addedBy ? addedReason(v, eaName) : `${v.note}.`;
}

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
  const many = portco.targetQuarters.length > 1;
  void customVenues; // re-render when a venue is added

  // The EA chooses a venue for one quarter. That quarter no longer inherits.
  const choose = (q: Quarter, type: VenueType, id: string) => {
    const v = getVenue(id);
    if (!v) return;
    const cur = data[q];
    const sameAs = { ...(cur?.sameAs ?? {}), [type]: undefined };
    const patch: Partial<LogisticsPick> = type === "hotel" ? { hotelId: id, hotelReason: ownReason(v, ea.name), sameAs } : { restaurantId: id, restaurantReason: ownReason(v, ea.name), sameAs };
    setLogisticsPick(portco.id, q, patch);
  };

  const useForAll = (q: Quarter, type: VenueType) => {
    const pick = data[q];
    if (!pick) return;
    const id = type === "hotel" ? pick.hotelId : pick.restaurantId;
    const reason = type === "hotel" ? pick.hotelReason : pick.restaurantReason;
    for (const other of portco.targetQuarters) {
      if (other === q) continue;
      const sameAs = { ...(data[other]?.sameAs ?? {}), [type]: q };
      setLogisticsPick(portco.id, other, type === "hotel" ? { hotelId: id, hotelReason: reason, sameAs } : { restaurantId: id, restaurantReason: reason, sameAs });
    }
  };

  const onAdd = (q: Quarter, type: VenueType, form: VenueForm) => {
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
    const sameAs = { ...(data[q]?.sameAs ?? {}), [type]: undefined };
    setLogisticsPick(portco.id, q, type === "hotel" ? { hotelId: v.id, hotelReason: addedReason(v, ea.name), sameAs } : { restaurantId: v.id, restaurantReason: addedReason(v, ea.name), sameAs });
  };

  return (
    <div>
      <PanelHeader title={done ? "Dates and venues locked" : "Lock the dates and book"}>
        {done
          ? "Each meeting has a hotel and a dinner. The invites are the next step."
          : working
            ? "The board confirmed every date. Picking a hotel and a restaurant near the office for each meeting."
            : phase === "needsDraft"
              ? "The board confirmed every date. Press the button to pick a hotel and a restaurant for each meeting."
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
            const locked = isLocked(portco, q);
            const hotel = final?.hotel ?? (pick && getVenue(pick.hotelId));
            const restaurant = final?.restaurant ?? (pick && getVenue(pick.restaurantId));
            const hotelReason = final?.hotelReason ?? pick?.hotelReason ?? (hotel ? ownReason(hotel, ea.name) : "");
            const restaurantReason = final?.restaurantReason ?? pick?.restaurantReason ?? (restaurant ? ownReason(restaurant, ea.name) : "");
            const sameAs = final?.sameAs ?? pick?.sameAs;
            const label = (x: Quarter) => quarterLabel(x, portco.targetQuarters);
            return (
              <div key={q} className={"rounded-[12px] border px-4 py-3.5 " + (locked ? "border-lock-line bg-lock-soft/40" : "border-line bg-white")} data-testid={`logistics-${q}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[16px] font-semibold">
                    {locked ? <span className="text-lock"><IconLock size={14} /></span> : null}
                    <span className="text-mut">{label(q)}</span> {w ? fmtWindow(w) : ""}
                  </div>
                  {w ? <span className="text-[14px] text-mut">Dinner {fmtTime(w.dinnerStart)}</span> : null}
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <VenueSlot
                    type="hotel"
                    venue={hotel}
                    reason={hotelReason}
                    sameAs={sameAs?.hotel && sameAs.hotel !== q ? label(sameAs.hotel) : undefined}
                    options={hotels}
                    locked={locked || readOnly}
                    canUseForAll={many}
                    onChoose={(id) => choose(q, "hotel", id)}
                    onAdd={(f) => onAdd(q, "hotel", f)}
                    onUseForAll={() => useForAll(q, "hotel")}
                    testId={`venue-hotel-${q}`}
                  />
                  <VenueSlot
                    type="restaurant"
                    venue={restaurant}
                    reason={restaurantReason}
                    sameAs={sameAs?.restaurant && sameAs.restaurant !== q ? label(sameAs.restaurant) : undefined}
                    options={restaurants}
                    locked={locked || readOnly}
                    canUseForAll={many}
                    onChoose={(id) => choose(q, "restaurant", id)}
                    onAdd={(f) => onAdd(q, "restaurant", f)}
                    onUseForAll={() => useForAll(q, "restaurant")}
                    testId={`venue-restaurant-${q}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// One venue for one meeting, with Change and Use for all. Change opens the
// alternatives beneath as the same cards.
function VenueSlot({ type, venue, reason, sameAs, options, locked, canUseForAll, onChoose, onAdd, onUseForAll, testId }: { type: VenueType; venue: Venue | undefined; reason: string; sameAs?: string; options: Venue[]; locked: boolean; canUseForAll: boolean; onChoose: (id: string) => void; onAdd: (f: VenueForm) => void; onUseForAll: () => void; testId: string }) {
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<VenueForm>({ name: "", address: "", note: "" });
  const close = () => {
    setChanging(false);
    setAdding(false);
  };
  return (
    <div className="flex flex-col gap-2" data-testid={testId} data-venue={venue?.id ?? ""}>
      <VenueCard
        type={type}
        venue={venue}
        reason={sameAs ? `Same as ${sameAs}` : reason}
        muted={!!sameAs}
        actions={
          locked ? undefined : (
            <>
              <button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={() => (changing ? close() : setChanging(true))} data-testid={`${testId}-change`}>
                {changing ? "Keep this" : "Change"}
              </button>
              {canUseForAll ? (
                <button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={onUseForAll} data-testid={`${testId}-all`}>
                  Use for all
                </button>
              ) : null}
            </>
          )
        }
      />
      {changing ? (
        <div className="flex flex-col gap-1.5 rounded-[10px] border border-idle-line bg-idle-soft p-2" data-testid={`${testId}-options`}>
          {options
            .filter((o) => o.id !== venue?.id)
            .map((o) => (
              <VenueCard
                key={o.id}
                type={type}
                venue={o}
                reason={o.addedBy ? "Your venue." : `${o.note}.`}
                actions={
                  <button
                    type="button"
                    className="rounded-[8px] border border-ring bg-white px-2.5 py-1 text-[13px] font-semibold text-brand hover:border-brand"
                    onClick={() => {
                      onChoose(o.id);
                      close();
                    }}
                    data-testid={`${testId}-use-${o.id}`}
                  >
                    Use this
                  </button>
                }
              />
            ))}
          {adding ? (
            <div className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-ring bg-white p-2.5" data-testid={`${testId}-form`}>
              <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Add your own {type === "hotel" ? "hotel" : "restaurant"}</span>
              <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid={`${testId}-name`} autoFocus />
              <input className={inputCls} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid={`${testId}-address`} />
              <input className={inputCls} placeholder="Note, optional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-[8px] bg-brand px-3 py-1 text-[13px] font-semibold text-white disabled:opacity-50"
                  disabled={!form.name.trim()}
                  onClick={() => {
                    onAdd(form);
                    setForm({ name: "", address: "", note: "" });
                    close();
                  }}
                  data-testid={`${testId}-save`}
                >
                  Save and use
                </button>
                <button type="button" className="rounded-[8px] border border-ring bg-white px-3 py-1 text-[13px] font-semibold" onClick={() => setAdding(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-ring bg-white px-3 py-2.5 text-[14px] font-semibold text-brand hover:border-brand" onClick={() => setAdding(true)} data-testid={`${testId}-add`}>
              <IconPlus size={16} />
              Add your own
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function VenueCard({ type, venue, reason, muted, actions }: { type: VenueType; venue: Venue | undefined; reason: string; muted?: boolean; actions?: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-[10px] border border-line bg-white px-3 py-2.5" data-testid="venue-card">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-bg text-mut">{type === "hotel" ? <IconHotel size={18} /> : <IconDinner size={18} />}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">{type === "hotel" ? "Hotel" : "Dinner"}</span>
            <span className="text-[15px] font-semibold leading-tight">{venue?.name ?? "Not picked"}</span>
            <span className="text-[13px] text-mut">{venue ? (venue.addedBy ? "Your venue" : `${venue.distanceMi} mi from the office`) : ""}</span>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
        </div>
        {reason ? <div className={"mt-1 text-[14px] leading-snug " + (muted ? "text-mut" : "text-txt/80")}>{reason}</div> : null}
      </div>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-[8px] border border-line bg-white px-2.5 text-[14px]";
