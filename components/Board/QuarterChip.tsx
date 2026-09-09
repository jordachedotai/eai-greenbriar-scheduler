import type { Quarter, QuarterStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const TONE: Record<QuarterStatus, string> = {
  pending: "bg-panel2 text-mut border-line",
  availability: "bg-blue-soft text-blue border-blue/20",
  shortlist: "bg-blue-soft text-blue border-blue/20",
  internal: "bg-amber-soft text-amber border-amber/20",
  portco: "bg-amber-soft text-amber border-amber/20",
  board: "bg-amber-soft text-amber border-amber/20",
  locked: "bg-brand-soft text-brand border-brand/20",
};

export function QuarterChip({ quarter, status, label, final }: { quarter: Quarter; status: QuarterStatus; label?: string; final?: boolean }) {
  return (
    <span
      title={`${quarter}: ${STATUS_LABEL[status]}`}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${TONE[status]}`}
      data-status={status}
      data-final={final ? "true" : "false"}
    >
      {final ? <LockIcon /> : null}
      {quarter}
      {label ? <span className="font-normal opacity-80">{label}</span> : null}
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
