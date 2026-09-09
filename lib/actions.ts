"use client";

// Store and agent glue for the five stages. The state changes themselves
// live in lib/transitions.ts so the demo state generator runs the same code.

import { useStore } from "./store";
import { runAgent } from "./agent";
import { getAvailability, getBoardMembers, getPartners, getVenues, personName } from "./data";
import { heldDays, nowIso, portcoPhase, portcoStage } from "./pipeline";
import {
  boardEmailPayload,
  conflictPayload,
  logisticsPayload,
  partnerEmailPayload,
  portcoEmailPayload,
  shortlistPayload,
} from "./payloads";
import { CONFLICT_QUARTER, conflictMember, replyByDate, simulatedPartnerReplies, simulatedPicks } from "./simulate";
import * as T from "./transitions";
import { asEmail } from "./email";
import type { LogisticsPick, Portco, Quarter } from "./types";

export { draftLabel } from "./transitions";

const deps: T.Deps = {
  partners: getPartners(),
  boardMembers: getBoardMembers(),
  availability: getAvailability(),
  venues: getVenues(),
  name: personName,
  now: nowIso,
};

function get(id: string): Portco {
  const p = useStore.getState().portcos[id];
  if (!p) throw new Error(`Unknown portco ${id}`);
  return p;
}

function apply(id: string, fn: (p: Portco) => Portco) {
  useStore.getState().updatePortco(id, fn);
}

async function withWorking<R>(id: string, label: string, fn: () => Promise<R>): Promise<R> {
  useStore.getState().setWorking({ portcoId: id, label });
  try {
    return await fn();
  } finally {
    useStore.getState().setWorking(null);
  }
}

function agentOpts(id: string, expectJson: boolean, variant = 0, quarter?: Quarter) {
  return { mock: useStore.getState().mockMode, portcoId: id, expectJson, variant, quarter, tokens: { replyBy: replyByDate() } };
}

// ---------- stage 1 attendees ----------

export function togglePartner(id: string, partnerId: string) {
  apply(id, (p) => T.togglePartner(p, partnerId));
}

export function addPartner(id: string, partnerId: string) {
  apply(id, (p) => T.addPartner(p, partnerId, deps));
}

// ---------- drafting steps, each callable on its own (Regenerate, or a
// missing draft after a reload) ----------

export async function draftOnepager(id: string, variant = 0) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Writing reasons and drafting the one-pager" : "Rewriting the one-pager", async () => {
    const { data, offline } = await runAgent<{ reasons: Record<string, string[]>; onepager: unknown }>("shortlist", shortlistPayload(p, replyByDate()), agentOpts(id, true, variant));
    apply(id, (cur) => T.applyOnepager(cur, { reasons: data.reasons, onepager: asEmail(data.onepager) }, offline, variant, deps));
  });
}

export async function draftPartnerEmail(id: string, variant = 0) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Drafting the sign-off email to the partners" : "Rewriting the partner email", async () => {
    const payload = partnerEmailPayload(p, p.drafts.onepager?.text ?? "", replyByDate());
    const { data, offline } = await runAgent<unknown>("partnerEmail", payload, agentOpts(id, true, variant));
    apply(id, (cur) => T.applyPartnerEmail(cur, asEmail(data), offline, variant, deps));
  });
}

export async function draftPortcoEmail(id: string, variant = 0) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Drafting the proposal email to the portco" : "Rewriting the proposal email", async () => {
    const payload = portcoEmailPayload(p, p.drafts.onepager?.text ?? "", replyByDate());
    const { data, offline } = await runAgent<unknown>("portcoEmail", payload, agentOpts(id, true, variant));
    apply(id, (cur) => T.applyPortcoEmail(cur, asEmail(data), offline, variant, deps));
  });
}

export async function draftBoardEmail(id: string, variant = 0) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Drafting the confirmation email to the board" : "Rewriting the board email", async () => {
    const { data, offline } = await runAgent<unknown>("boardEmail", boardEmailPayload(p, replyByDate()), agentOpts(id, true, variant));
    apply(id, (cur) => T.applyBoardEmail(cur, asEmail(data), offline, variant, deps));
  });
}

export async function draftLogistics(id: string, variant = 0) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Choosing a hotel and a restaurant for each meeting" : "Re-picking venues", async () => {
    const { data, offline } = await runAgent<T.LogisticsResult>("logistics", logisticsPayload(p), agentOpts(id, true, variant));
    apply(id, (cur) => T.applyLogistics(cur, data, offline, variant, deps));
  });
}

// ---------- the primary button, one handler ----------

