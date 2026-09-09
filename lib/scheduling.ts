// Pure scheduling functions. No I/O, no Claude. Everything here must be
// correct, so it is code. See docs/AGENT.md.

import type {
  AvailabilityBlock,
  BoardMember,
  Partner,
  PortcoSeed,
  Quarter,
  Window,
} from "./types";

export const MEETING_HOURS = 4;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 18;
export const DINNER_HOUR = 18; // 6:30pm local
export const DINNER_MINUTE = 30;
export const THIN_THRESHOLD = 3; // fewer windows than this is a thin quarter

const QUARTER_MONTHS: [number, number][] = [
  [1, 3],
  [4, 6],
  [7, 9],
  [10, 12],
];

function parseKey(q: Quarter): { year: number; n: number } {
  const m = /^(\d{4})-Q([1-4])$/.exec(q);
  if (!m) throw new Error(`Bad quarter key ${q}`);
  return { year: Number(m[1]), n: Number(m[2]) };
}

// ---------- date helpers (naive local ISO, no timezone) ----------

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toIso(y: number, m: number, d: number, h: number, min = 0): string {
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00`;
}

export function parseIso(s: string): { y: number; m: number; d: number; h: number; min: number } {
  return {
    y: Number(s.slice(0, 4)),
    m: Number(s.slice(5, 7)),
    d: Number(s.slice(8, 10)),
    h: Number(s.slice(11, 13)),
    min: Number(s.slice(14, 16)),
  };
}

export function dayKey(s: string): string {
  return s.slice(0, 10);
}

// Minutes since midnight on the block's own day.
export function minutesOfDay(s: string): number {
  const { h, min } = parseIso(s);
  return h * 60 + min;
}

export function weekdayOf(dateKey: string): number {
  // 0 Sun .. 6 Sat, computed in UTC so local timezone does not shift the day
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function quarterOf(dateKey: string): Quarter {
  const y = Number(dateKey.slice(0, 4));
  const m = Number(dateKey.slice(5, 7));
  return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
}

export function quarterDayRange(q: Quarter): { first: string; last: string } {
  const { year, n } = parseKey(q);
  const [m1, m2] = QUARTER_MONTHS[n - 1];
  const lastDay = new Date(Date.UTC(year, m2, 0)).getUTCDate();
  return { first: `${year}-${pad(m1)}-01`, last: `${year}-${pad(m2)}-${pad(lastDay)}` };
}

export function yearOfQuarter(q: Quarter): number {
  return parseKey(q).year;
}

export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / 86400000);
}

// ---------- intervals ----------

export type Interval = { start: number; end: number }; // minutes of day

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = [...list].sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
    } else {
      out.push({ ...iv });
    }
  }
  return out;
}

export function intersectIntervals(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].start, b[j].start);
    const end = Math.min(a[i].end, b[j].end);
    if (start < end) out.push({ start, end });
    if (a[i].end < b[j].end) i++;
    else j++;
  }
  return out;
}

// Group a person's free blocks by day as merged minute intervals.
export function freeByDay(blocks: AvailabilityBlock[], personId: string): Map<string, Interval[]> {
  const map = new Map<string, Interval[]>();
  for (const b of blocks) {
    if (b.personId !== personId) continue;
    const key = dayKey(b.start);
    const list = map.get(key) ?? [];
    list.push({ start: minutesOfDay(b.start), end: minutesOfDay(b.end) });
    map.set(key, list);
  }
  for (const [k, v] of map) map.set(k, mergeIntervals(v));
  return map;
}

// Intersect free time across all required people for one day.
export function intersectDay(perPerson: Map<string, Interval[]>[], day: string): Interval[] {
  let current: Interval[] | null = null;
  for (const p of perPerson) {
    const ivs = p.get(day) ?? [];
    current = current === null ? ivs : intersectIntervals(current, ivs);
    if (current.length === 0) return [];
  }
  return current ?? [];
}

// Within a feasible start range, pick the start closest to the preferred hour.
export function pickStart(ivStart: number, ivEnd: number, preferredHour = 10, hours = MEETING_HOURS): number {
  const latest = ivEnd - hours * 60;
  if (latest < ivStart) return -1;
  const preferred = preferredHour * 60;
  // snap to the hour
  const lo = Math.ceil(ivStart / 60) * 60;
  const hi = Math.floor(latest / 60) * 60;
  if (hi < lo) return -1;
  return Math.min(Math.max(preferred, lo), hi);
}

// ---------- stage 1: find windows ----------

export type FindWindowsInput = {
  portco: Pick<PortcoSeed, "id" | "partnerIds" | "targetQuarters" | "blockHours" | "dinnerTime">;
  partners: Partner[];
  boardMembers: BoardMember[];
  availability: AvailabilityBlock[];
  excludeDays?: Set<string>; // days already held for other meetings
};

export type QuarterWindows = { quarter: Quarter; windows: Window[]; thin: boolean };

export function findWindows(input: FindWindowsInput): Record<Quarter, QuarterWindows> {
  const hours = input.portco.blockHours ?? MEETING_HOURS;
  const [dh, dm] = (input.portco.dinnerTime ?? `${DINNER_HOUR}:${pad(DINNER_MINUTE)}`).split(":").map(Number);
  const required = input.portco.partnerIds;
  const members = input.boardMembers.filter((b) => b.portcoId === input.portco.id);
  const visibleMembers = members.filter((b) => b.calendarVisible).map((b) => b.id);
  const unknown = members.filter((b) => !b.calendarVisible).map((b) => b.id);
  const people = [...required, ...visibleMembers];
  const perPerson = people.map((id) => freeByDay(input.availability, id));

  const out = {} as Record<Quarter, QuarterWindows>;
  for (const q of input.portco.targetQuarters) {
    const { first, last } = quarterDayRange(q);
    const windows: Window[] = [];
    for (let day = first; day <= last; day = addDays(day, 1)) {
      const wd = weekdayOf(day);
      if (wd === 0 || wd === 5 || wd === 6) continue; // no Fri, Sat, Sun
      if (input.excludeDays?.has(day)) continue;
      const ivs = intersectDay(perPerson, day);
      for (const iv of ivs) {
        const start = pickStart(iv.start, iv.end, 10, hours);
        if (start < 0) continue;
        const { y, m, d } = parseIso(`${day}T00:00:00`);
        const startIso = toIso(y, m, d, Math.floor(start / 60), start % 60);
        const endMin = start + hours * 60;
        const endIso = toIso(y, m, d, Math.floor(endMin / 60), endMin % 60);
        windows.push({
          id: `${input.portco.id}-${q}-${day}-${pad(Math.floor(start / 60))}`,
          quarter: q,
          start: startIso,
          end: endIso,
          attendeesFree: [...people],
          attendeesUnknown: [...unknown],
          dinnerStart: toIso(y, m, d, dh, dm),
        });
      }
    }
    out[q] = { quarter: q, windows, thin: windows.length < THIN_THRESHOLD };
  }
  return out;
}

// ---------- stage 2: rank ----------

// Prefer mid-week, prefer a 10am to 2pm block, prefer the middle of the
// quarter so meetings land about 13 weeks apart.
export function scoreWindow(w: Window): number {
  const day = dayKey(w.start);
  const wd = weekdayOf(day);
  const midweek = wd === 2 || wd === 3 ? 2 : wd === 1 || wd === 4 ? 1 : 0;
  const startHour = parseIso(w.start).h;
  const hourScore = Math.max(0, 3 - Math.abs(startHour - 10));
  const { first, last } = quarterDayRange(w.quarter);
  const span = daysBetween(first, last);
  const offset = Math.abs(daysBetween(first, day) - span / 2);
  const spacing = Math.max(0, 2 - offset / 21);
  return midweek + hourScore + spacing;
}

export function rankWindows(windows: Window[]): Window[] {
  const scored = windows.map((w) => ({ w, s: scoreWindow(w) }));
  scored.sort((a, b) => b.s - a.s || a.w.start.localeCompare(b.w.start));
  return scored.slice(0, 3).map(({ w }, i) => ({ ...w, rank: (i + 1) as 1 | 2 | 3 }));
}

// ---------- stage 5: conflict fallback ----------

export function nextBestWindow(shortlist: Window[], declinedWindowId: string): Window | null {
  const sorted = [...shortlist].sort((a, b) => (a.rank ?? 9) - (b.rank ?? 9));
  const idx = sorted.findIndex((w) => w.id === declinedWindowId);
  if (idx === -1) return sorted[0] ?? null;
  return sorted[idx + 1] ?? null;
}

// Re-check that every required person is still free for the whole window.
export function reverifyWindow(
  w: Window,
  personIds: string[],
  availability: AvailabilityBlock[],
): { ok: boolean; busy: string[] } {
  const day = dayKey(w.start);
  const start = minutesOfDay(w.start);
  const end = minutesOfDay(w.end);
  const busy: string[] = [];
  for (const id of personIds) {
    const ivs = freeByDay(availability, id).get(day) ?? [];
    const covered = ivs.some((iv) => iv.start <= start && iv.end >= end);
    if (!covered) busy.push(id);
  }
  return { ok: busy.length === 0, busy };
}

// ---------- formatting for the UI ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtTime(iso: string): string {
  const { h, min } = parseIso(iso);
  const suffix = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return min === 0 ? `${hh}${suffix}` : `${hh}:${pad(min)}${suffix}`;
}

export function fmtDate(iso: string): string {
  const { y, m, d } = parseIso(iso);
  const wd = DAYS[weekdayOf(`${y}-${pad(m)}-${pad(d)}`)];
  return `${wd} ${MONTHS[m - 1]} ${d}`;
}

export function fmtWindow(w: Window): string {
  return `${fmtDate(w.start)}, ${fmtTime(w.start)} to ${fmtTime(w.end)}`;
}
