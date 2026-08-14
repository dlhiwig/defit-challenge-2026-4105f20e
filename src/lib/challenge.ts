// DEFIT is a recurring annual 10-week challenge, but the platform is open 365 days a year.
// Cycle dates auto-roll: each cycle starts on the second Monday of January and runs 10 weeks.

export const CHALLENGE_WEEKS = 10;
/** First year DEFIT ran on this platform — nothing before this has standings. */
export const FIRST_CYCLE_YEAR = 2027;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

export interface Cycle {
  year: number;
  /** Machine cycle key, e.g. "DEFIT2027". */
  cycle: string;
  /** Human label, e.g. "DEFIT 2027". */
  label: string;
  start: Date;
  end: Date;
  /** e.g. "11 Jan – 21 Mar 2027". */
  dateRange: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function secondMondayOfJanuary(year: number): Date {
  const d = new Date(year, 0, 1, 0, 0, 0, 0);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 7); // second Monday
  return d;
}

/** The 10-week cycle for a given calendar year. */
export function cycleForYear(year: number): Cycle {
  const start = secondMondayOfJanuary(year);
  const end = new Date(start);
  end.setDate(end.getDate() + CHALLENGE_WEEKS * 7 - 1);
  end.setHours(23, 59, 59, 999);
  return {
    year,
    cycle: `DEFIT${year}`,
    label: `DEFIT ${year}`,
    start,
    end,
    dateRange: `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${year}`,
  };
}

/**
 * The cycle participants are currently working toward: this year's while it is still
 * running, otherwise next year's. Rolls over automatically every spring.
 */
export function activeCycle(now: Date = new Date()): Cycle {
  const thisYear = cycleForYear(now.getFullYear());
  return now <= thisYear.end ? thisYear : cycleForYear(now.getFullYear() + 1);
}

/** The most recently completed cycle, or null before the first one ever finished. */
export function previousCycle(now: Date = new Date()): Cycle | null {
  const year = activeCycle(now).year - 1;
  return year >= FIRST_CYCLE_YEAR ? cycleForYear(year) : null;
}

/** The cycle a given date falls inside, or null for off-season activity. */
export function cycleForDate(date: Date): Cycle | null {
  const c = cycleForYear(date.getFullYear());
  return date >= c.start && date <= c.end ? c : null;
}

// ─── Back-compat constants for the active cycle ───
const ACTIVE = activeCycle();
export const CHALLENGE_CYCLE = ACTIVE.cycle;
export const CHALLENGE_LABEL = ACTIVE.label;
export const CHALLENGE_START = ACTIVE.start;
export const CHALLENGE_END = ACTIVE.end;
export const CHALLENGE_DATE_RANGE = ACTIVE.dateRange;

/** 1-based week index of the cycle, clamped to 1..CHALLENGE_WEEKS. */
export function currentWeek(now: Date = new Date()): number {
  const { start } = activeCycle(now);
  const elapsed = (now.getTime() - start.getTime()) / MS_PER_WEEK;
  return Math.min(Math.max(Math.floor(elapsed) + 1, 1), CHALLENGE_WEEKS);
}

/** Whole weeks left in the active cycle (0 once it has ended). */
export function weeksRemaining(now: Date = new Date()): number {
  const { end } = activeCycle(now);
  const remaining = (end.getTime() - now.getTime()) / MS_PER_WEEK;
  return Math.min(Math.max(Math.ceil(remaining), 0), CHALLENGE_WEEKS);
}

export function cycleStatus(now: Date = new Date()): 'upcoming' | 'active' | 'complete' {
  const { start, end } = activeCycle(now);
  if (now < start) return 'upcoming';
  if (now > end) return 'complete';
  return 'active';
}

/** True between cycles — logging stays open, but activity is training-only. */
export function isOffSeason(now: Date = new Date()): boolean {
  return cycleStatus(now) !== 'active';
}

/** Whole days until the active cycle opens (0 once it is running). */
export function daysUntilStart(now: Date = new Date()): number {
  const { start } = activeCycle(now);
  return Math.max(Math.ceil((start.getTime() - now.getTime()) / MS_PER_DAY), 0);
}

/**
 * Minutes per week still required to reach a minimum before the cycle ends.
 * Returns 0 when the minimum is already met.
 */
export function requiredPacePerWeek(current: number, minimum: number, now: Date = new Date()): number {
  const remainingTotal = Math.max(minimum - current, 0);
  if (remainingTotal === 0) return 0;
  const weeks = Math.max(weeksRemaining(now), 1);
  return Math.ceil(remainingTotal / weeks);
}
