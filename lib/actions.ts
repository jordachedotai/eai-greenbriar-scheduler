"use client";

// Store and agent glue for the stage actions. The state changes themselves
// live in lib/transitions.ts so the demo state generator runs the same code.

import { useStore } from "./store";
import { runAgent } from "./agent";
import { getAvailability, getBoardMembers, getPartners, getVenues, personName } from "./data";
import { nowIso } from "./pipeline";
import { boardEmailPayload, conflictPayload, logisticsPayload, portcoEmailPayload, shortlistPayload } from "./payloads";
import { CONFLICT_QUARTER, conflictMember, replyByDate, simulatedPicks } from "./simulate";
import * as T from "./transitions";
import type { LogisticsPick, Portco, Quarter } from "./types";

export { allInternalApproved, allPicked, openConflicts, draftLabel } from "./transitions";

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
  const s = useStore.getState();
  s.setWorking({ portcoId: id, label });
  try {
    return await fn();
  } finally {
    useStore.getState().setWorking(null);
  }
}

function agentOpts(id: string, expectJson: boolean, variant = 0, quarter?: Quarter) {
  return { mock: useStore.getState().mockMode, portcoId: id, expectJson, variant, quarter, tokens: { replyBy: replyByDate() } };
}

export function allBoardConfirmed(p: Portco): boolean {
  return T.allBoardConfirmed(p, deps);
}

// ---------- stage 0 -> 1 ----------

export function pullAvailability(id: string) {
  apply(id, (p) => T.pullAvailability(p, deps));
}

// ---------- stage 1 -> 2 ----------

export async function buildShortlist(id: string) {
  apply(id, T.buildShortlist);
  await runShortlist(id, 0);
}

async function runShortlist(id: string, variant: number) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Ranking windows and drafting the one-pager" : "Rewriting the one-pager", async () => {
    const { data, offline } = await runAgent<T.ShortlistResult>("shortlist", shortlistPayload(p, replyByDate()), agentOpts(id, true, variant));
    apply(id, (cur) => T.applyShortlist(cur, data, offline, variant, deps));
  });
}

export async function regenerateShortlist(id: string) {
  await runShortlist(id, (get(id).drafts.onepager?.variant ?? 0) + 1);
}

export function approveOnepager(id: string) {
  apply(id, (p) => T.approveOnepager(p, deps));
}

// ---------- stage 3 ----------

export function markInternalApproval(id: string, partnerId: string) {
  apply(id, (p) => T.markInternalApproval(p, partnerId, deps));
}

export function simulateInternalApprovals(id: string) {
  apply(id, (p) => T.approveAllInternal(p, deps));
}

// ---------- stage 3 -> 4 ----------

export async function sendToPortco(id: string) {
  apply(id, T.sendToPortco);
  await runPortcoEmail(id, 0);
}

async function runPortcoEmail(id: string, variant: number) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Drafting the proposal email" : "Rewriting the proposal email", async () => {
    const payload = portcoEmailPayload(p, p.drafts.onepager?.text ?? "", replyByDate());
    const { data, offline } = await runAgent<string>("portcoEmail", payload, agentOpts(id, false, variant));
    apply(id, (cur) => T.applyPortcoEmail(cur, data, offline, variant, deps));
  });
}

export async function regeneratePortcoEmail(id: string) {
  await runPortcoEmail(id, (get(id).drafts.portcoEmail?.variant ?? 0) + 1);
}

export function approvePortcoEmail(id: string) {
  apply(id, (p) => T.approvePortcoEmail(p, deps));
}

export function simulatePortcoReply(id: string) {
  apply(id, (p) => T.recordPortcoPicks(p, simulatedPicks(p), deps));
}

// ---------- stage 4 -> 5 ----------

export async function sendToBoard(id: string) {
  apply(id, (p) => T.sendToBoard(p, deps));
  await runBoardEmail(id, 0);
}

async function runBoardEmail(id: string, variant: number) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Drafting the board email" : "Rewriting the board email", async () => {
    const { data, offline } = await runAgent<string>("boardEmail", boardEmailPayload(p, replyByDate()), agentOpts(id, false, variant));
    apply(id, (cur) => T.applyBoardEmail(cur, data, offline, variant, deps));
  });
}

export async function regenerateBoardEmail(id: string) {
  await runBoardEmail(id, (get(id).drafts.boardEmail?.variant ?? 0) + 1);
}

export function approveBoardEmail(id: string) {
  apply(id, (p) => T.approveBoardEmail(p, deps));
}

export function simulateBoardConfirmAll(id: string) {
  apply(id, (p) => T.boardConfirmAll(p, deps));
}

export async function simulateBoardConflict(id: string) {
  const member = conflictMember(getBoardMembers(id));
  if (!member) return;
  const q = CONFLICT_QUARTER;
  const { portco, declined, fallback, reverify } = T.boardConflict(get(id), member.id, q, deps);
  apply(id, () => portco);
  if (!declined) return;
  await withWorking(id, "Checking the shortlist and re-verifying partner calendars", async () => {
    const payload = conflictPayload(portco, q, member.id, declined, fallback, reverify);
    const { data, offline } = await runAgent<T.ConflictResult>("conflict", payload, agentOpts(id, true, 0, q));
    apply(id, (cur) => T.applyConflict(cur, q, member.id, declined, fallback, reverify, data, offline, deps));
  });
}

export function approveConflictResend(id: string, q: Quarter) {
  apply(id, (p) => T.approveConflictResend(p, q, deps));
}

// ---------- stage 5 -> 6 ----------

export async function lockAndPlan(id: string) {
  apply(id, (p) => T.lockDates(p, deps));
  await runLogistics(id, 0);
}

async function runLogistics(id: string, variant: number) {
  const p = get(id);
  await withWorking(id, variant === 0 ? "Choosing a hotel and restaurant for each meeting" : "Re-picking venues", async () => {
    const { data, offline } = await runAgent<T.LogisticsResult>("logistics", logisticsPayload(p), agentOpts(id, true, variant));
    apply(id, (cur) => T.applyLogistics(cur, data, offline, variant, deps));
  });
}

export async function regenerateLogistics(id: string) {
  await runLogistics(id, (get(id).drafts.logistics?.variant ?? 0) + 1);
}

export function setLogisticsPick(id: string, q: Quarter, patch: Partial<LogisticsPick>) {
  apply(id, (p) => T.setLogisticsPick(p, q, patch));
}

export function approveLogistics(id: string) {
  apply(id, (p) => T.approveLogistics(p, deps));
}

// ---------- drafts ----------

export function editDraft(id: string, key: string, text: string) {
  apply(id, (p) => T.editDraft(p, key, text, deps));
}
