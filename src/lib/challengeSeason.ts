// The annual DEFIT Challenge is data-driven: each season is one row in `challenge_cycles`.
// This module turns those rows into a UI-friendly shape and derives the season state.
// The auto-roll math in `@/lib/challenge` is only the offline fallback — the database wins.

import { CHALLENGE_WEEKS, activeCycle, cycleForYear } from '@/lib/challenge';

export type ChallengeState = 'off_season' | 'registration' | 'active' | 'complete';

export interface ChallengeSeason {
  id?: string;
  year: number;
  /** Machine key, e.g. "DEFIT2027". */
  code: string;
  /** Human label, e.g. "DEFIT 2027 Challenge". */
  name: string;
  /** Short label, e.g. "DEFIT 2027". */
  label: string;
  start: Date;
  end: Date;
  registrationOpen: Date;
  registrationClose: Date;
  scoringWeeks: number;
  rulesVersion: string;
  dateRange: string;
  state: ChallengeState;
  /** Where the dates came from — useful for diagnostics. */
  source: 'database' | 'fallback';
}

export interface ChallengeCycleRow {
  id: string;
  code: string;
  name: string;
  year: number;
  registration_open: string;
  registration_close: string;
  start_date: string;
  end_date: string;
  scoring_weeks: number;
  status_override: string | null;
  rules_version: string;
  is_published?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Parse a `YYYY-MM-DD` column as local midnight (never UTC-shifted). */
export function parseDateOnly(value: string, endOfDay = false): Date {
  const [y, m, d] = value.split('-').map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function formatDateRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const head = `${start.getDate()} ${MONTHS[start.getMonth()]}${sameYear ? '' : ` ${start.getFullYear()}`}`;
  return `${head} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

/** Season state from its dates, honouring an explicit admin override. */
export function deriveState(
  season: Pick<ChallengeSeason, 'start' | 'end' | 'registrationOpen' | 'registrationClose'>,
  override?: string | null,
  now: Date = new Date(),
): ChallengeState {
  if (override === 'off_season' || override === 'registration' || override === 'active' || override === 'complete') {
    return override;
  }
  if (now > season.end) return 'complete';
  if (now >= season.start) return 'active';
  if (now >= season.registrationOpen && now <= season.registrationClose) return 'registration';
  return 'off_season';
}

export function seasonFromRow(row: ChallengeCycleRow, now: Date = new Date()): ChallengeSeason {
  const start = parseDateOnly(row.start_date);
  const end = parseDateOnly(row.end_date, true);
  const registrationOpen = parseDateOnly(row.registration_open);
  const registrationClose = parseDateOnly(row.registration_close, true);
  const base = {
    id: row.id,
    year: row.year,
    code: row.code,
    name: row.name,
    label: `DEFIT ${row.year}`,
    start,
    end,
    registrationOpen,
    registrationClose,
    scoringWeeks: row.scoring_weeks,
    rulesVersion: row.rules_version,
    dateRange: formatDateRange(start, end),
    source: 'database' as const,
  };
  return { ...base, state: deriveState(base, row.status_override, now) };
}

/** Offline fallback used only when the cycle table can't be read. */
export function fallbackSeason(year?: number, now: Date = new Date()): ChallengeSeason {
  const cycle = year ? cycleForYear(year) : activeCycle(now);
  const registrationOpen = new Date(cycle.start);
  registrationOpen.setDate(registrationOpen.getDate() - 71); // ~10 weeks before kickoff
  const registrationClose = new Date(cycle.start);
  const base = {
    year: cycle.year,
    code: cycle.cycle,
    name: `${cycle.label} Challenge`,
    label: cycle.label,
    start: cycle.start,
    end: cycle.end,
    registrationOpen,
    registrationClose,
    scoringWeeks: CHALLENGE_WEEKS,
    rulesVersion: 'v1',
    dateRange: cycle.dateRange,
    source: 'fallback' as const,
  };
  return { ...base, state: deriveState(base, null, now) };
}

/**
 * The season participants are currently pointed at: the live one, else the next
 * upcoming one, else the most recently completed one.
 */
export function pickCurrentSeason(seasons: ChallengeSeason[], now: Date = new Date()): ChallengeSeason | null {
  if (seasons.length === 0) return null;
  const live = seasons.find((s) => now >= s.start && now <= s.end);
  if (live) return live;
  const upcoming = seasons.filter((s) => now < s.start).sort((a, b) => a.start.getTime() - b.start.getTime());
  if (upcoming.length > 0) return upcoming[0];
  return [...seasons].sort((a, b) => b.end.getTime() - a.end.getTime())[0];
}

export function weekOf(season: ChallengeSeason, now: Date = new Date()): number {
  const elapsed = (now.getTime() - season.start.getTime()) / (MS_PER_DAY * 7);
  return Math.min(Math.max(Math.floor(elapsed) + 1, 1), season.scoringWeeks);
}

export function weeksLeft(season: ChallengeSeason, now: Date = new Date()): number {
  const remaining = (season.end.getTime() - now.getTime()) / (MS_PER_DAY * 7);
  return Math.min(Math.max(Math.ceil(remaining), 0), season.scoringWeeks);
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.max(Math.ceil((date.getTime() - now.getTime()) / MS_PER_DAY), 0);
}

/** Headline copy per state — used on the dashboard card and the season hub. */
export function stateHeadline(season: ChallengeSeason, now: Date = new Date()): string {
  switch (season.state) {
    case 'registration':
      return 'Registration is open.';
    case 'active':
      return `Week ${weekOf(season, now)} of ${season.scoringWeeks} — view your ranking.`;
    case 'complete':
      return 'Challenge complete — view final standings.';
    default:
      return `Keep training. ${season.label} Challenge is coming.`;
  }
}

export const STATE_LABEL: Record<ChallengeState, string> = {
  off_season: 'Off-season',
  registration: 'Registration open',
  active: 'Challenge active',
  complete: 'Complete',
};
