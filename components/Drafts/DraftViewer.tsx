"use client";

// Shows an agent draft with three controls: Approve, Edit, Regenerate.
// Approve is the only thing that advances a stage.

import { useEffect, useState } from "react";
import type { Draft } from "@/lib/types";

type Props = {
  draft: Draft | undefined;
  title: string;
  approveLabel: string;
  approvedLabel?: string;
  onApprove: () => void;
  onEdit?: (text: string) => void;
  onRegenerate?: () => void;
  working?: string | null; // label while the agent runs
  disabled?: boolean;
  testId?: string;
};

export function DraftViewer({ draft, title, approveLabel, approvedLabel, onApprove, onEdit, onRegenerate, working, disabled, testId }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft?.text ?? "");

  useEffect(() => {
    setText(draft?.text ?? "");
    setEditing(false);
  }, [draft?.text]);

  return (
    <div className="rounded-lg border border-line bg-panel" data-testid={testId ?? "draft"}>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-mut">{title}</span>
          {draft?.approved ? (
            <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-medium text-brand" data-testid="draft-approved">
              {approvedLabel ?? "Approved"}
            </span>
          ) : draft ? (
            <span className="rounded bg-amber-soft px-1.5 py-0.5 text-[10.5px] font-medium text-amber">Draft</span>
          ) : null}
          {draft?.offline ? (
            <span className="rounded border border-line px-1.5 py-0.5 text-[10.5px] text-mut" title="The live call failed. This is the saved draft.">
              Offline draft
            </span>
          ) : null}
        </div>
        {draft && !draft.approved && !working ? (
          <div className="flex items-center gap-1.5">
            {onEdit ? (
              editing ? (
                <>
                  <button type="button" className={ghost} onClick={() => { setEditing(false); setText(draft.text); }}>
                    Cancel
                  </button>
                  <button type="button" className={ghost} onClick={() => { onEdit(text); setEditing(false); }} data-testid="draft-save">
                    Save
                  </button>
                </>
              ) : (
                <button type="button" className={ghost} onClick={() => setEditing(true)} data-testid="draft-edit" disabled={disabled}>
                  Edit
                </button>
              )
            ) : null}
            {onRegenerate ? (
              <button type="button" className={ghost} onClick={onRegenerate} data-testid="draft-regenerate" disabled={disabled || editing}>
                Regenerate
              </button>
            ) : null}
            <button type="button" className={primary} onClick={onApprove} data-testid="draft-approve" disabled={disabled || editing}>
              {approveLabel}
            </button>
          </div>
        ) : null}
      </div>
      <div className="px-3 py-3">
        {working ? (
          <Working label={working} />
        ) : !draft ? (
          <div className="text-[12.5px] text-mut">No draft yet.</div>
        ) : editing ? (
          <textarea
            className="min-h-[320px] w-full rounded border border-line bg-bg p-2 font-[inherit] text-[13px] leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid="draft-textarea"
          />
        ) : (
          <pre className="whitespace-pre-wrap font-[inherit] text-[13px] leading-relaxed" data-testid="draft-text">
            {draft.text}
          </pre>
        )}
      </div>
    </div>
  );
}

export function Working({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-4 text-[13px] text-brand" data-testid="working">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand" />
      <span className="working">{label}</span>
    </div>
  );
}

export const ghost = "rounded border border-line bg-panel px-2.5 py-1 text-[12px] text-txt hover:border-brand disabled:cursor-not-allowed disabled:opacity-50";
export const primary = "rounded-md bg-brand px-3 py-1 text-[12.5px] font-medium text-white hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-50";
