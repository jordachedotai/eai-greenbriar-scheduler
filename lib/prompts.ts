// System prompt and per-step prompt builders. Claude only ever sees the
// payloads built here: windows, names, cities, venues. Never raw calendars.

export const SYSTEM_PROMPT = `You are the scheduling assistant for a private equity firm's executive assistant. You write short, plain, warm business English. No jargon. No em-dashes. You never invent dates, names, or venues. You only use what is in the payload. When something is uncertain you say so in one line. Every output is a draft the assistant will review before anything is sent.`;

export type AgentStep = "shortlist" | "partnerEmail" | "portcoEmail" | "boardEmail" | "conflict" | "logistics";

export type WindowPayload = {
  id: string;
  rank: number;
  date: string; // "Wed Feb 17"
  time: string; // "10am to 2pm"
  dinner: string; // "6:30pm"
  partnersFree: string[];
  confirmByEmail: string[];
};

export type ShortlistPayload = {
  portco: { name: string; city: string; officeAddress: string };
  execContact: { name: string; title: string };
  partners: string[];
  replyBy: string;
  quarters: { quarter: string; months: string; thin: boolean; windows: WindowPayload[] }[];
  eaSignature: string;
};

export type PartnerEmailPayload = {
  portco: { name: string; city: string };
  execContact: { name: string; title: string };
  partners: string[];
  replyBy: string;
  onepager: string;
  eaSignature: string;
};

export type PortcoEmailPayload = {
  portco: { name: string; city: string };
  execContact: { name: string; title: string };
  partners: string[];
  replyBy: string;
  onepager: string;
  eaSignature: string;
};

export type BoardEmailPayload = {
  portco: { name: string; city: string; officeAddress: string };
  boardMembers: string[];
  partners: string[];
  replyBy: string;
  picks: { quarter: string; date: string; time: string; dinner: string }[];
  eaSignature: string;
};

export type ConflictPayload = {
  portco: { name: string };
  quarter: string;
  member: string;
  declined: { date: string; time: string };
  fallback: { date: string; time: string; dinner: string; rank: number } | null;
  reverify: { ok: boolean; busy: string[] };
  partners: string[];
  boardMembers: string[];
  eaSignature: string;
};

export type LogisticsPayload = {
  portco: { name: string; city: string; officeAddress: string };
  partners: string[];
  meetings: { quarter: string; date: string; time: string; dinner: string }[];
  venues: { id: string; type: string; name: string; distanceMi: number; note: string }[];
};

export type StepPayload = {
  shortlist: ShortlistPayload;
  partnerEmail: PartnerEmailPayload;
  portcoEmail: PortcoEmailPayload;
  boardEmail: BoardEmailPayload;
  conflict: ConflictPayload;
  logistics: LogisticsPayload;
};

function json(v: unknown): string {
  return JSON.stringify(v, null, 2);
}

export function buildPrompt(step: AgentStep, payload: unknown): string {
  switch (step) {
    case "shortlist":
      return `Here are the ranked meeting windows for a portfolio company's four quarterly meetings in 2027. Each meeting is a four hour block at the portco office followed by dinner.

Do two things.

1. For every window, write one sentence explaining why it ranks where it does. Mention the weekday, the start time, or its place in the quarter. Where "thin" is true, say plainly that only that many days worked for all partners.

2. Write a one page proposal addressed to the exec contact by first name, from the assistant on behalf of the partners. List the options per quarter with the dinner time. Ask them to pick one option per quarter and reply by the replyBy date. If a quarter is thin, say so in one line. Sign off with eaSignature. Plain text, no markdown, no bullet symbols other than numbers.

Return JSON only, shaped exactly like this:
{"reasons": {"Q1": ["...", "...", "..."], "Q2": [...], "Q3": [...], "Q4": [...]}, "onepager": "..."}
The reasons arrays must match the number and order of windows given per quarter.

Payload:
${json(payload)}`;

    case "partnerEmail":
      return `Write the email from the assistant to the Greenbriar partners assigned to this portfolio company, asking them to confirm the attached one-pager is fine to send to the portco. Four sentences or fewer. Address them by first names. Ask for a yes by the replyBy date. Sign off with eaSignature. Plain text only. Start with the subject line on its own first line as "Subject: ...".

Payload:
${json(payload)}`;

    case "portcoEmail":
      return `Write the cover email that sends the attached one page proposal to the portco exec contact. From the assistant, on behalf of the partners. Five sentences or fewer. Address them by first name. Mention that the proposal is attached, ask them to pick one option per quarter, and give the replyBy date. Sign off with eaSignature. Plain text only. Start with the subject line on its own first line as "Subject: ...".

Payload:
${json(payload)}`;

    case "boardEmail":
      return `Write an email to the board members of the portfolio company confirming the meeting dates the company picked. List each quarter with date, time, and dinner. Ask each member to reply yes by the replyBy date, or to tell us right away if a date does not work. Note which Greenbriar partners will attend. Sign off with eaSignature. Plain text only. Start with the subject line on its own first line as "Subject: ...".

Payload:
${json(payload)}`;

    case "conflict":
      return `A board member declined a confirmed meeting date. The assistant's tool has already picked the next best window from the shortlist the partners approved and re-checked partner calendars. Results are in the payload.

Write two things.
1. "note": two sentences to the assistant explaining what changed and what is proposed. Mention the re-check result plainly.
2. "resend": one paragraph to the board members proposing the new date and time with dinner, asking for a yes, and noting the original was dropped because of the decline. Sign with eaSignature.

If fallback is null, say in the note that the shortlist is exhausted and the assistant should widen the search, and make resend an honest holding message.

Return JSON only: {"note": "...", "resend": "..."}

Payload:
${json(payload)}`;

    case "logistics":
      return `Pick one hotel and one restaurant for each meeting from the venue list. Only use venue ids from the list. Prefer places close to the office and suited to a partner group and a board dinner. Give one sentence per meeting on why, in the assistant's voice.

Return JSON only, shaped like:
{"picks": {"Q1": {"hotelId": "...", "restaurantId": "...", "reason": "..."}, "Q2": {...}, "Q3": {...}, "Q4": {...}}}

Payload:
${json(payload)}`;
  }
}

// Pull the first JSON object out of a model reply, tolerating code fences.
export function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in reply");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
