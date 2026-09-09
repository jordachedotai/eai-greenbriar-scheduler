// Line icons from reference/design. 20px in the sidebar, 18 in buttons.

type P = { size?: number; className?: string; stroke?: string };
const base = (size: number, w = 1.8) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export function IconPortfolio({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}
export function IconCalendar({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}
export function IconPeople({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.5a5 5 0 0 1 6 5" />
    </svg>
  );
}
export function IconTemplates({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h7" />
      <path d="M9 17h7" />
    </svg>
  );
}
export function IconSettings({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}
export function IconChevronLeft({ size = 14, className }: P) {
  return (
    <svg {...base(size, 2)} stroke="currentColor" className={className} aria-hidden>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
export function IconChevronRight({ size = 14, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size, 2.2)} stroke={stroke} className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function IconChevronDown({ size = 12, className }: P) {
  return (
    <svg {...base(size, 2.5)} stroke="currentColor" className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
export function IconChevronUp({ size = 12, className }: P) {
  return (
    <svg {...base(size, 2.5)} stroke="currentColor" className={className} aria-hidden>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}
export function IconX({ size = 12, className }: P) {
  return (
    <svg {...base(size, 2.5)} stroke="currentColor" className={className} aria-hidden>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
export function IconHotel({ size = 18, className }: P) {
  return (
    <svg {...base(size, 2)} stroke="currentColor" className={className} aria-hidden>
      <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14" />
      <path d="M3 21h18" />
      <path d="M8 9h2M14 9h2M8 13h2M14 13h2" />
      <path d="M10 21v-4h4v4" />
    </svg>
  );
}
export function IconDinner({ size = 18, className }: P) {
  return (
    <svg {...base(size, 2)} stroke="currentColor" className={className} aria-hidden>
      <path d="M7 3v8" />
      <path d="M4 3v5a3 3 0 0 0 6 0V3" />
      <path d="M7 11v10" />
      <path d="M17 3c-2 2-3 5-3 8h3v10" />
    </svg>
  );
}
export function IconLock({ size = 11 }: P) {
  return (
    <svg {...base(size, 2.5)} stroke="currentColor" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
export function IconCheck({ size = 12, className }: P) {
  return (
    <svg {...base(size, 3)} stroke="currentColor" className={className} aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
export function IconPlus({ size = 18 }: P) {
  return (
    <svg {...base(size, 2.2)} stroke="currentColor" aria-hidden>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
export function IconSearch({ size = 18 }: P) {
  return (
    <svg {...base(size, 2.2)} stroke="currentColor" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
export function IconSend({ size = 18 }: P) {
  return (
    <svg {...base(size, 2.2)} stroke="currentColor" aria-hidden>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </svg>
  );
}
export function IconPresenter({ size = 16 }: P) {
  return (
    <svg {...base(size, 2.2)} stroke="currentColor" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}
export function IconSparkle({ size = 14 }: P) {
  return (
    <svg {...base(size, 2.2)} stroke="currentColor" aria-hidden>
      <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z" />
      <path d="M19 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </svg>
  );
}
export function IconClock({ size = 28 }: P) {
  return (
    <svg {...base(size)} stroke="#c9d3c8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
