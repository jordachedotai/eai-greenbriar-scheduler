// One renderer for every email and the one-pager, per reference/design/
// Decline.dc.html: subject bold, greeting, paragraphs, date lists in a
// soft block, the ask, a muted sign-off. 16px body.

import type { EmailFields } from "@/lib/types";

// "Q3: Tue Aug 26, 9am to 1pm, dinner at 6:30pm" -> label, date, dinner
function splitItem(it: string): { label?: string; text: string; tail?: string } {
  const m = it.match(/^(Q[1-4](?: '\d\d)?):\s*(.+?)(?:,\s*(dinner at .+))?$/i);
  if (m) return { label: m[1], text: m[2], tail: m[3] };
  const o = it.match(/^(Option \d+):\s*(.+?)(?:\s+(Dinner at .+))?$/i);
  if (o) return { label: o[1], text: o[2].replace(/\.$/, ""), tail: o[3]?.replace(/\.$/, "") };
  return { text: it };
}

export function EmailDraft({ email }: { email: EmailFields }) {
  return (
    <div className="flex flex-col gap-3 text-[16px] leading-[1.5]" data-testid="email-draft">
      {email.subject ? (
        <span className="font-semibold" data-part="subject">
          Subject: {email.subject}
        </span>
      ) : null}
      {email.title ? (
        <span className="serif text-[20px] font-semibold leading-tight" data-part="title">
          {email.title}
        </span>
      ) : null}
      {email.greeting ? <span data-part="greeting">{email.greeting}</span> : null}
      {email.paragraphs.map((p, i) => (
        <span key={i} data-part="paragraph">
          {p}
        </span>
      ))}
      {(email.lists ?? []).map((l, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-[10px] border border-idle-line bg-bg px-4 py-3" data-part="list">
          {l.heading ? (
            <span className="font-semibold">
              {l.heading}
              {l.note ? <span className="ml-2 text-[13px] font-normal text-wait">{l.note}</span> : null}
            </span>
          ) : null}
          <ul className="flex flex-col gap-1.5">
            {l.items.map((it, j) => {
              const s = splitItem(it);
              return (
                <li key={j} className="flex flex-wrap items-baseline gap-x-2.5">
                  {s.label ? <span className="w-[68px] shrink-0 text-[13px] font-bold text-you">{s.label}</span> : null}
                  <span className={s.label ? "font-semibold" : ""}>{s.text}</span>
                  {s.tail ? <span className="text-mut">{s.tail}</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {email.ask ? <span data-part="ask">{email.ask}</span> : null}
      {email.signoff.length ? (
        <span className="text-mut" data-part="signoff">
          {email.signoff.map((s, i) => (
            <span key={i} className="block">
              {s}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}
