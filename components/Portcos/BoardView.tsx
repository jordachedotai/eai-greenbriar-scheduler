"use client";

// Five columns, one per stage, per reference/design/Board.dc.html.

import Link from "next/link";
import { portcoStage } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import type { Portco, Stage } from "@/lib/types";
import { QUARTERS, STAGES, STAGE_NAMES } from "@/lib/types";
import { FaceStack } from "@/components/ui/Face";
import { LogoTile } from "@/components/ui/LogoTile";
import { IconCheck } from "@/components/ui/icons";
import { QuarterChip } from "./QuarterChip";
import { BUTTON } from "./PortcoRow";
import { eaName, rowStatus, TONE_PILL } from "./status";
import { usePortcoList } from "./usePortcoList";

export function BoardView() {
  const { visible } = usePortcoList();
  return (
    <section aria-label="Board" className="overflow-x-auto" data-testid="board-view">
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(6, minmax(250px, 1fr))" }}>
        {STAGES.map((stage) => {
          const cards = visible.filter((p) => portcoStage(p) === stage);
          const last = stage === 6;
          return (
            <div
              key={stage}
              className={"flex min-h-[420px] flex-col gap-2.5 rounded-[14px] border p-3 " + (last ? "border-[#cfdfd2] bg-brand-soft" : "border-idle-line bg-idle-soft")}
              data-testid={`column-${stage}`}
            >
              <div className="flex items-center justify-between px-1 py-0.5">
                <div className="flex items-center gap-2">
                  {last ? (
                    <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-green text-white"><IconCheck size={12} /></span>
                  ) : (
                    <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-ring bg-white text-[12px] font-bold text-mut">{stage}</span>
                  )}
                  <span className={"text-[15px] font-semibold " + (last ? "text-brand2" : "")}>{last ? "Invites out" : STAGE_NAMES[stage as Stage]}</span>
                </div>
                <span className={"text-[13px] font-semibold " + (last ? "text-brand" : "text-mut")} data-testid={`column-count-${stage}`}>{cards.length}</span>
              </div>
              {cards.map((p) => (
                <BoardCard key={p.id} portco={p} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BoardCard({ portco }: { portco: Portco }) {
  const eaFilter = useStore((s) => s.eaFilter);
  const st = rowStatus(portco);
  const needsYou = st.bucket === "you";
  const done = st.bucket === "done";
  return (
    <div
      className={
        "card-lift flex flex-col gap-2.5 rounded-[12px] bg-white p-3.5 " +
        (needsYou ? "border border-[#b9cbe3] border-t-4 border-t-you shadow-[var(--shadow-you)]" : done ? "border border-lock-line shadow-[var(--shadow-card)]" : "border border-line shadow-[var(--shadow-card)]")
      }
      data-testid={`card-${portco.id}`}
    >
      <div className="flex items-center gap-2.5">
        <LogoTile src={portco.logo} name={portco.name} width={56} height={40} radius={8} />
        <div className="flex min-w-0 flex-col gap-px">
          <Link href={`/portfolio/${portco.id}`} className="text-[15px] font-semibold leading-[1.2] text-txt hover:text-brand">{portco.name}</Link>
          <span className="truncate text-[13px] text-mut">
            {portco.city}
            {eaFilter === "all" ? ` · ${eaName(portco).split(" ")[0]}` : ""}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {QUARTERS.filter((q) => portco.targetQuarters.includes(q)).map((q) => (
          <QuarterChip key={q} portco={portco} quarter={q} variant="card" />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <FaceStack ids={portco.partnerIds} size={24} max={5} />
        <span className={"rounded-full px-2 py-0.5 text-[12px] font-semibold " + TONE_PILL[st.tone]}>{st.pill}</span>
      </div>
      <span className={"text-[13px] leading-snug " + (needsYou ? "text-txt" : "text-mut")}>{st.sentence}</span>
      <Link href={`/portfolio/${portco.id}`} className={"inline-flex h-9 items-center justify-center rounded-[9px] text-[14px] font-semibold " + BUTTON[st.button.kind]} data-testid={`card-action-${portco.id}`}>
        {st.button.label}
      </Link>
    </div>
  );
}
