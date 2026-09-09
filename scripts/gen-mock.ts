// Rebuilds data/mock-agent-outputs.json for every portco.
//   npm run gen:mock            template mode, no network, deterministic
//   npm run gen:mock -- --live  calls Claude through lib/claude.ts, then
//                               hand-check the file before committing
// Keys: `${portcoId}.${quarter|all}.${step}` plus `.alt` variants used by
// Regenerate. Values are strings for emails, objects for structured steps.
// The token {{replyBy}} is filled at runtime with a date two weeks out.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getAvailability,
  getBoardMembers,
  getPartners,
  getPortcoSeeds,
  getVenues,
  hydratePortco,
  personName,
} from "../lib/data";
import { findWindows, fmtDate, fmtTime, nextBestWindow, rankWindows, reverifyWindow, dayKey, weekdayOf, parseIso, quarterDayRange, daysBetween } from "../lib/scheduling";
import {
  boardEmailPayload,
  conflictPayload,
  logisticsPayload,
  partnerNames,
  pickedWindow,
  portcoEmailPayload,
  shortlistPayload,
  timeRange,
  QUARTER_MONTHS_LABEL,
} from "../lib/payloads";
import { CONFLICT_QUARTER, conflictMember, EA_SIGNATURE, simulatedPicks } from "../lib/simulate";
import { buildPrompt, extractJson } from "../lib/prompts";
import type { Portco, Quarter, Window } from "../lib/types";

const LIVE = process.argv.includes("--live");
const ROOT = resolve(__dirname, "..");
const REPLY_BY = "{{replyBy}}";

// ---------- build the demo state for a portco, same code the app runs ----------

function prepared(): Portco[] {
  return getPortcoSeeds().map((seed) => {
    let p = hydratePortco(seed);
    const res = findWindows({ portco: p, partners: getPartners(), boardMembers: getBoardMembers(), availability: getAvailability() });
    for (const q of p.targetQuarters) {
      const qs = p.quarters[q];
      p = { ...p, quarters: { ...p.quarters, [q]: { ...qs, windows: res[q].windows, thin: res[q].thin, shortlist: rankWindows(res[q].windows) } } };
    }
    const picks = simulatedPicks(p);
    for (const q of p.targetQuarters) {
      p = { ...p, quarters: { ...p.quarters, [q]: { ...p.quarters[q], portcoPick: picks[q]?.id } } };
    }
    return p;
  });
}

// ---------- template writers ----------

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function position(w: Window): "early" | "mid" | "late" {
  const { first, last } = quarterDayRange(2027, w.quarter);
  const span = daysBetween(first, last);
  const off = daysBetween(first, dayKey(w.start));
  if (off < span / 3) return "early";
  if (off > (2 * span) / 3) return "late";
  return "mid";
}

function reason(w: Window, idx: number, thinCount: number | null): string {
  const wd = WEEKDAY[weekdayOf(dayKey(w.start))];
  const h = parseIso(w.start).h;
  const pos = position(w);
  const posText = pos === "early" ? "early in the quarter" : pos === "late" ? "late in the quarter" : "in the middle of the quarter";
  const timeText =
    h === 10
      ? "a 10am start keeps travel easy and dinner on time"
      : h < 10
        ? `an ${fmtTime(w.start)} start means partners fly in the night before`
        : "an afternoon start lets partners fly in that morning, though dinner runs later";
  if (thinCount !== null) {
    return idx === 0
      ? `One of only ${thinCount} days this quarter when every partner is free. ${wd} ${posText}, and ${timeText}.`
      : `The other day that works for all partners. ${wd} ${posText}; ${timeText}.`;
  }
  if (idx === 0) return `${wd} ${posText}, and ${timeText}. Best spacing from the other quarters.`;
  if (idx === 1) return `Nearly as good. ${wd} ${posText}; ${timeText}.`;
  return `A solid backup. ${wd} ${posText}; ${timeText}.`;
}

function article(word: string): string {
  return /^(8|11|18)/.test(word) ? "an" : "a";
}

