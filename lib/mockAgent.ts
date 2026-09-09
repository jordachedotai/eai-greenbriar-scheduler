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
  QuarterOptions,
  ShortlistPayload,
  WindowPayload,
} from "./prompts";
import type { EmailFields, LogisticsPick } from "./types";

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

// A reason for a window that is not in the ranked three, so a swapped-in
// option carries its own line. Rank independent.
export function neutralReason(w: WindowPayload): string {
  const { weekday, month, day } = parseDate(w.date);
  const h = startHour(w.time);
  const start = w.time.split(" ")[0];
  const pos = position(month, day);
  const posText = pos === "early" ? "early in the quarter" : pos === "late" ? "late in the quarter" : "in the middle of the quarter";
  const timeText = h === 10 ? "a 10am start keeps travel easy and dinner on time" : h < 10 ? `${article(start)} ${start} start means partners fly in the night before` : `${article(start)} ${start} start lets partners fly in that morning, though dinner runs later`;
  return `${weekday} ${posText}, and ${timeText}.`;
}

export function mockShortlist(p: ShortlistPayload, variant = 0): { reasons: Record<string, string[]>; onepager: EmailFields } {
  const alt = variant % 2 === 1;
  const reasons: Record<string, string[]> = {};
  for (const q of p.quarters) reasons[q.quarter] = q.windows.map((w, i) => windowReason(w, i, q.thin ? q.windows.length : null));
  const partners = joinNames(p.partners);
  const onepager: EmailFields = {
    title: `Proposed quarterly meeting dates, ${p.portco.name} and Greenbriar`,
    greeting: `Dear ${firstName(p.execContact.name)},`,
    paragraphs: [
      alt
        ? `Here are the proposed dates for our four quarterly meetings in ${p.portco.city.split(",")[0]} next year. Each meeting is four hours at your office at ${p.portco.officeAddress}, with dinner afterward. ${partners} can make every option below.`
        : `Thank you for hosting us again next year. We would like to hold the four quarterly meetings at your office, ${p.portco.officeAddress}. Each meeting runs four hours, followed by dinner nearby. The options below work for ${partners}.`,
    ],
    lists: p.quarters.map((q) => ({
      heading: `${q.label}, ${q.months}`,
      note: q.thin ? `only ${q.windows.length} days worked for all partners` : undefined,
      items: q.windows.map((w, i) => `Option ${i + 1}: ${w.date}, ${w.time}. Dinner at ${w.dinner}.`),
    })),
    ask: `Please pick one option per quarter and reply by ${p.replyBy}. If none of them work, tell us and we will look again. Your board members will be asked to confirm once you have chosen.`,
    signoff: [alt ? "Thank you," : "We look forward to seeing you.", p.eaSignature],
  };
  return { reasons, onepager };
}

// The date options as list blocks, one per quarter. Used inline in the
// partner and company emails, so nothing has to be attached to be read.
export function optionLists(quarters: QuarterOptions[]): NonNullable<EmailFields["lists"]> {
  return quarters.map((q) => ({
    heading: `${q.label}, ${q.months}`,
    note: q.thin ? `only ${q.windows.length} days worked for all partners` : undefined,
    items: q.windows.map((w, i) => `Option ${i + 1}: ${w.date}, ${w.time}. Dinner at ${w.dinner}.`),
  }));
}

export function mockPartnerEmail(p: PartnerEmailPayload, variant = 0): EmailFields {
  const alt = variant % 2 === 1;
  const firsts = joinNames(p.partners.map(firstName));
  if (alt) {
    return {
      subject: `OK to send? ${p.portco.name} 2027 meeting options`,
      greeting: `${firsts},`,
      paragraphs: [`Below are the proposed 2027 quarterly meeting options for ${p.portco.name}, three per quarter, all from your calendars.`],
      lists: optionLists(p.quarters),
      ask: `Please reply yes by ${p.replyBy} if I can send these to ${p.execContact.name}. Tell me if any option should come off the list first.`,
      signoff: [p.eaSignature],
    };
  }
  return {
    subject: `${p.portco.name} 2027 quarterly meetings, options for your sign-off`,
    greeting: `${firsts},`,
    paragraphs: [
      `Before anything goes to ${p.execContact.name}, please look over the date options below for the ${p.portco.name} meetings in ${p.portco.city.split(",")[0]}. Every option is a four hour block where all of you are free, with dinner after.`,
    ],
    lists: optionLists(p.quarters),
    ask: `Reply yes by ${p.replyBy} and I will send them on, or tell me what to change.`,
    signoff: ["Thank you,", p.eaSignature],
  };
}

