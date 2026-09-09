// One renderer for every email and the one-pager: subject or title,
// greeting, body paragraphs, date lists, the ask, sign-off. Same structure
// and line breaks for every draft, including the re-send.

import type { EmailFields } from "@/lib/types";

export function EmailDraft({ email, compact = false }: { email: EmailFields; compact?: boolean }) {
  const body = compact ? "text-[14px]" : "text-[15px]";
  return (
    <div className={"flex flex-col gap-3 leading-relaxed " + body} data-testid="email-draft">
      {email.subject ? (
        <div className="flex items-baseline gap-2 border-b border-line pb-2" data-part="subject">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-mut">Subject</span>
          <span className="font-semibold">{email.subject}</span>
        </div>
      ) : null}
      {email.title ? (
        <div className="serif text-[20px] font-semibold leading-tight" data-part="title">
          {email.title}
        </div>
      ) : null}
      {email.greeting ? <p data-part="greeting">{email.greeting}</p> : null}
      {email.paragraphs.map((p, i) => (
        <p key={i} data-part="paragraph">
          {p}
        </p>
      ))}
      {(email.lists ?? []).map((l, i) => (
        <div key={i} className="rounded-[10px] border border-line bg-bg px-4 py-3" data-part="list">
          {l.heading ? (
            <div className="mb-1 font-semibold">
              {l.heading}
              {l.note ? <span className="ml-2 text-[13px] font-normal text-wait">{l.note}</span> : null}
            </div>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {l.items.map((it, j) => (
              <li key={j} className="flex gap-2">
                <span className="text-mut">·</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {email.ask ? <p data-part="ask">{email.ask}</p> : null}
      {email.signoff.length ? (
        <p data-part="signoff">
          {email.signoff.map((s, i) => (
            <span key={i} className="block">
              {s}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
