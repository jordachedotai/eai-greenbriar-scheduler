// Plain-text rendering of EmailFields. Used for the draft text the EA can
// edit, for the one-pager text that later prompts quote, and for exports.

import type { EmailFields } from "./types";

export function emailToText(e: EmailFields): string {
  const out: string[] = [];
  if (e.subject) out.push(`Subject: ${e.subject}`, "");
  if (e.title) out.push(e.title, "");
  if (e.greeting) out.push(e.greeting, "");
  for (const p of e.paragraphs) out.push(p, "");
  for (const l of e.lists ?? []) {
    if (l.heading) out.push(l.heading + (l.note ? ` (${l.note})` : ""));
    for (const it of l.items) out.push(`  ${it}`);
    out.push("");
  }
  if (e.ask) out.push(e.ask, "");
  out.push(...e.signoff);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Accept either fields or a plain string from an agent reply.
export function asEmail(v: unknown): EmailFields {
  if (typeof v === "string") return { paragraphs: v.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean), signoff: [] };
  const e = v as Partial<EmailFields>;
  return {
    subject: e.subject,
    title: e.title,
    greeting: e.greeting,
    paragraphs: Array.isArray(e.paragraphs) ? e.paragraphs : [],
    lists: Array.isArray(e.lists) ? e.lists : undefined,
    ask: e.ask,
    signoff: Array.isArray(e.signoff) ? e.signoff : e.signoff ? [String(e.signoff)] : [],
  };
}
