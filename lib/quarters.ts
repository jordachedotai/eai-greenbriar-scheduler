// Planning windows. A quarter key is "YYYY-Qn", so an eight-quarter window
// or one that spans two years has distinct keys. Labels drop the year when
// the window sits inside one year and add it ("Q4 '26") when it does not.

import type { Quarter } from "./types";

export type PlanningWindow = { startQuarter: Quarter; quarterCount: number; blockHours?: number; dinnerTime?: string };

export const MAX_QUARTERS = 8;
export const DEFAULT_BLOCK_HOURS = 4;
export const DEFAULT_DINNER_TIME = "18:30";

export function parseQuarter(q: Quarter): { year: number; n: 1 | 2 | 3 | 4 } {
  const m = /^(\d{4})-Q([1-4])$/.exec(q);
  if (!m) throw new Error(`Bad quarter key ${q}`);
  return { year: Number(m[1]), n: Number(m[2]) as 1 | 2 | 3 | 4 };
}

export function quarterKey(year: number, n: number): Quarter {
  return `${year}-Q${n}`;
}

export function nextQuarter(q: Quarter, steps = 1): Quarter {
  const { year, n } = parseQuarter(q);
  const idx = (year * 4 + (n - 1)) + steps;
  return quarterKey(Math.floor(idx / 4), (idx % 4) + 1);
}

export function windowQuarters(w: PlanningWindow): Quarter[] {
  const count = Math.max(1, Math.min(MAX_QUARTERS, Math.round(w.quarterCount)));
  const out: Quarter[] = [];
  for (let i = 0; i < count; i++) out.push(nextQuarter(w.startQuarter, i));
  return out;
}

export function spansYears(quarters: Quarter[]): boolean {
  const years = new Set(quarters.map((q) => parseQuarter(q).year));
  return years.size > 1;
}

// "Q1", or "Q4 '26" when the window crosses a year.
export function quarterLabel(q: Quarter, quarters: Quarter[]): string {
  const { year, n } = parseQuarter(q);
  return spansYears(quarters) ? `Q${n} '${String(year).slice(2)}` : `Q${n}`;
}

// "Q1 2027"
export function quarterLong(q: Quarter): string {
  const { year, n } = parseQuarter(q);
  return `Q${n} ${year}`;
}

const MONTHS = [
  ["January", "March", "Jan", "Mar"],
  ["April", "June", "Apr", "Jun"],
  ["July", "September", "Jul", "Sep"],
  ["October", "December", "Oct", "Dec"],
];

// "January to March 2027"
export function quarterMonths(q: Quarter): string {
  const { year, n } = parseQuarter(q);
  return `${MONTHS[n - 1][0]} to ${MONTHS[n - 1][1]} ${year}`;
}

// "Jan to Mar"
export function quarterMonthsShort(q: Quarter): string {
  const { n } = parseQuarter(q);
  return `${MONTHS[n - 1][2]} to ${MONTHS[n - 1][3]}`;
}

export function quarterOfDate(d: Date): Quarter {
  return quarterKey(d.getFullYear(), Math.floor(d.getMonth() / 3) + 1);
}

// The quarter after the last one in a list, or the quarter after today.
export function quarterAfter(quarters: Quarter[], today = new Date()): Quarter {
  if (quarters.length) {
    const sorted = [...quarters].sort();
    return nextQuarter(sorted[sorted.length - 1]);
  }
  return nextQuarter(quarterOfDate(today));
}

// The window a new company gets: the next N quarters, starting the quarter
// after the last locked meeting, or the next quarter if there is none.
export function defaultWindow(lockedQuarters: Quarter[], quarterCount = 4, today = new Date()): PlanningWindow {
  return { startQuarter: quarterAfter(lockedQuarters, today), quarterCount };
}

// Every quarter key from one year to another, for pickers.
export function quarterRange(fromYear: number, toYear: number): Quarter[] {
  const out: Quarter[] = [];
  for (let y = fromYear; y <= toYear; y++) for (let n = 1; n <= 4; n++) out.push(quarterKey(y, n));
  return out;
}

export function yearsOf(quarters: Quarter[]): number[] {
  return [...new Set(quarters.map((q) => parseQuarter(q).year))].sort();
}
