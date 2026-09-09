"use client";

// A side drawer showing one email: a reply the agent read, or an email
// the EA sent. Opened from pick rows, board cells, partner replies, folded
// sent rows, and activity entries.

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { fmtStamp } from "@/lib/format";
import { getCurrentEa } from "@/lib/data";
import { draftLabel } from "@/lib/transitions";
import { Face, resolvePerson, type Person } from "@/components/ui/Face";
import { EmailDraft } from "./EmailDraft";

export function EmailDrawer() {
  const view = useStore((s) => s.viewEmail);
  const setView = useStore((s) => s.setViewEmail);
  const portco = useStore((s) => (view ? s.portcos[view.portcoId] : undefined));

  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setView(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, setView]);

  if (!view || !portco) return null;
  const reply = view.replyId ? portco.replies?.find((r) => r.id === view.replyId) : undefined;
  const draft = view.draftKey ? portco.drafts[view.draftKey] : undefined;
  if (!reply && !draft) return null;
  const ea = getCurrentEa();
  const from: Person = reply
    ? reply.kind === "sent"
      ? { id: ea.id, name: ea.name, avatar: ea.avatar }
      : reply.from.personId
        ? resolvePerson(reply.from.personId)
        : { name: reply.from.name }
    : { id: ea.id, name: ea.name, avatar: ea.avatar };
  const subject = reply ? reply.subject : draft?.email?.subject ?? draft?.email?.title ?? draftLabel(view.draftKey ?? "");
  const at = reply?.at;
  const to = reply?.to;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Email">
      <div className="absolute inset-0 bg-txt/25" onClick={() => setView(null)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl" data-testid="email-drawer">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <Face person={from} size={40} />
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold">{from.name}</span>
              <span className="text-[13px] text-mut">
                {to ? `to ${to}` : ""}
                {at ? ` · ${fmtStamp(at)}` : ""}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setView(null)} className="rounded-[8px] border border-ring bg-white px-3 py-1.5 text-[14px] font-semibold hover:border-brand" data-testid="email-drawer-close">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h3 className="mb-4 text-[18px] font-semibold leading-tight" data-testid="email-drawer-subject">{subject}</h3>
          {reply ? (
            <pre className="whitespace-pre-wrap font-[inherit] text-[16px] leading-[1.5]" data-testid="email-drawer-body">{reply.body}</pre>
          ) : draft?.email ? (
            <EmailDraft email={draft.email} />
          ) : (
            <pre className="whitespace-pre-wrap font-[inherit] text-[16px] leading-[1.5]" data-testid="email-drawer-body">{draft?.text}</pre>
          )}
          {reply && reply.kind !== "sent" ? <p className="mt-6 text-[13px] text-mut">Read by the agent. The table on the company page was filled from this reply. In production it comes from Outlook.</p> : null}
        </div>
      </aside>
    </div>
  );
}

// A small "View" link that opens the drawer.
export function ViewEmail({ portcoId, replyId, draftKey, label = "View", testId }: { portcoId: string; replyId?: string; draftKey?: string; label?: string; testId?: string }) {
  const setView = useStore((s) => s.setViewEmail);
  return (
    <button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={() => setView({ portcoId, replyId, draftKey })} data-testid={testId ?? "view-email"}>
      {label}
    </button>
  );
}
