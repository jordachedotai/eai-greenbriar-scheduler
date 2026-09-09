"use client";

// The right-hand panel of the drawer. One component per stage.

import type { Portco } from "@/lib/types";
import { portcoStage } from "@/lib/pipeline";
import { AvailabilityStage, SetupStage } from "./AvailabilityStage";
import { ShortlistStage } from "./ShortlistStage";
import { ApprovalStage } from "./ApprovalStage";
import { PortcoSendStage } from "./PortcoSendStage";
import { BoardSendStage } from "./BoardSendStage";
import { LogisticsStage } from "./LogisticsStage";

export function StagePanel({ portco }: { portco: Portco }) {
  switch (portcoStage(portco)) {
    case 0:
      return <SetupStage portco={portco} />;
    case 1:
      return <AvailabilityStage portco={portco} />;
    case 2:
      return <ShortlistStage portco={portco} />;
    case 3:
      return <ApprovalStage portco={portco} />;
    case 4:
      return <PortcoSendStage portco={portco} />;
    case 5:
      return <BoardSendStage portco={portco} />;
    default:
      return <LogisticsStage portco={portco} />;
  }
}
