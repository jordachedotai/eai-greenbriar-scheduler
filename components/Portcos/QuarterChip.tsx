"use client";

import type { Portco, Quarter } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { IconLock } from "@/components/ui/icons";
import { quarterChip, type Tone } from "./status";

const BOX: Record<Tone, string> = {
  you: "bg-you-soft border-you-line",
  wait: "bg-wait-soft border-wait-line",
  lock: "bg-lock-soft border-lock-line",
  idle: "bg-idle-bg border-idle-line",
};
const TEXT: Record<Tone, string> = { you: "text-you", wait: "text-wait", lock: "text-lock", idle: "text-idle" };

// Row chip: 8px by 10px padding, radius 8, label 12/700, date 14/600, caption 12.
// Card chip: 5px by 6px padding, radius 6, label 12/700, date 12/600.
export function QuarterChip({ portco, quarter, variant = "row" }: { portco: Portco; quarter: Quarter; variant?: "row" | "card" }) {
  const c = quarterChip(portco, quarter);
  const qs = portco.quarters[quarter];
  const card = variant === "card";
  return (
    <div
      title={`${quarter}: ${STATUS_LABEL[qs.status]}${c.label ? `, ${c.label}` : ""}`}
      className={`flex flex-col gap-px border ${BOX[c.tone]} ${card ? "rounded-[6px] px-1.5 py-[5px]" : "rounded-[8px] px-2.5 py-2"}`}
      data-testid={`chip-${quarter}`}
      data-status={qs.status}
      data-final={c.locked ? "true" : "false"}
    >
      <span className={`flex items-center gap-1 text-[12px] font-bold ${TEXT[c.tone]}`}>
        {c.locked ? <IconLock size={card ? 10 : 11} /> : null}
        {quarter}
      </span>
      {c.label ? (
        <span className={card ? "text-[12px] font-semibold" : "text-[14px] font-semibold"}>{c.label}</span>
      ) : (
        <span className={card ? "text-[12px] text-idle-text" : "text-[14px] text-idle-text"}>{card ? "none" : "No date"}</span>
      )}
      {!card && c.label ? <span className={`text-[12px] ${TEXT[c.tone]}`}>{c.caption}</span> : null}
    </div>
  );
}
