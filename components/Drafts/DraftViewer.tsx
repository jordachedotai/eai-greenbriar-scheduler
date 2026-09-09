"use client";

// Shows an agent draft. Approve, Edit, and Regenerate live in the action
// bar; this only renders the text and handles in-place editing.

import { useEffect, useState } from "react";
import { editDraft } from "@/lib/actions";
import type { Draft } from "@/lib/types";
import { useDetail } from "@/components/Detail/DetailContext";
import { EmailDraft } from "./EmailDraft";
import { fmtStamp } from "@/lib/format";

type Props = { draftKey: string; title: string; sentLabel?: string; testId?: string; collapsed?: boolean; sentAt?: string };

export function DraftViewer({ draftKey, title, sentLabel = "Sent", testId, collapsed = false, sentAt }: Props) {
  const { portco, working, editingKey, setEditingKey } = useDetail();
  const draft: Draft | undefined = portco.drafts[draftKey];
  const editing = editingKey === draftKey;
  const [text, setText] = useState(draft?.text ?? "");
  const [open, setOpen] = useState(!collapsed);
  useEffect(() => setText(draft?.text ?? ""), [draft?.text]);
  useEffect(() => setOpen(!collapsed), [collapsed]);

  // A sent email folds to one line so the draft on screen is the only
  // full-size thing. Expand to read it.
  if (collapsed && !open && draft?.approved) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2 text-[13px]" data-testid={testId ?? `draft-${draftKey}`} data-collapsed="true">
        <span className="flex items-center gap-2">
          <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand">{sentLabel}</span>
          <span className="text-mut">{sentAt ? fmtStamp(sentAt) : ""}</span>
          <span>{title}</span>
        </span>
        <button type="button" className="text-brand hover:underline" onClick={() => setOpen(true)} data-testid="draft-expand">
          Show
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-panel" data-testid={testId ?? `draft-${draftKey}`}>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-mut">{title}</span>
          {draft?.approved ? (
            <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-medium text-brand" data-testid="draft-status">{sentLabel}</span>
          ) : draft ? (
            <span className="rounded bg-amber-soft px-1.5 py-0.5 text-[10.5px] font-medium text-amber" data-testid="draft-status">Draft</span>
          ) : null}
          {draft?.offline ? (
            <span className="rounded border border-line px-1.5 py-0.5 text-[10.5px] text-mut" title="The live call failed. This is the saved draft.">Offline draft</span>
          ) : null}
        </div>
        {editing ? (
          <div className="flex gap-1.5">
            <button type="button" className={small} onClick={() => { setText(draft?.text ?? ""); setEditingKey(null); }}>Cancel</button>
            <button type="button" className={small + " border-brand text-brand"} onClick={() => { editDraft(portco.id, draftKey, text); setEditingKey(null); }} data-testid="draft-save">Save</button>
          </div>
        ) : collapsed && open ? (
          <button type="button" className={small} onClick={() => setOpen(false)} data-testid="draft-collapse">Hide</button>
        ) : null}
      </div>
      <div className="px-3 py-3">
        {working ? (
          <Working label={working} />
        ) : !draft ? (
          <div className="text-[12.5px] text-mut">No draft yet.</div>
        ) : editing ? (
          <textarea className="min-h-[300px] w-full rounded border border-line bg-bg p-2 font-[inherit] text-[13px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} data-testid="draft-textarea" />
        ) : draft.email ? (
          <div data-testid="draft-text">
            <EmailDraft email={draft.email} />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-[inherit] text-[14px] leading-relaxed" data-testid="draft-text">{draft.text}</pre>
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

const small = "rounded border border-line bg-panel px-2 py-0.5 text-[11.5px] hover:border-brand";
