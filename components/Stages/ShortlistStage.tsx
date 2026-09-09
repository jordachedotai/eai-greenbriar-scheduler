"use client";

// Stage 2: three ranked windows per quarter with a reason each, and the
// one-pager draft. Approve sends it for internal approval.

import { useStore } from "@/lib/store";
import { approveOnepager, editDraft, regenerateShortlist } from "@/lib/actions";
import type { Portco } from "@/lib/types";
import { STAGE_BUTTONS } from "@/lib/types";
import { DraftViewer } from "@/components/Drafts/DraftViewer";
import { StageFrame } from "./StageFrame";
import { WindowBlock } from "./AvailabilityStage";

export function ShortlistStage({ portco }: { portco: Portco }) {
  const working = useStore((s) => (s.working?.portcoId === portco.id ? s.working.label : null));
  const draft = portco.drafts.onepager;
  return (
    <StageFrame
      stage={2}
      hint="Three ranked windows per quarter with a reason each, and the one-pager the portco will receive. Approve to send it to the partners for sign-off."
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {portco.targetQuarters.map((q) => (
          <div key={q} className="rounded-lg border border-line bg-bg p-2" data-testid={`shortlist-${q}`}>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <span className="text-[12px] font-semibold">{q}</span>
              {portco.quarters[q].thin ? <span className="text-[11px] text-amber">thin quarter</span> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              {portco.quarters[q].shortlist.map((w) => (
                <WindowBlock key={w.id} w={w} rank={w.rank} reason={working ? undefined : w.reason} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <DraftViewer
        draft={draft}
        title="One-pager for the portco"
        approveLabel={STAGE_BUTTONS[2]}
        approvedLabel="Approved, with partners"
        onApprove={() => approveOnepager(portco.id)}
        onEdit={(t) => editDraft(portco.id, "onepager", t)}
        onRegenerate={() => void regenerateShortlist(portco.id)}
        working={working}
        testId="draft-onepager"
      />
    </StageFrame>
  );
}
