"use client";

// Stage 2. Email to the partners, then wait for each yes.

import { personName } from "@/lib/data";
import { joinNames } from "@/lib/format";
import { allPartnersYes } from "@/lib/pipeline";
import { DraftViewer, Working } from "@/components/Drafts/DraftViewer";
import { useDetail } from "@/components/Detail/DetailContext";
import { resolvePerson } from "@/components/ui/Face";
import { PanelHeader, ReplyTracker, Section, WaitingState } from "./shared";

export function PartnerSignoff({ readOnly }: { readOnly: boolean }) {
  const { portco, phase, working } = useDetail();
  const names = joinNames(portco.partnerIds.map(personName));
  const draft = portco.drafts.partnerEmail;
  const firstQ = portco.targetQuarters[0];
  const rows = portco.partnerIds.map((pid) => ({ person: resolvePerson(pid), state: (portco.quarters[firstQ].internalApprovals[pid] ? "yes" : "pending") as "yes" | "pending" }));
  const allYes = allPartnersYes(portco);
  const title = readOnly || allYes ? "The partners signed off" : phase === "waiting" ? "Waiting on the partners" : "Partners sign off first";

  const sentAt = portco.log.find((e) => e.text.startsWith("Sent the one-pager to"))?.at;

  // Order: what needs the EA, the reason, the evidence, history.
  return (
    <div>
      <PanelHeader title={title}>
        {readOnly || allYes
          ? `${names} signed off on the one-pager before it went to ${portco.execContact.name}.`
          : phase === "waiting"
            ? `Sent to ${names}. Each partner replies yes before the company sees a date. That is the rule.`
            : working
              ? `Before ${portco.execContact.name} sees a date, ${names} confirm the one-pager is fine to send.`
              : `Before ${portco.execContact.name} sees a date, ${names} confirm the one-pager is fine to send. Read the email and approve it to send.`}
        {!readOnly && allYes ? " All partners said yes. Draft the email to the company." : ""}
      </PanelHeader>

      {!draft?.approved ? (
        <Section title="Email to the partners">
          {working && !draft ? <Working label={working} /> : <DraftViewer draftKey="partnerEmail" title="Sign-off email to the partners" to={names} />}
        </Section>
      ) : null}

      {!readOnly && phase === "waiting" ? <WaitingState /> : null}

      {draft?.approved || readOnly ? (
        <Section title="Partner replies" testId="partner-replies">
          <ReplyTracker rows={rows} />
        </Section>
      ) : null}

      {draft?.approved ? <DraftViewer draftKey="partnerEmail" title="Sign-off email to the partners" to={names} collapsed sentAt={sentAt} /> : null}
    </div>
  );
}
