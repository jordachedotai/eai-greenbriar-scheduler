"use client";

import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

type Props = {
  stage: Stage;
  hint: string;
  button?: { label: string; onClick: () => void; disabled?: boolean; title?: string };
  children?: ReactNode;
};

export function StageFrame({ stage, hint, button, children }: Props) {
  return (
    <div className="rounded-lg border border-line bg-panel" data-testid="stage-panel" data-stage={stage}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-mut">Current stage</div>
          <div className="text-[14px] font-semibold">
            {stage}. {STAGE_NAMES[stage]}
          </div>
        </div>
        {button ? (
          <button
            type="button"
            onClick={button.onClick}
            disabled={button.disabled}
            title={button.title}
            data-testid="stage-button"
            className="rounded-md bg-brand px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {button.label}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-[12.5px] text-mut">{hint}</p>
        {children}
      </div>
    </div>
  );
}