function firstName(full: string): string {
  return full.split(" ")[0];
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function onepager(p: Portco, alt = false): string {
  const partners = joinNames(partnerNames(p));
  const lines: string[] = [];
  lines.push(`Proposed 2027 quarterly meeting dates`);
  lines.push(`${p.name} and Greenbriar`);
  lines.push(``);
  lines.push(`Dear ${firstName(p.execContact.name)},`);
  lines.push(``);
  if (alt) {
    lines.push(`Here are the proposed dates for our four quarterly meetings in ${p.city.split(",")[0]} next year. Each meeting is four hours at your office at ${p.officeAddress}, with dinner afterward. ${partners} can make every option below.`);
  } else {
    lines.push(`Thank you for hosting us again next year. We would like to hold the four quarterly meetings at your office, ${p.officeAddress}. Each meeting runs four hours, followed by dinner nearby. The options below work for ${partners}.`);
  }
  lines.push(``);
  lines.push(`Please pick one option per quarter and reply by ${REPLY_BY}. If none of them work, tell us and we will look again.`);
  for (const q of p.targetQuarters) {
    const qs = p.quarters[q];
    lines.push(``);
    lines.push(`${q}, ${QUARTER_MONTHS_LABEL[q]}${qs.thin ? ` (only ${qs.shortlist.length} days worked for all partners)` : ""}`);
    qs.shortlist.forEach((w, i) => {
      lines.push(`  Option ${i + 1}: ${fmtDate(w.start)}, ${timeRange(w)}. Dinner at ${fmtTime(w.dinnerStart)}.`);
    });
  }
  lines.push(``);
  lines.push(`Your board members will be asked to confirm once you have chosen.`);
  lines.push(``);
  lines.push(alt ? `Thank you,` : `We look forward to seeing you.`);
  lines.push(EA_SIGNATURE);
  return lines.join("\n");
}

function portcoEmail(p: Portco, alt = false): string {
  const partners = joinNames(partnerNames(p));
  const first = firstName(p.execContact.name);
  if (alt) {
    return [
      `Subject: 2027 quarterly meeting dates, ${p.name} and Greenbriar`,
      ``,
      `Hi ${first},`,
      ``,
      `Attached are three date options for each of our 2027 quarterly meetings at your office. Every option works for ${partners}. Could you choose one per quarter and reply by ${REPLY_BY}? Once you have picked, we will confirm with your board and handle the rest. Thank you.`,
      ``,
      EA_SIGNATURE,
    ].join("\n");
  }
  return [
    `Subject: Proposed 2027 quarterly meeting dates for ${p.name}`,
    ``,
    `Dear ${first},`,
    ``,
    `On behalf of ${partners}, I have attached a one-page proposal with three options for each 2027 quarterly meeting at your office. Please pick one option per quarter and reply by ${REPLY_BY}. If none of the options work for a quarter, let me know and we will find more. After you choose, I will confirm the dates with your board members and arrange the dinners.`,
    ``,
    `Thank you,`,
    EA_SIGNATURE,
  ].join("\n");
}

function boardEmail(p: Portco, alt = false): string {
  const partners = joinNames(partnerNames(p));
  const members = getBoardMembers(p.id).map((m) => m.name);
  const picks = p.targetQuarters.map((q) => {
    const w = pickedWindow(p, q) as Window;
    return `  ${q}: ${fmtDate(w.start)}, ${timeRange(w)}, dinner at ${fmtTime(w.dinnerStart)}`;
  });
  const head = alt ? `Subject: Please confirm: ${p.name} 2027 board meeting dates` : `Subject: ${p.name} 2027 quarterly meetings, dates to confirm`;
  const opener = alt
    ? `${p.name} has chosen the dates below for the 2027 quarterly meetings with Greenbriar, held at their office in ${p.city}.`
    : `${firstName(p.execContact.name)} ${p.execContact.name.split(" ").slice(1).join(" ")} and the ${p.name} team have picked the following dates for the 2027 quarterly meetings, to be held at their ${p.city.split(",")[0]} office with dinner to follow.`;
  return [
    head,
    ``,
    `Dear ${joinNames(members)},`,
    ``,
    opener,
    ``,
    ...picks,
    ``,
    `From Greenbriar, ${partners} will attend each meeting. Could you reply with a yes for all four by ${REPLY_BY}? If any date does not work for you, please tell me right away and we will look at the alternates.`,
    ``,
    `Thank you,`,
    EA_SIGNATURE,
  ].join("\n");
}

function conflict(p: Portco, q: Quarter): { note: string; resend: string } {
  const member = conflictMember(getBoardMembers(p.id))!;
  const declined = pickedWindow(p, q) as Window;
  const fallback = nextBestWindow(p.quarters[q].shortlist, declined.id);
  const partners = joinNames(partnerNames(p));
  if (!fallback) {
    return {
      note: `${member.name} declined ${q} on ${fmtDate(declined.start)} and the approved shortlist has no other window for ${q}. Widen the search to 3-hour blocks or new weeks before re-sending.`,
      resend: `Dear board members, ${member.name} cannot make the ${q} date on ${fmtDate(declined.start)}. We are looking at additional dates and will send a new proposal shortly. ${EA_SIGNATURE}`,
    };
  }
  const rv = reverifyWindow(fallback, p.partnerIds, getAvailability());
  return {
    note: `${member.name} declined ${q} on ${fmtDate(declined.start)}, so I went back to the shortlist the partners approved and picked the rank ${fallback.rank} window, ${fmtDate(fallback.start)}, ${timeRange(fallback)}. I re-checked partner calendars and ${rv.ok ? "all four are still free" : `${joinNames(rv.busy.map(personName))} now has a conflict`}, so this is ready to send if you approve.`,
    resend: `Dear board members, ${member.name} is unable to make the ${q} meeting on ${fmtDate(declined.start)}, so we are dropping that date. We propose ${fmtDate(fallback.start)}, ${timeRange(fallback)}, with dinner at ${fmtTime(fallback.dinnerStart)}, which was on the original shortlist and works for ${partners} and the ${p.name} team. Could each of you reply with a yes for the new date by ${REPLY_BY}? ${EA_SIGNATURE}`,
  };
}

function logistics(p: Portco, alt = false): { picks: Record<string, { hotelId: string; restaurantId: string; reason: string }> } {
  const venues = getVenues(p.city);
  const hotels = venues.filter((v) => v.type === "hotel");
  const restaurants = venues.filter((v) => v.type === "restaurant");
  const picks: Record<string, { hotelId: string; restaurantId: string; reason: string }> = {};
  p.targetQuarters.forEach((q, i) => {
    const hotel = alt ? hotels[(i + 1) % hotels.length] : hotels[0];
    // Rotate restaurants so four dinners are not four identical nights.
    const restaurant = restaurants[(i + (alt ? 1 : 0)) % restaurants.length];
    picks[q] = {
      hotelId: hotel.id,
      restaurantId: restaurant.id,
      reason: `${hotel.name} is ${hotel.distanceMi} miles from the office. ${hotel.note}. ${restaurant.name} for dinner, ${restaurant.distanceMi} miles away. ${restaurant.note}.`,
    };
  });
  return { picks };
}

// ---------- live writers ----------

async function live<T>(step: Parameters<typeof buildPrompt>[0], payload: unknown, json: boolean, nudge = ""): Promise<T> {
  const { callClaude } = await import("../lib/claude");
  const text = await callClaude(buildPrompt(step, payload) + (nudge ? `\n\n${nudge}` : ""));
  return json ? extractJson<T>(text) : (text as T);
}

const ALT_NUDGE = "Write this differently from a previous draft: change the opening and the phrasing, keep every fact.";

// ---------- main ----------

async function main() {
  const out: Record<string, unknown> = {};
  for (const p of prepared()) {
    const key = (q: string, step: string) => `${p.id}.${q}.${step}`;
    console.log(`${p.id} ${p.name}${LIVE ? " (live)" : ""}`);

    if (LIVE) {
      const sp = shortlistPayload(p, REPLY_BY);
      out[key("all", "shortlist")] = await live("shortlist", sp, true);
      out[key("all", "shortlist") + ".alt"] = await live("shortlist", sp, true, ALT_NUDGE);
      const onepagerText = (out[key("all", "shortlist")] as { onepager: string }).onepager;
      const pe = portcoEmailPayload(p, onepagerText, REPLY_BY);
      out[key("all", "portcoEmail")] = await live("portcoEmail", pe, false);
      out[key("all", "portcoEmail") + ".alt"] = await live("portcoEmail", pe, false, ALT_NUDGE);
      const be = boardEmailPayload(p, REPLY_BY);
      out[key("all", "boardEmail")] = await live("boardEmail", be, false);
      out[key("all", "boardEmail") + ".alt"] = await live("boardEmail", be, false, ALT_NUDGE);
      const member = conflictMember(getBoardMembers(p.id))!;
      const declined = pickedWindow(p, CONFLICT_QUARTER) as Window;
      const fallback = nextBestWindow(p.quarters[CONFLICT_QUARTER].shortlist, declined.id);
      const rv = fallback ? reverifyWindow(fallback, p.partnerIds, getAvailability()) : { ok: false, busy: [] };
      out[key(CONFLICT_QUARTER, "conflict")] = await live("conflict", conflictPayload(p, CONFLICT_QUARTER, member.id, declined, fallback, rv), true);
      out[key("all", "logistics")] = await live("logistics", logisticsPayload(p), true);
      out[key("all", "logistics") + ".alt"] = await live("logistics", logisticsPayload(p), true, "Choose different venues from the list than an assistant might pick first, still well suited.");
    } else {
      const reasons: Record<string, string[]> = {};
      for (const q of p.targetQuarters) {
        const qs = p.quarters[q];
        reasons[q] = qs.shortlist.map((w, i) => reason(w, i, qs.thin ? qs.shortlist.length : null));
      }
      out[key("all", "shortlist")] = { reasons, onepager: onepager(p) };
      out[key("all", "shortlist") + ".alt"] = { reasons, onepager: onepager(p, true) };
      out[key("all", "portcoEmail")] = portcoEmail(p);
      out[key("all", "portcoEmail") + ".alt"] = portcoEmail(p, true);
      out[key("all", "boardEmail")] = boardEmail(p);
      out[key("all", "boardEmail") + ".alt"] = boardEmail(p, true);
      out[key(CONFLICT_QUARTER, "conflict")] = conflict(p, CONFLICT_QUARTER);
      out[key("all", "logistics")] = logistics(p);
      out[key("all", "logistics") + ".alt"] = logistics(p, true);
    }
  }
  const file = resolve(ROOT, "data/mock-agent-outputs.json");
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  const text = JSON.stringify(out);
  if (text.includes("—")) console.warn("WARNING: an em-dash slipped into the mock outputs.");
  console.log(`wrote ${Object.keys(out).length} keys to data/mock-agent-outputs.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
