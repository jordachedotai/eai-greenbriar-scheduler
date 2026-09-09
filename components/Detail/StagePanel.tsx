"use client";

// Switches on the live stage, or on a done step opened read-only.

import { useDetail } from "./DetailContext";
import { FindDates } from "@/components/Stages/FindDates";
import { PartnerSignoff } from "@/components/Stages/PartnerSignoff";
import { PortcoPicks } from "@/components/Stages/PortcoPicks";
import { BoardConfirms } from "@/components/Stages/BoardConfirms";
import { LockAndBook } from "@/components/Stages/LockAndBook";

export function StagePanel() {
  const { stage, viewStep } = useDetail();
  const s = viewStep ?? stage;
  const readOnly = viewStep !== null;
  switch (s) {
    case 1:
      return <FindDates readOnly={readOnly} />;
    case 2:
      return <PartnerSignoff readOnly={readOnly} />;
    case 3:
      return <PortcoPicks readOnly={readOnly} />;
    case 4:
      return <BoardConfirms readOnly={readOnly} />;
    default:
      return <LockAndBook readOnly={readOnly} />;
  }
}