export function mockPortcoEmail(p: PortcoEmailPayload, variant = 0): EmailFields {
  const alt = variant % 2 === 1;
  const partners = joinNames(p.partners);
  const first = firstName(p.execContact.name);
  if (alt) {
    return {
      subject: `2027 quarterly meeting dates, ${p.portco.name} and Greenbriar`,
      greeting: `Hi ${first},`,
      paragraphs: [`Below are three date options for each of our 2027 quarterly meetings at your office. Every option works for ${partners}. The same options are attached as ${p.attachmentName}.`],
      lists: optionLists(p.quarters),
      ask: `Could you choose one per quarter and reply by ${p.replyBy}? Once you have picked, we will confirm with your board and handle the rest.`,
      signoff: ["Thank you.", p.eaSignature],
    };
  }
  return {
    subject: `Proposed 2027 quarterly meeting dates for ${p.portco.name}`,
    greeting: `Dear ${first},`,
    paragraphs: [
      `On behalf of ${partners}, here are three options for each 2027 quarterly meeting at your office. The same options are attached as ${p.attachmentName}.`,
    ],
    lists: optionLists(p.quarters),
    ask: `Please pick one option per quarter and reply by ${p.replyBy}. If none of the options work for a quarter, let me know and we will find more. After you choose, I will confirm the dates with your board members and arrange the dinners.`,
    signoff: ["Thank you,", p.eaSignature],
  };
}

export function mockBoardEmail(p: BoardEmailPayload, variant = 0): EmailFields {
  const alt = variant % 2 === 1;
  const partners = joinNames(p.partners);
  return {
    subject: alt ? `Please confirm: ${p.portco.name} 2027 board meeting dates` : `${p.portco.name} 2027 quarterly meetings, dates to confirm`,
    greeting: `Dear ${joinNames(p.boardMembers)},`,
    paragraphs: [
      alt
        ? `${p.portco.name} has chosen the dates below for the quarterly meetings with Greenbriar, held at their office in ${p.portco.city}.`
        : `The ${p.portco.name} team has picked the following dates for the 2027 quarterly meetings, to be held at their ${p.portco.city.split(",")[0]} office with dinner to follow.`,
    ],
    lists: [{ items: p.picks.map((k) => `${k.quarter}: ${k.date}, ${k.time}, dinner at ${k.dinner}`) }],
    ask: `From Greenbriar, ${partners} will attend each meeting. Could you reply with a yes for ${p.picks.length === 4 ? "all four" : p.picks.length === 1 ? "the date" : `all ${p.picks.length}`} by ${p.replyBy}? If any date does not work for you, please tell me right away and we will look at the alternates.`,
    signoff: ["Thank you,", p.eaSignature],
  };
}

