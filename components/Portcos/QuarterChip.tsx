import type { Portco, Quarter } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { isLocked } from "@/lib/pipeline";
import { fmtDate } from "@/lib/scheduling";

// Chip color follows the quarter's status. Proposed dates are hollow, a
// picked date is amber, a confirmed date is green, locked adds the icon.
export function QuarterChip({ portco, quarter, size = "sm" }: { portco: Portco; quarter: Quarter; size?: "sm" | "md" }) {
  const qs = portco.quarters[quarter];
  const locked = isLocked(portco, quarter);
  const pick = qs.shortlist.find((w) => w.id === qs.portcoPick);
  const proposed = qs.shortlist.find((w) => w.rank === 1);
  const date = pick ?? (qs.status !== "notStarted" ? proposed : undefined);
  const tone =
    locked || qs.status === "boardConfirmed"
      ? "border-brand bg-brand-soft text-brand"
      : qs.status === "portcoPicked"
        ? "border-amber/40 bg-amber-soft text-amber"
        : qs.status === "notStarted"
          ? "border-line bg-panel2 text-mut"
          : "border-blue/40 bg-panel text-blue"; // proposed, hollow
  const label = date ? fmtDate(date.start).replace(/^\w+ /, "") : "";
  return (
    <span
      title={`${quarter}: ${STATUS_LABEL[qs.status]}${date ? `, ${fmtDate(date.start)}` : ""}`}
      className={`inline-flex items-center gap-1 rounded border font-medium ${tone} ${size === "md" ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[11px]"}`}
      data-testid={`chip-${quarter}`}
      data-status={qs.status}
      data-final={locked ? "true" : "false"}
    >
      {locked ? <LockIcon /> : null}
      <span>{quarter}</span>
      {label ? <span className="font-normal opacity-90">{label}</span> : null}
    </span>
  );
}

export function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
