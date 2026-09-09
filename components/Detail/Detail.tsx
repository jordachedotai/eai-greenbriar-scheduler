"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getBoardMembers, getEa } from "@/lib/data";
import { portcoPhase, portcoStage } from "@/lib/pipeline";
import type { Portco, Stage } from "@/lib/types";
import { DetailContext } from "./DetailContext";
import { Stepper } from "./Stepper";
import { QuarterStrip } from "./QuarterStrip";
import { StagePanel } from "./StagePanel";
import { ActionBar } from "./ActionBar";
import { ActivityTab } from "./ActivityTab";
import { LogoTile } from "@/components/ui/LogoTile";
import { FaceStack } from "@/components/ui/Face";

export function Detail({ portco }: { portco: Portco }) {
  const working = useStore((s) => (s.working?.portcoId === portco.id ? s.working.label : null));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [viewStep, setViewStep] = useState<Stage | null>(null);
  const members = getBoardMembers(portco.id);
  const stage = portcoStage(portco);
  const phase = portcoPhase(portco, members);
  const ea = getEa(portco.eaId);

  // When the live step moves on, drop any read-only view and edit mode.
  useEffect(() => {
    setViewStep(null);
    setEditingKey(null);
  }, [stage, phase]);

  return (
    <DetailContext.Provider value={{ portco, members, stage, phase, working, editingKey, setEditingKey, viewStep, setViewStep }}>
      <div className="flex h-full" data-testid="detail" data-stage={stage} data-phase={phase}>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-line bg-panel px-6 pt-4">
            <div className="flex items-center gap-4">
              <LogoTile src={portco.logo} name={portco.name} width={84} height={52} radius={10} />
              <div className="min-w-0 flex-1">
                <h2 className="text-[20px] font-semibold leading-tight">{portco.name}</h2>
                <div className="text-[13px] text-mut">
                  {portco.city} · {portco.officeAddress} · {ea?.name}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-mut">
                <FaceStack ids={portco.partnerIds} size={26} />
                <span>Greenbriar team</span>
              </div>
            </div>
            <Stepper />
          </div>
          <QuarterStrip />
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4" data-testid="stage-scroll">
            <StagePanel />
          </div>
          <ActionBar />
        </div>
        <ActivityTab />
      </div>
    </DetailContext.Provider>
  );
}
