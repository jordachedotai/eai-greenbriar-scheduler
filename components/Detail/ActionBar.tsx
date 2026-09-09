"use client";

// The fixed action bar: one primary button, plus Edit and Regenerate when a
// draft is showing. Never below the fold.

import { primary, regenerate } from "@/lib/actions";
import { primaryAction, STAGE_DRAFT } from "@/lib/pipeline";
import { useDetail } from "./DetailContext";

export function ActionBar() {
  const { portco, members, stage, phase, working, editingKey, setEditingKey, viewStep, setViewStep } = useDetail();
  const action = primaryAction(portco, members);
  const draftKey = phase === "conflict" ? `conflict:${portco.targetQuarters.find((q) => portco.drafts[`conflict:${q}`] && !portco.drafts[`conflict:${q}`].approved)}` : STAGE_DRAFT[stage];
  const showingDraft = (phase === "review" || phase === "conflict") && !!portco.drafts[draftKey] && !working;
  const canRegenerate = showingDraft && phase === "review";

  if (viewStep !== null) {
    return (
      <div className="flex h-[64px] shrink-0 items-center justify-between border-t border-line bg-panel px-6" data-testid="action-bar">
        <span className="text-[12.5px] text-mut">Looking at a finished step, read only.</span>
        <button type="button" className={ghost} onClick={() => setViewStep(null)} data-testid="back-to-current">
          Back to the current step
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[64px] shrink-0 items-center justify-between border-t border-line bg-panel px-6" data-testid="action-bar">
      <div className="text-[12.5px] text-mut" data-testid="action-hint">
        {working ? <span className="working text-brand">{working}</span> : editingKey ? "Editing. Save or cancel in the draft." : action ? "" : "All four meetings are locked."}
      </div>
      <div className="flex items-center gap-2">
        {showingDraft && !editingKey ? (
          <button type="button" className={ghost} onClick={() => setEditingKey(draftKey)} data-testid="edit-draft">
            Edit
          </button>
        ) : null}
        {canRegenerate && !editingKey ? (
          <button type="button" className={ghost} onClick={() => void regenerate(portco.id)} data-testid="regenerate-draft">
            Regenerate
          </button>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={() => void primary(portco.id)}
            disabled={!action.enabled || !!working || !!editingKey}
            data-testid="primary-action"
            className="rounded-md bg-brand px-4 py-2 text-[13.5px] font-medium text-white hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export const ghost = "rounded-md border border-line bg-panel px-3 py-2 text-[12.5px] text-txt hover:border-brand disabled:cursor-not-allowed disabled:opacity-50";
