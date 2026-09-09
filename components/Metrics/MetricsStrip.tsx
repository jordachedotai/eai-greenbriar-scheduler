"use client";

import { useStore } from "@/lib/store";
import { inFlight, lockedMeetings, totalMeetings } from "@/lib/pipeline";

type Tile = { label: string; value: string; note?: string; tone?: "brand" | "amber" | "mut" };

export function MetricsStrip() {
  const portcos = useStore((s) => s.portcos);
  const locked = lockedMeetings(portcos);
  const total = totalMeetings(portcos);

  const tiles: Tile[] = [
    { label: "Portcos in flight", value: String(inFlight(portcos)) },
    { label: "Meetings locked", value: `${locked} of ${total}`, tone: locked > 0 ? "brand" : undefined },
    { label: "Manual process", value: "About 2 months", note: "per portco, by hand", tone: "amber" },
    { label: "This flow", value: "Days", note: "per portco", tone: "brand" },
    { label: "EA hours saved", value: "Pending", note: "figure to come", tone: "mut" },
  ];

  return (
    <section aria-label="Metrics" className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-line bg-panel px-3 py-2.5">
          <div className="text-[10.5px] uppercase tracking-wide text-mut">{t.label}</div>
          <div
            className={
              "mt-0.5 text-[22px] font-semibold leading-tight " +
              (t.tone === "brand" ? "text-brand" : t.tone === "amber" ? "text-amber" : t.tone === "mut" ? "text-mut" : "text-txt")
            }
            data-testid={`metric-${t.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {t.value}
          </div>
          {t.note ? <div className="text-[11px] text-mut">{t.note}</div> : null}
        </div>
      ))}
    </section>
  );
}