export async function primary(id: string) {
  const p = get(id);
  const members = getBoardMembers(id);
  const stage = portcoStage(p);
  const phase = portcoPhase(p, members);
  if (phase === "done" || phase === "waiting") return;
  switch (stage) {
    case 1:
      if (phase === "idle") {
        const others = Object.values(useStore.getState().portcos).filter((o) => o.id !== id);
        apply(id, (cur) => T.findDates(cur, deps, heldDays(others, cur.partnerIds)));
        await draftOnepager(id);
      } else if (phase === "needsDraft") {
        await draftOnepager(id);
      } else {
        apply(id, (cur) => T.approveOnepager(cur, deps));
        await draftPartnerEmail(id);
      }
      return;
    case 2:
      if (phase === "needsDraft") await draftPartnerEmail(id);
      else if (phase === "review") apply(id, (cur) => T.sendToPartners(cur, deps));
      else {
        apply(id, (cur) => T.startPortcoPicks(cur, deps));
        await draftPortcoEmail(id);
      }
      return;
    case 3:
      if (phase === "needsDraft") await draftPortcoEmail(id);
      else if (phase === "review") apply(id, (cur) => T.sendToPortco(cur, deps));
      else {
        apply(id, (cur) => T.startBoardConfirms(cur, deps));
        await draftBoardEmail(id);
      }
      return;
    case 4:
      if (phase === "needsDraft") await draftBoardEmail(id);
      else if (phase === "review") apply(id, (cur) => T.sendToBoard(cur, deps));
      else if (phase === "conflict") {
        for (const q of p.targetQuarters) {
          if (p.drafts[`conflict:${q}`] && !p.drafts[`conflict:${q}`].approved) apply(id, (cur) => T.approveResend(cur, q, deps));
        }
      } else {
        apply(id, (cur) => T.lockAndBook(cur, deps));
        await draftLogistics(id);
      }
      return;
    case 5:
      if (phase === "needsDraft") await draftLogistics(id);
      else apply(id, (cur) => T.approveAndLock(cur, deps));
      return;
    default:
      if (phase === "needsDraft") apply(id, (cur) => T.withDraft(cur, "invites", { kind: "invites", portcoId: id, text: "", approved: false, data: T.buildInvites(cur, deps) }));
      else if (phase === "review") apply(id, (cur) => T.sendInvites(cur, deps));
  }
}

// ---------- regenerate the draft for the current stage ----------

export async function regenerate(id: string) {
  const p = get(id);
  const stage = portcoStage(p);
  const key = ["", "onepager", "partnerEmail", "portcoEmail", "boardEmail", "logistics", "invites"][stage];
  const variant = (p.drafts[key]?.variant ?? 0) + 1;
  if (stage === 1) await draftOnepager(id, variant);
  else if (stage === 2) await draftPartnerEmail(id, variant);
  else if (stage === 3) await draftPortcoEmail(id, variant);
  else if (stage === 4) await draftBoardEmail(id, variant);
  else if (stage === 5) await draftLogistics(id, variant);
}

export function editDraft(id: string, key: string, text: string) {
  apply(id, (p) => T.editDraft(p, key, text, deps));
}

export function setLogisticsPick(id: string, q: Quarter, patch: Partial<LogisticsPick>) {
  apply(id, (p) => T.setLogisticsPick(p, q, patch));
}

// ---------- demo simulations (the replies that Outlook would deliver) ----------

export function simulatePartnerReplies(id: string) {
  apply(id, (p) => T.partnerReplies(p, simulatedPartnerReplies(p), deps));
}

export function simulatePortcoPicks(id: string) {
  apply(id, (p) => T.recordPortcoPicks(p, simulatedPicks(p), deps));
}

export function simulateBoardConfirms(id: string) {
  apply(id, (p) => T.boardConfirmAll(p, deps));
}

export function simulateInvites(id: string, mode: "mixed" | "all" = "mixed") {
  apply(id, (p) => T.simulateInvites(p, deps, mode));
}

export async function simulateBoardConflict(id: string) {
  const member = conflictMember(getBoardMembers(id));
  if (!member) return;
  const q = CONFLICT_QUARTER;
  const { portco, declined, fallback, reverify } = T.boardConflict(get(id), member.id, q, deps);
  apply(id, () => portco);
  if (!declined) return;
  await withWorking(id, "Checking the approved shortlist and re-verifying partner calendars", async () => {
    const payload = conflictPayload(portco, q, member.id, declined, fallback, reverify);
    const { data, offline } = await runAgent<{ note: string; resend: unknown }>("conflict", payload, agentOpts(id, true, 0, q));
    apply(id, (cur) => T.applyConflict(cur, q, member.id, declined, fallback, reverify, { note: data.note, resend: asEmail(data.resend) }, offline, deps));
  });
}
