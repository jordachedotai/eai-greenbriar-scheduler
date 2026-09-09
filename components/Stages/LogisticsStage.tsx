"use client";

// Stage 6: locked dates plus a hotel and restaurant per meeting.

import { useStore } from "@/lib/store";
import { approveLogistics, regenerateLogistics, setLogisticsPick } from "@/lib/actions";
import { getVenue, getVenues } from "@/lib/data";
import { pickedWindow } from "@/lib/payloads";
import { isFinal } from "@/lib/pipeline";
import { fmtTime, fmtWindow } from "@/lib/scheduling";
import type { LogisticsData, Portco, Quarter } from "@/lib/types";
import { STAGE_BUTTONS } from "@/lib/types";
import { Working, ghost } from "@/components/Drafts/DraftViewer";
import { LockIcon } from "@/components/Board/QuarterChip";
import { StageFrame } from "./StageFrame";

export function LogisticsStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => (s.working?.portcoId === portco.id ? s.working.label : null));
  const draft = portco.drafts.logistics;
  const data = (draft?.data ?? {}) as LogisticsData;
  const done = portco.targetQuarters.every((q) => isFinal(portco, q));
  const hotels = getVenues(portco.city).filter((v) => v.type === "hotel");
  const restaurants = getVenues(portco.city).filter((v) => v.type === "restaurant");

  return (
    <StageFrame
      stage={6}
      hint={
        done
          ? "All four meetings locked. Calendar invites go out from Outlook. Partner travel is booked against these dates."
          : "Dates are locked. For each meeting, a hotel and a restaurant near the office, with a reason. Change a pick if you know better. Approve to finish."
      }
      button={
        done
          ? undefined
          : { label: STAGE_BUTTONS[6], onClick: () => approveLogistics(portco.id), disabled: !draft || !!working }
      }
    >
      {working ? <Working label={working} /> : null}
      {!working && draft ? (
        <div className="flex flex-col gap-2" data-testid="logistics">
          {portco.targetQuarters.map((q) => {
            const w = pickedWindow(portco, q);
            const final = portco.quarters[q].logistics;
            const pick = data[q];
            const hotel = final?.hotel ?? (pick && getVenue(pick.hotelId));
            const restaurant = final?.restaurant ?? (pick && getVenue(pick.restaurantId));
            return (
              <div key={q} className="rounded-lg border border-line bg-bg p-3" data-testid={`logistics-${q}`}>
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold">
                    {final ? <span className="mr-1 inline-block align-middle text-brand"><LockIcon /></span> : null}
                    {q} · {w ? fmtWindow(w) : ""}
                  </div>
                  {w ? <span className="text-[11.5px] text-mut">Dinner {fmtTime(w.dinnerStart)}</span> : null}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[12.5px]">
                  <VenueField
                    label="Hotel"
                    value={hotel?.id}
                    options={hotels}
                    locked={!!final}
                    onChange={(id) => setLogisticsPick(portco.id, q, { hotelId: id })}
                  />
                  <VenueField
                    label="Dinner"
                    value={restaurant?.id}
                    options={restaurants}
                    locked={!!final}
                    onChange={(id) => setLogisticsPick(portco.id, q, { restaurantId: id })}
                  />
                </div>
                <div className="mt-2 text-[12px] text-txt/80">{final?.reason ?? pick?.reason}</div>
              </div>
            );
          })}
          {!done ? (
            <div>
              <button type="button" className={ghost} onClick={() => void regenerateLogistics(portco.id)} data-testid="logistics-regenerate">
                Regenerate picks
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </StageFrame>
  );
}

function VenueField({
  label,
  value,
  options,
  locked,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { id: string; name: string; distanceMi: number }[];
  locked: boolean;
  onChange: (id: string) => void;
}) {
  const v = options.find((o) => o.id === value);
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10.5px] uppercase tracking-wide text-mut">{label}</span>
      {locked ? (
        <span>
          {v?.name} <span className="text-mut">· {v?.distanceMi} mi</span>
        </span>
      ) : (
        <select className="rounded border border-line bg-panel px-2 py-1 text-[12.5px]" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
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

export type { Quarter };
