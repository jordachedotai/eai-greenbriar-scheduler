"use client";

// A person's headshot, or initials when there is no photo. Used everywhere a
// name appears in the workflow. Sizes from reference/design: 24 in the
// workflow, 26 in rows, 40 in the sidebar.

import { getBoardMember, getEa, getPartner } from "@/lib/data";

export type Person = { id?: string; name: string; avatar?: string };

export function resolvePerson(id: string): Person {
  const p = getPartner(id);
  if (p) return { id, name: p.name, avatar: p.avatar };
  const b = getBoardMember(id);
  if (b) return { id, name: b.name };
  const e = getEa(id);
  if (e) return { id, name: e.name, avatar: e.avatar };
  return { id, name: id };
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Deterministic muted tone for initials, so the same person is always the same color.
const TONES = ["#5b7a68", "#6b6f8a", "#8a6b5b", "#5b7f8a", "#7a6b8a", "#8a7a5b"];
function toneOf(name: string): string {
  let n = 0;
  for (const ch of name) n = (n * 31 + ch.charCodeAt(0)) % 9973;
  return TONES[n % TONES.length];
}

export function Face({ person, size = 24, ring = false, className = "" }: { person: Person; size?: number; ring?: boolean; className?: string }) {
  const style: React.CSSProperties = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.4)) };
  const ringClass = ring ? " border-2 border-white" : "";
  if (person.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={person.avatar}
        alt={person.name}
        title={person.name}
        style={style}
        className={"shrink-0 rounded-full object-cover object-top" + ringClass + " " + className}
        data-testid="face"
      />
    );
  }
  // Initials come from a CSS attr() so the name is not duplicated in text content.
  return (
    <span
      title={person.name}
      style={{ ...style, background: toneOf(person.name) }}
      className={"face-initials inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-white" + ringClass + " " + className}
      data-initials={initials(person.name)}
      data-testid="face"
      aria-label={person.name}
    />
  );
}

// Face plus name, inline.
export function FaceName({ person, size = 24, sub, className = "" }: { person: Person; size?: number; sub?: string; className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <Face person={person} size={size} />
      <span className="leading-tight">
        <span>{person.name}</span>
        {sub ? <span className="block text-[13px] text-mut">{sub}</span> : null}
      </span>
    </span>
  );
}

// Overlapping faces. 26px with an 8px overlap in rows, 24px on cards.
export function FaceStack({ ids, size = 26, max = 6 }: { ids: string[]; size?: number; max?: number }) {
  const people = ids.slice(0, max).map(resolvePerson);
  const extra = ids.length - people.length;
  return (
    <span className="inline-flex items-center" data-testid="face-stack">
      {people.map((p, i) => (
        <Face key={p.id ?? p.name} person={p} size={size} ring className={i > 0 ? "-ml-2" : ""} />
      ))}
      {extra > 0 ? (
        <span style={{ width: size, height: size }} className="-ml-2 inline-flex items-center justify-center rounded-full border-2 border-white bg-panel2 text-[11px] font-semibold text-mut">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
