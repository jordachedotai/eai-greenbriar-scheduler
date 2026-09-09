"use client";

// The one-pager and the four emails as read-only templates, rendered from
// the same templates the agent uses, with a sample company. Edit is not
// wired yet.

import { useMemo } from "react";
import { loadDemoState } from "@/lib/data";
import { mockConflict } from "@/lib/mockAgent";
import { conflictPayload } from "@/lib/payloads";
import { EmailDraft } from "@/components/Drafts/EmailDraft";
import type { EmailFields } from "@/lib/types";

export function TemplatesPage() {
  const samples = useMemo(() => {
    const p = loadDemoState("council-at-board")["ait-worldwide-logistics"];
    const out: { key: string; title: string; when: string; email?: EmailFields }[] = [
      { key: "onepager", title: "One-pager to the company", when: "Step 1, after Find dates", email: p?.drafts.onepager?.email },
      { key: "partnerEmail", title: "Sign-off email to the partners", when: "Step 2", email: p?.drafts.partnerEmail?.email },
      { key: "portcoEmail", title: "Proposal email to the company", when: "Step 3", email: p?.drafts.portcoEmail?.email },
      { key: "boardEmail", title: "Confirmation email to the board", when: "Step 4", email: p?.drafts.boardEmail?.email },
    ];
    if (p) {
      const q = "Q3";
      const declined = p.quarters[q].shortlist.find((w) => w.id === p.quarters[q].portcoPick) ?? p.quarters[q].shortlist[0];
      const fallback = p.quarters[q].shortlist.find((w) => w.rank === 2) ?? null;
      const wording = mockConflict(conflictPayload(p, q, "b2", declined, fallback, { ok: true, busy: [] }));
      out.push({ key: "resend", title: "Re-send to the board after a decline", when: "Step 4, conflict path", email: wording.resend });
    }
    return out;
  }, []);

  return (
    <div className="flex flex-col gap-[18px]">
      <p className="text-[16px] text-mut">Every draft the agent writes starts from one of these. The sample uses AIT Worldwide Logistics. Editing a template changes every future draft.</p>
      {samples.map((s) => (
        <section key={s.key} className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)]" data-testid={`template-${s.key}`}>
          <div className="flex items-center justify-between border-b border-line bg-bg px-[22px] py-3.5">
            <div className="flex flex-col">
              <span className="serif text-[20px] font-semibold">{s.title}</span>
              <span className="text-[13px] text-mut">{s.when}</span>
            </div>
            <button type="button" title="Editing templates is not part of this demo." className="rounded-[8px] border border-ring bg-white px-3.5 py-1.5 text-[14px] font-semibold text-mut" data-testid={`template-edit-${s.key}`}>
              Edit
            </button>
          </div>
          <div className="px-[22px] py-[18px]">{s.email ? <EmailDraft email={s.email} /> : <span className="text-mut">No sample available.</span>}</div>
        </section>
      ))}
    </div>
  );
}