export function mockConflict(p: ConflictPayload): { note: string; resend: EmailFields } {
  const partners = joinNames(p.partners);
  const greeting = `Dear ${joinNames(p.boardMembers)},`;
  if (!p.fallback) {
    return {
      note: `${p.member} declined ${p.quarter} on ${p.declined.date} and the approved shortlist has no other window for ${p.quarter}. Widen the search to 3-hour blocks or new weeks before re-sending.`,
      resend: {
        subject: `${p.portco.name} ${p.quarter} meeting: new date to follow`,
        greeting,
        paragraphs: [`${p.member} cannot make the ${p.quarter} date on ${p.declined.date}. We are looking at additional dates and will send a new proposal shortly.`],
        signoff: ["Thank you,", p.eaSignature],
      },
    };
  }
  const check = p.reverify.ok ? `all ${p.partners.length === 3 ? "three" : p.partners.length === 4 ? "four" : p.partners.length === 5 ? "five" : ""} are still free`.replace("  ", " ") : `${joinNames(p.reverify.busy)} now has a conflict`;
  return {
    note: `${p.member} declined ${p.quarter} on ${p.declined.date}, so I went back to the shortlist the partners approved and picked option ${p.fallback.rank}, ${p.fallback.date}, ${p.fallback.time}. I re-checked partner calendars and ${check}, so this is ready to send if you approve.`,
    resend: {
      subject: `${p.portco.name} ${p.quarter} meeting: date change to ${p.fallback.date}`,
      greeting,
      paragraphs: [
        `${p.member} is unable to make the ${p.quarter} meeting on ${p.declined.date}, so we are dropping that date. The date below was on the original shortlist and works for ${partners} and the ${p.portco.name} team.`,
      ],
      lists: [{ items: [`${p.quarter}: ${p.fallback.date}, ${p.fallback.time}, dinner at ${p.fallback.dinner}`] }],
      ask: `Could each of you reply with a yes for the new date by {{replyBy}}?`,
      signoff: ["Thank you,", p.eaSignature],
    },
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


// ---------- replies the agent reads, in the sender's voice ----------

export function mockPartnerReply(partnerName: string, companyName: string, thinQuarter?: string): { subject: string; body: string } {
  const first = firstName(partnerName);
  const bodies = [
    `Yes, fine to send.${thinQuarter ? ` ${thinQuarter} is tight but the two options work for me.` : ""}\n\n${first}`,
    `Looks good. Send it on to ${companyName}.\n\nThanks,\n${first}`,
    `All good on my side. Go ahead.\n\n${first}`,
    `Yes. I would lean to the earlier options where we can, but any of these work.\n\n${first}`,
    `Approved. Thanks for pulling this together.\n\n${first}`,
  ];
  let n = 0;
  for (const ch of partnerName) n = (n + ch.charCodeAt(0)) % bodies.length;
  return { subject: `Re: ${companyName} 2027 quarterly meetings, options for your sign-off`, body: bodies[n] };
}

export function mockPicksReply(execName: string, companyName: string, picks: { quarter: string; date: string; time: string; rank: number }[]): { subject: string; body: string } {
  const first = firstName(execName);
  const lines = picks.map((k, i) => {
    const d = k.date.replace(/^\w+ /, "");
    const opts = [`${k.quarter} works best on the ${d.split(" ")[1]}${ordinal(d.split(" ")[1])}, ${d.split(" ")[0]}`, `${k.quarter}, let's do ${k.date}`, `For ${k.quarter} take option ${k.rank}, ${k.date}`, `${k.quarter}: ${k.date} is fine`];
    return opts[i % opts.length] + (i === picks.length - 1 ? "." : ".");
  });
  return {
    subject: `Re: Proposed 2027 quarterly meeting dates for ${companyName}`,
    body: `Thanks for this. Here is what works on our end.\n\n${lines.join("\n")}\n\nAll the ${picks[0]?.time.split(" to ")[0] ?? "morning"} starts suit us. Looking forward to it.\n\n${first}`,
  };
}

function ordinal(day: string): string {
  const n = Number(day);
  if (n % 10 === 1 && n !== 11) return "st";
  if (n % 10 === 2 && n !== 12) return "nd";
  if (n % 10 === 3 && n !== 13) return "rd";
  return "th";
}

export function mockBoardReply(memberName: string, companyName: string, resend = false): { subject: string; body: string } {
  const first = firstName(memberName);
  const body = resend ? `The new date works. Count me in.\n\n${first}` : `Yes to all four. Thank you for lining these up.\n\n${first}`;
  return { subject: `Re: ${companyName} 2027 quarterly meetings, dates to confirm`, body };
}

export function mockDeclineReply(memberName: string, companyName: string, quarter: string, date: string): { subject: string; body: string } {
  const first = firstName(memberName);
  return {
    subject: `Re: ${companyName} 2027 quarterly meetings, dates to confirm`,
    body: `Three of the four are fine. I cannot make ${quarter} on ${date}, I am traveling that week. If there is another option on the list for ${quarter} I will take it.\n\n${first}`,
  };
}
