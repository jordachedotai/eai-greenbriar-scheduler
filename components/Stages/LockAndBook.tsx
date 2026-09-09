"use client";

// Stage 5. A hotel and a restaurant per meeting, then lock.

import { setLogisticsPick } from "@/lib/actions";
import { getVenue, getVenues } from "@/lib/data";
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
  const hotels = getVenues(portco.city).filter((v) => v.type === "hotel");
  const restaurants = getVenues(portco.city).filter((v) => v.type === "restaurant");

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
                  <VenueField label="Hotel" value={hotel?.id} options={hotels} locked={locked || readOnly} onChange={(id) => setLogisticsPick(portco.id, q, { hotelId: id })} />
                  <VenueField label="Dinner" value={restaurant?.id} options={restaurants} locked={locked || readOnly} onChange={(id) => setLogisticsPick(portco.id, q, { restaurantId: id })} />
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

function VenueField({ label, value, options, locked, onChange }: { label: string; value: string | undefined; options: { id: string; name: string; distanceMi: number }[]; locked: boolean; onChange: (id: string) => void }) {
  const v = options.find((o) => o.id === value);
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">{label}</span>
      {locked ? (
        <span className="font-medium">
          {v?.name} <span className="font-normal text-mut">· {v?.distanceMi} mi</span>
        </span>
      ) : (
        <select className="rounded-[8px] border border-line bg-white px-2.5 py-1.5 text-[15px]" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.distanceMi} mi)
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
