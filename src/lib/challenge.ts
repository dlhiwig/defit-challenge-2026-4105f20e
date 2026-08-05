// DEFIT 2027 cycle constants — 10 weeks, 11 Jan – 21 Mar 2027
export const CHALLENGE_CYCLE = 'DEFIT2027';
export const CHALLENGE_LABEL = 'DEFIT 2027';
export const CHALLENGE_START = new Date('2027-01-11T00:00:00');
export const CHALLENGE_END = new Date('2027-03-21T23:59:59');
export const CHALLENGE_WEEKS = 10;
export const CHALLENGE_DATE_RANGE = '11 Jan – 21 Mar 2027';

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

/** 1-based week index of the cycle, clamped to 1..CHALLENGE_WEEKS. */
export function currentWeek(now: Date = new Date()): number {
  const elapsed = (now.getTime() - CHALLENGE_START.getTime()) / MS_PER_WEEK;
  return Math.min(Math.max(Math.floor(elapsed) + 1, 1), CHALLENGE_WEEKS);
}

/** Whole weeks left in the cycle (0 once the cycle has ended). */
export function weeksRemaining(now: Date = new Date()): number {
  const remaining = (CHALLENGE_END.getTime() - now.getTime()) / MS_PER_WEEK;
  return Math.min(Math.max(Math.ceil(remaining), 0), CHALLENGE_WEEKS);
}

export function cycleStatus(now: Date = new Date()): 'upcoming' | 'active' | 'complete' {
  if (now < CHALLENGE_START) return 'upcoming';
  if (now > CHALLENGE_END) return 'complete';
  return 'active';
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
