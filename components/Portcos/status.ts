"use client";

// Row and card status: the pill, the sentence under it, the button, and the
// caption on each quarter chip. One place so rows and cards agree.

import { getBoardMembers, getEa, getPartner } from "@/lib/data";
import { firstName, sinceLabel } from "@/lib/format";
import { allPartnersYes, allPicked, boardConfirmedQuarter, boardMembersOf, bucketOf, inviteCounts, openConflicts, portcoPhase, portcoStage, primaryAction, travelBookedCount, type Bucket } from "@/lib/pipeline";
import { fmtDate } from "@/lib/scheduling";
import type { ConflictData, Portco, Quarter } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

export type Tone = "you" | "wait" | "lock" | "idle";

export const TONE_PILL: Record<Tone, string> = {
  you: "bg-you-soft text-you",
  wait: "bg-wait-soft text-wait",
  lock: "bg-lock-soft text-lock",
  idle: "bg-idle-soft text-idle",
};

export function toneOfBucket(b: Bucket): Tone {
  return b === "you" ? "you" : b === "others" ? "wait" : b === "done" ? "lock" : "idle";
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
function word(n: number): string {
  return WORDS[n] ?? String(n);
}

function dayOf(iso: string): string {
  return sinceLabel(iso).replace(/^since /, "").replace(/ \d.*$/, "");
}

function plusDays(iso: string, n: number): string {
  const d = new Date(Date.parse(iso) + n * 86400000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
}

export type RowStatus = {
  tone: Tone;
  pill: string;
  sentence: string;
  button: { label: string; kind: "brand" | "you" | "secondary" };
  progress: string; // caption under the dots
  bucket: Bucket;
};

export function rowStatus(p: Portco): RowStatus {
  const members = boardMembersOf(p);
  const stage = portcoStage(p);
  const phase = portcoPhase(p, members);
  const bucket = bucketOf(p, members);
  const tone = toneOfBucket(bucket);
  const action = primaryAction(p, members);
  const firstQ = p.targetQuarters[0];
  const since = p.waitingSince ? dayOf(p.waitingSince) : "";

  let pill = "";
  let sentence = "";
  let button: RowStatus["button"] = { label: "Open", kind: "secondary" };
  let progress = phase === "done" ? "All four meetings locked" : phase === "idle" ? "Not started" : `Step ${stage} of 5, ${STAGE_NAMES[stage]}`;

  if (phase === "idle") {
    pill = "Not started";
    sentence = `${word(p.partnerIds.length)[0].toUpperCase() + word(p.partnerIds.length).slice(1)} partners assigned. Calendars connected.`;
    button = { label: "Find dates", kind: "brand" };
  } else if (phase === "done") {
    pill = "Locked";
    const inv = inviteCounts(p, members);
    const tr = travelBookedCount(p);
    sentence = inv.replied
      ? `Invites accepted ${inv.accepted} of ${inv.total}. Travel booked for ${tr.booked === tr.total ? "all" : word(tr.booked)} ${tr.booked === 1 ? "partner" : "partners"}.`
      : "All four meetings booked. Invites out from Outlook, no replies yet.";
    button = { label: "View", kind: "secondary" };
  } else if (phase === "waiting") {
    if (p.waitingOn === "partners") {
      const yes = p.partnerIds.filter((id) => p.quarters[firstQ].internalApprovals[id]);
      const pending = p.partnerIds.filter((id) => !p.quarters[firstQ].internalApprovals[id]);
      pill = "Waiting on partners";
      sentence = `${yes.length} of ${p.partnerIds.length} signed off. Waiting on ${pending.length > 2 ? `${word(pending.length)} partners` : pending.map((id) => firstNameOf(id)).join(" and ")} since ${since}.`;
    } else if (p.waitingOn === "portco") {
      pill = "Waiting on the company";
      sentence = `Proposal with ${p.execContact.title.includes("Executive Officer") ? "the CEO" : firstName(p.execContact.name)} since ${since}. Reply due ${p.waitingSince ? plusDays(p.waitingSince, 14) : ""}.`;
    } else {
      const confirmed = members.filter((m) => p.targetQuarters.every((q) => p.quarters[q].boardResponses[m.id] === "confirmed"));
      const pending = members.filter((m) => !confirmed.includes(m));
      pill = "Waiting on the board";
      sentence = `${confirmed.length} of ${members.length} confirmed. Waiting on ${pending.length > 2 ? `${word(pending.length)} members` : pending.map((m) => m.name).join(" and ")} since ${since}.`;
    }
    button = { label: "Open", kind: "secondary" };
  } else {
    pill = "Needs you";
    button = { label: action?.label ?? "Open", kind: "you" };
    if (phase === "conflict") {
      const q = openConflicts(p)[0];
      const data = p.drafts[`conflict:${q}`]?.data as ConflictData | undefined;
      const fallback = data && p.quarters[q].shortlist.find((w) => w.id === data.fallbackWindowId);
      sentence = data
        ? `${nameOf(data.memberId)} declined ${q}. ${fallback ? fmtDate(fallback.start).replace(/^\w+ /, "") + " proposed from the approved shortlist, partners re-checked." : "No other window on the shortlist."}`
        : "A board member declined.";
      button = { label: "Review re-send", kind: "you" };
    } else if (phase === "ready") {
      sentence = stage === 2 && allPartnersYes(p) ? "All partners signed off." : stage === 3 && allPicked(p) ? `${p.execContact.name} picked one date per quarter.` : "Every board member confirmed every quarter.";
    } else if (phase === "review") {
      sentence = stage === 1 ? "One-pager drafted, ready for your approval." : stage === 5 ? "Hotel and dinner picked for each meeting." : "Email drafted, ready to approve and send.";
    } else {
      sentence = "Dates found. Draft the next step.";
    }
  }
  return { tone, pill, sentence, button, progress, bucket };
}

function nameOf(id: string): string {
  return getBoardMembers().find((m) => m.id === id)?.name ?? id;
}

function firstNameOf(id: string): string {
  return getPartner(id)?.name ?? id;
}

export function eaName(p: Portco): string {
  return getEa(p.eaId)?.name ?? p.eaId;
}

// Chip caption and tone per quarter.
export function quarterChip(p: Portco, q: Quarter): { tone: Tone; label: string; caption: string; locked: boolean } {
  const qs = p.quarters[q];
  const members = boardMembersOf(p);
  const pick = qs.shortlist.find((w) => w.id === qs.portcoPick);
  const proposed = qs.shortlist.find((w) => w.rank === 1);
  const date = pick ?? (qs.status !== "notStarted" ? proposed : undefined);
  const label = date ? fmtDate(date.start).replace(/^\w+ /, "") : "";
  const conflict = p.drafts[`conflict:${q}`] && !p.drafts[`conflict:${q}`].approved;
  const locked = qs.status === "locked" && !!qs.logistics;
  if (locked) return { tone: "lock", label, caption: "booked", locked: true };
  if (conflict) return { tone: "you", label, caption: "re-send ready", locked: false };
  if (boardConfirmedQuarter(p, q, members)) return { tone: "lock", label, caption: "confirmed", locked: false };
  if (qs.status === "notStarted") return { tone: "idle", label: "", caption: "No date", locked: false };
  if (pick) return { tone: "wait", label, caption: "picked", locked: false };
  return { tone: "wait", label, caption: qs.status === "portcoPicked" ? "proposed" : "shortlisted", locked: false };
}
