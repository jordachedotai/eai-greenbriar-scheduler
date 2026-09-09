"use client";

// The company page, per reference/design/FindDates.dc.html and Decline.dc.html.
// Header card with stepper and quarter strip, stage panel beside a 320px
// Activity panel, pinned action bar.

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getBoardMembers, getEa } from "@/lib/data";
import { portcoPhase, portcoStage } from "@/lib/pipeline";
import { boardMembersOf } from "@/lib/pipeline";
import type { Portco, Stage } from "@/lib/types";
import { rowStatus, TONE_PILL } from "@/components/Portcos/status";
import { LogoTile } from "@/components/ui/LogoTile";
import { Face } from "@/components/ui/Face";
import { DetailContext } from "./DetailContext";
import { Stepper } from "./Stepper";
import { QuarterStrip } from "./QuarterStrip";
import { StagePanel } from "./StagePanel";
import { ActionBar } from "./ActionBar";
import { ActivityTab } from "./ActivityTab";

export function Detail({ portco }: { portco: Portco }) {
  const working = useStore((s) => (s.working?.portcoId === portco.id ? s.working.label : null));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [viewStep, setViewStep] = useState<Stage | null>(null);
  const members = boardMembersOf(portco);
  const stage = portcoStage(portco);
  const phase = portcoPhase(portco, members);
  const ea = getEa(portco.eaId);
  const st = rowStatus(portco);

  useEffect(() => {
    setViewStep(null);
    setEditingKey(null);
  }, [stage, phase]);

  return (
    <DetailContext.Provider value={{ portco, members, stage, phase, working, editingKey, setEditingKey, viewStep, setViewStep }}>
      <div className="flex h-full flex-col" data-testid="detail" data-stage={stage} data-phase={phase}>
        <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-7 pt-[22px]" data-testid="stage-scroll">
          <section className="flex shrink-0 flex-col gap-[18px] rounded-[14px] border border-line bg-white px-[22px] py-[18px] shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <LogoTile src={portco.logo} name={portco.name} width={84} height={52} radius={10} />
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[20px] font-semibold leading-[1.2]">{portco.name}</h2>
                  <span className="text-[14px] text-mut">
                    {portco.city} · {portco.officeAddress.replace(`, ${portco.city}`, "")}
                    {portco.sector ? ` · ${portco.sector}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={"rounded-full px-2.5 py-[3px] text-[13px] font-semibold " + TONE_PILL[st.tone]} data-testid="detail-pill">{st.pill}</span>
                {ea ? (
                  <span className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5">
                    <Face person={{ id: ea.id, name: ea.name, avatar: ea.avatar }} size={24} />
                    <span className="text-[13px] text-mut">{ea.name}</span>
                  </span>
                ) : null}
              </div>
            </div>
            <Stepper />
            <QuarterStrip />
          </section>

          <section className="grid min-h-0 flex-1 grid-cols-1 gap-[18px] pb-[18px] xl:grid-cols-[1fr_320px]">
            <div className="rounded-[14px] border border-line bg-white p-[22px] shadow-[var(--shadow-card)]">
              <StagePanel />
            </div>
            <ActivityTab />
          </section>
        </div>
        <ActionBar />
      </div>
    </DetailContext.Provider>
  );
}
