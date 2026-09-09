"use client";

// One row per portfolio company, per reference/design/Main.dc.html.

import Link from "next/link";
import { getBoardMembers } from "@/lib/data";
import { portcoPhase, portcoStage } from "@/lib/pipeline";
import { boardMembersOf } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import type { Portco } from "@/lib/types";
import { QUARTERS } from "@/lib/types";
import { FaceStack } from "@/components/ui/Face";
import { LogoTile } from "@/components/ui/LogoTile";
import { ProgressBar } from "./ProgressBar";
import { QuarterChip } from "./QuarterChip";
import { eaName, rowStatus, TONE_PILL } from "./status";

export const ROW_GRID = "248px 176px 290px 1fr 150px";

export const BUTTON: Record<"brand" | "you" | "secondary", string> = {
  brand: "bg-brand text-white shadow-[0_1px_2px_rgba(20,63,31,0.3)] hover:bg-brand2",
  you: "bg-you text-white shadow-[0_1px_2px_rgba(43,95,158,0.35)] hover:brightness-95",
  secondary: "border border-ring bg-white text-txt hover:border-brand",
};

export function PortcoRow({ portco }: { portco: Portco }) {
  const eaFilter = useStore((s) => s.eaFilter);
  const members = boardMembersOf(portco);
  const stage = portcoStage(portco);
  const phase = portcoPhase(portco, members);
  const st = rowStatus(portco);
  const needsYou = st.bucket === "you";
  return (
    <div
      className={
        "card-lift grid items-center gap-4 rounded-[14px] bg-white px-5 py-4 " +
        (needsYou ? "border border-[#b9cbe3] border-l-4 border-l-you shadow-[var(--shadow-you)]" : "border border-line shadow-[var(--shadow-card)]")
      }
      style={{ gridTemplateColumns: ROW_GRID }}
      data-testid={`row-${portco.id}`}
      data-row={portco.id}
      data-bucket={st.bucket}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <LogoTile src={portco.logo} name={portco.name} width={84} height={52} radius={10} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link href={`/portfolio/${portco.id}`} className="text-[17px] font-semibold leading-[1.2] text-txt hover:text-brand">
            {portco.name}
          </Link>
          <span className="truncate text-[14px] text-mut">
            {portco.city}
            {eaFilter === "all" ? (
              <>
                {" · "}
                <span data-testid="row-ea">{eaName(portco)}</span>
              </>
            ) : null}
          </span>
          <div className="mt-1.5">
            <FaceStack ids={portco.partnerIds} size={26} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ProgressBar stage={stage} done={phase === "done"} tone={st.tone} />
        <span className={"text-[14px] " + (phase === "done" ? "font-semibold text-lock" : "text-mut")}>{st.progress}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => (
          <QuarterChip key={q} portco={portco} quarter={q} variant="row" />
        ))}
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <span className={"rounded-full px-2.5 py-[3px] text-[13px] font-semibold " + TONE_PILL[st.tone]} data-testid="row-waiting">
          {st.pill}
        </span>
        <span className={"text-[14px] " + (needsYou ? "text-txt" : "text-mut")} data-testid="row-sentence">{st.sentence}</span>
      </div>
      <div className="flex justify-end">
        <Link
          href={`/portfolio/${portco.id}`}
          data-testid={`row-action-${portco.id}`}
          className={"inline-flex h-10 items-center whitespace-nowrap rounded-[10px] px-[18px] text-[15px] font-semibold " + BUTTON[st.button.kind]}
        >
          {st.button.label}
        </Link>
      </div>
    </div>
  );
}
