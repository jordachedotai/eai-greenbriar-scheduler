// Mock agent: deterministic template writers over the same payloads the
// live agent receives. Mock mode renders these at runtime, so the text
// always matches the shortlist on screen. No network. Written in the EA's
// voice. No em-dashes.

import type {
  BoardEmailPayload,
  ConflictPayload,
  LogisticsPayload,
  PartnerEmailPayload,
  PortcoEmailPayload,
  ShortlistPayload,
  WindowPayload,
} from "./prompts";
import type { LogisticsPick } from "./types";

const WEEKDAY: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
const MONTH_INDEX: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

function firstName(full: string): string {
  return full.split(" ")[0];
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function article(word: string): string {
  return /^(8|11|18)/.test(word) ? "an" : "a";
}

// "Tue Feb 2" -> weekday, month number, day
function parseDate(date: string): { weekday: string; month: number; day: number } {
  const [wd, mon, d] = date.split(" ");
  return { weekday: WEEKDAY[wd] ?? wd, month: MONTH_INDEX[mon] ?? 0, day: Number(d) };
}

// "1pm to 5pm" -> 13
function startHour(time: string): number {
  const m = time.match(/^(\d+)(?::(\d+))?(am|pm)/);
  if (!m) return 10;
  let h = Number(m[1]) % 12;
  if (m[3] === "pm") h += 12;
  return h;
}

function position(month: number, day: number): "early" | "mid" | "late" {
  const inQuarter = (month - 1) % 3; // 0, 1, 2
  const t = inQuarter + (day - 1) / 31;
  if (t < 1) return "early";
  if (t > 2) return "late";
  return "mid";
}

export function windowReason(w: WindowPayload, idx: number, thinCount: number | null): string {
  const { weekday, month, day } = parseDate(w.date);
  const h = startHour(w.time);
  const start = w.time.split(" ")[0];
  const pos = position(month, day);
  const posText = pos === "early" ? "early in the quarter" : pos === "late" ? "late in the quarter" : "in the middle of the quarter";
  const timeText =
    h === 10
      ? "a 10am start keeps travel easy and dinner on time"
      : h < 10
        ? `${article(start)} ${start} start means partners fly in the night before`
        : `${article(start)} ${start} start lets partners fly in that morning, though dinner runs later`;
  if (thinCount !== null) {
    return idx === 0
      ? `One of only ${thinCount} days this quarter when every partner is free. ${weekday} ${posText}, and ${timeText}.`
      : `The other day that works for all partners. ${weekday} ${posText}; ${timeText}.`;
  }
  if (idx === 0) return `${weekday} ${posText}, and ${timeText}. Best spacing from the other quarters.`;
  if (idx === 1) return `Nearly as good. ${weekday} ${posText}; ${timeText}.`;
  return `A solid backup. ${weekday} ${posText}; ${timeText}.`;
}

export function mockShortlist(p: ShortlistPayload, variant = 0): { reasons: Record<string, string[]>; onepager: string } {
  const alt = variant % 2 === 1;
  const reasons: Record<string, string[]> = {};
  for (const q of p.quarters) reasons[q.quarter] = q.windows.map((w, i) => windowReason(w, i, q.thin ? q.windows.length : null));
  const partners = joinNames(p.partners);
  const lines: string[] = [];
  lines.push(`Proposed 2027 quarterly meeting dates`);
  lines.push(`${p.portco.name} and Greenbriar`);
  lines.push(``);
  lines.push(`Dear ${firstName(p.execContact.name)},`);
  lines.push(``);
  if (alt) {
    lines.push(`Here are the proposed dates for our four quarterly meetings in ${p.portco.city.split(",")[0]} next year. Each meeting is four hours at your office at ${p.portco.officeAddress}, with dinner afterward. ${partners} can make every option below.`);
  } else {
    lines.push(`Thank you for hosting us again next year. We would like to hold the four quarterly meetings at your office, ${p.portco.officeAddress}. Each meeting runs four hours, followed by dinner nearby. The options below work for ${partners}.`);
  }
  lines.push(``);
  lines.push(`Please pick one option per quarter and reply by ${p.replyBy}. If none of them work, tell us and we will look again.`);
  for (const q of p.quarters) {
    lines.push(``);
    lines.push(`${q.quarter}, ${q.months}${q.thin ? ` (only ${q.windows.length} days worked for all partners)` : ""}`);
    q.windows.forEach((w, i) => {
      lines.push(`  Option ${i + 1}: ${w.date}, ${w.time}. Dinner at ${w.dinner}.`);
    });
  }
  lines.push(``);
  lines.push(`Your board members will be asked to confirm once you have chosen.`);
  lines.push(``);
  lines.push(alt ? `Thank you,` : `We look forward to seeing you.`);
  lines.push(p.eaSignature);
  return { reasons, onepager: lines.join("\n") };
}

export function mockPartnerEmail(p: PartnerEmailPayload, variant = 0): string {
  const alt = variant % 2 === 1;
  const firsts = joinNames(p.partners.map(firstName));
  if (alt) {
    return [
      `Subject: OK to send? ${p.portco.name} 2027 meeting options`,
      ``,
      `${firsts},`,
      ``,
      `Attached are the proposed 2027 quarterly meeting options for ${p.portco.name}, three per quarter, all from your calendars. Please reply yes by ${p.replyBy} if I can send this to ${p.execContact.name}. Tell me if any option should come off the list first.`,
      ``,
      p.eaSignature,
    ].join("\n");
  }
  return [
    `Subject: ${p.portco.name} 2027 quarterly meetings, options for your sign-off`,
    ``,
    `${firsts},`,
    ``,
    `Before anything goes to ${p.execContact.name}, please look at the attached one-pager with three date options per quarter for the ${p.portco.name} meetings in ${p.portco.city.split(",")[0]}. Every option is a four hour block where all of you are free, with dinner after. Reply yes by ${p.replyBy} and I will send it on, or tell me what to change.`,
    ``,
    `Thank you,`,
    p.eaSignature,
  ].join("\n");
}

export function mockPortcoEmail(p: PortcoEmailPayload, variant = 0): string {
  const alt = variant % 2 === 1;
  const partners = joinNames(p.partners);
  const first = firstName(p.execContact.name);
  if (alt) {
    return [
      `Subject: 2027 quarterly meeting dates, ${p.portco.name} and Greenbriar`,
      ``,
      `Hi ${first},`,
      ``,
      `Attached are three date options for each of our 2027 quarterly meetings at your office. Every option works for ${partners}. Could you choose one per quarter and reply by ${p.replyBy}? Once you have picked, we will confirm with your board and handle the rest. Thank you.`,
      ``,
      p.eaSignature,
    ].join("\n");
  }
  return [
    `Subject: Proposed 2027 quarterly meeting dates for ${p.portco.name}`,
    ``,
    `Dear ${first},`,
    ``,
    `On behalf of ${partners}, I have attached a one-page proposal with three options for each 2027 quarterly meeting at your office. Please pick one option per quarter and reply by ${p.replyBy}. If none of the options work for a quarter, let me know and we will find more. After you choose, I will confirm the dates with your board members and arrange the dinners.`,
    ``,
    `Thank you,`,
    p.eaSignature,
  ].join("\n");
}

export function mockBoardEmail(p: BoardEmailPayload, variant = 0): string {
  const alt = variant % 2 === 1;
  const partners = joinNames(p.partners);
  const picks = p.picks.map((k) => `  ${k.quarter}: ${k.date}, ${k.time}, dinner at ${k.dinner}`);
  const head = alt ? `Subject: Please confirm: ${p.portco.name} 2027 board meeting dates` : `Subject: ${p.portco.name} 2027 quarterly meetings, dates to confirm`;
  const opener = alt
    ? `${p.portco.name} has chosen the dates below for the 2027 quarterly meetings with Greenbriar, held at their office in ${p.portco.city}.`
    : `The ${p.portco.name} team has picked the following dates for the 2027 quarterly meetings, to be held at their ${p.portco.city.split(",")[0]} office with dinner to follow.`;
  return [
    head,
    ``,
    `Dear ${joinNames(p.boardMembers)},`,
    ``,
    opener,
    ``,
    ...picks,
    ``,
    `From Greenbriar, ${partners} will attend each meeting. Could you reply with a yes for all four by ${p.replyBy}? If any date does not work for you, please tell me right away and we will look at the alternates.`,
    ``,
    `Thank you,`,
    p.eaSignature,
  ].join("\n");
}

export function mockConflict(p: ConflictPayload): { note: string; resend: string } {
  const partners = joinNames(p.partners);
  if (!p.fallback) {
    return {
      note: `${p.member} declined ${p.quarter} on ${p.declined.date} and the approved shortlist has no other window for ${p.quarter}. Widen the search to 3-hour blocks or new weeks before re-sending.`,
      resend: `Dear board members, ${p.member} cannot make the ${p.quarter} date on ${p.declined.date}. We are looking at additional dates and will send a new proposal shortly. ${p.eaSignature}`,
    };
  }
  const check = p.reverify.ok ? `${p.partners.length === 3 ? "all three" : "all"} are still free` : `${joinNames(p.reverify.busy)} now has a conflict`;
  return {
    note: `${p.member} declined ${p.quarter} on ${p.declined.date}, so I went back to the shortlist the partners approved and picked option ${p.fallback.rank}, ${p.fallback.date}, ${p.fallback.time}. I re-checked partner calendars and ${check}, so this is ready to send if you approve.`,
    resend: `Dear board members, ${p.member} is unable to make the ${p.quarter} meeting on ${p.declined.date}, so we are dropping that date. We propose ${p.fallback.date}, ${p.fallback.time}, with dinner at ${p.fallback.dinner}, which was on the original shortlist and works for ${partners} and the ${p.portco.name} team. Could each of you reply with a yes for the new date by ${"{{replyBy}}"}? ${p.eaSignature}`,
  };
}

export function mockLogistics(p: LogisticsPayload, variant = 0): { picks: Record<string, LogisticsPick> } {
  const alt = variant % 2 === 1;
  const hotels = p.venues.filter((v) => v.type === "hotel");
  const restaurants = p.venues.filter((v) => v.type === "restaurant");
  const picks: Record<string, LogisticsPick> = {};
  p.meetings.forEach((m, i) => {
    const hotel = alt ? hotels[(i + 1) % hotels.length] : hotels[0];
    // Rotate restaurants so four dinners are not four identical nights.
    const restaurant = restaurants[(i + (alt ? 1 : 0)) % restaurants.length];
    if (!hotel || !restaurant) return;
    picks[m.quarter] = {
      hotelId: hotel.id,
      restaurantId: restaurant.id,
      reason: `${hotel.name} is ${hotel.distanceMi} miles from the office. ${hotel.note}. ${restaurant.name} for dinner, ${restaurant.distanceMi} miles away. ${restaurant.note}.`,
    };
  });
  return { picks };
}

// One entry point keyed by step, matching lib/agent.ts.
export function mockStep(step: string, payload: unknown, variant = 0): unknown {
  switch (step) {
    case "shortlist":
      return mockShortlist(payload as ShortlistPayload, variant);
    case "partnerEmail":
      return mockPartnerEmail(payload as PartnerEmailPayload, variant);
    case "portcoEmail":
      return mockPortcoEmail(payload as PortcoEmailPayload, variant);
    case "boardEmail":
      return mockBoardEmail(payload as BoardEmailPayload, variant);
    case "conflict":
      return mockConflict(payload as ConflictPayload);
    case "logistics":
      return mockLogistics(payload as LogisticsPayload, variant);
    default:
      throw new Error(`Unknown agent step ${step}`);
  }
}
