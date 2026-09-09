"use client";

// Shows a draft with the header bar from the Decline reference: caps
// title, Draft or Sent pill, "To ..." on the right. Approve, Edit, and
// Regenerate live in the action bar; editing happens here in place. A sent
// email can fold to one line so the draft on screen is the only full-size thing.

import { useEffect, useState } from "react";
import { editDraft } from "@/lib/actions";
import { useStore } from "@/lib/store";
import type { Draft } from "@/lib/types";
import { useDetail } from "@/components/Detail/DetailContext";
import { EmailDraft } from "./EmailDraft";
import { ViewEmail } from "./EmailDrawer";
import { fmtStamp } from "@/lib/format";

type Props = { draftKey: string; title: string; to?: string; sentLabel?: string; testId?: string; collapsed?: boolean; sentAt?: string; summary?: string };

export function DraftViewer({ draftKey, title, to, sentLabel = "Sent", testId, collapsed = false, sentAt, summary }: Props) {
  const { portco, working, editingKey, setEditingKey } = useDetail();
  const draft: Draft | undefined = portco.drafts[draftKey];
  const editing = editingKey === draftKey;
  const [text, setText] = useState(draft?.text ?? "");
  useEffect(() => setText(draft?.text ?? ""), [draft?.text]);

  if (collapsed && draft?.approved) {
    return (
      <div className="flex items-center justify-between rounded-[10px] border border-idle-line bg-[#fafbf9] px-3.5 py-2.5" data-testid={testId ?? `draft-${draftKey}`} data-collapsed="true">
        <span className="flex items-center gap-2.5 text-[14px] text-mut">
          <span className="rounded-full bg-lock-soft px-2 py-0.5 text-[12px] font-semibold text-lock">{sentLabel}</span>
          <span>
            {title}
            {sentAt ? ` · ${fmtStamp(sentAt)}` : ""}
            {summary ? ` · ${summary}` : ""}
          </span>
        </span>
        <ViewEmail portcoId={portco.id} draftKey={draftKey} testId="draft-expand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-line" data-testid={testId ?? `draft-${draftKey}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-bg px-[18px] py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-mut">{title}</span>
          {draft?.approved ? (
            <span className="rounded-full bg-lock-soft px-2 py-0.5 text-[12px] font-semibold text-lock" data-testid="draft-status">{sentLabel}</span>
          ) : draft ? (
            <span className="rounded-full bg-wait-soft px-2 py-0.5 text-[12px] font-semibold text-wait" data-testid="draft-status">Draft</span>
          ) : null}
          {draft?.offline ? <span className="rounded-full border border-line px-2 py-0.5 text-[12px] text-mut" title="The live call failed. This is the saved draft.">Offline draft</span> : null}
        </div>
        {editing ? (
          <div className="flex gap-1.5">
            <button type="button" className={small} onClick={() => { setText(draft?.text ?? ""); setEditingKey(null); }}>Cancel</button>
            <button type="button" className={small + " border-brand text-brand"} onClick={() => { editDraft(portco.id, draftKey, text); setEditingKey(null); }} data-testid="draft-save">Save</button>
          </div>
        ) : to ? (
          <span className="truncate text-[13px] text-mut">To {to}</span>
        ) : null}
      </div>
      <div className="bg-white px-[18px] py-[18px]">
        {working ? (
          <Working label={working} />
        ) : !draft ? (
          <div className="text-[15px] text-mut">No draft yet.</div>
        ) : editing ? (
          <textarea className="min-h-[320px] w-full rounded-[8px] border border-line bg-bg p-3 font-[inherit] text-[15px] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} data-testid="draft-textarea" />
        ) : draft.email ? (
          <div data-testid="draft-text">
            <EmailDraft email={draft.email} />
            {draft.attachment ? <AttachmentChip portcoId={portco.id} name={draft.attachment.name} draftKey={draft.attachment.draftKey} /> : null}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-[inherit] text-[16px] leading-[1.5]" data-testid="draft-text">{draft.text}</pre>
        )}
      </div>
    </div>
  );
}

export function Working({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-4 text-[15px] text-brand" data-testid="working">
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
      <span className="working">{label}</span>
    </div>
  );
}

const small = "rounded-[6px] border border-line bg-white px-2.5 py-1 text-[13px] font-medium hover:border-brand";

// The one attachment in the whole tool: the one-pager on the company proposal.
function AttachmentChip({ portcoId, name, draftKey }: { portcoId: string; name: string; draftKey: string }) {
  const setView = useStore((s) => s.setViewEmail);
  return (
    <div className="mt-4 inline-flex items-center gap-2.5 rounded-[10px] border border-line bg-bg px-3 py-2 text-[14px]" data-testid="attachment-chip">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mut" aria-hidden>
        <path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.5 3.5 0 0 1 5 5l-9 9a1.5 1.5 0 0 1-2.1-2.1l8-8" />
      </svg>
      <span className="font-medium">{name}</span>
      <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setView({ portcoId, draftKey, modal: true, title: name })} data-testid="attachment-preview">
        Preview
      </button>
    </div>
  );
}
