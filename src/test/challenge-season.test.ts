import { describe, it, expect } from 'vitest'
import {
  ChallengeCycleRow,
  deriveState,
  fallbackSeason,
  formatDateRange,
  pickCurrentSeason,
  seasonFromRow,
  stateHeadline,
  weekOf,
  weeksLeft,
} from '@/lib/challengeSeason'

const row = (over: Partial<ChallengeCycleRow> = {}): ChallengeCycleRow => ({
  id: 'a',
  code: 'DEFIT2027',
  name: 'DEFIT 2027 Challenge',
  year: 2027,
  registration_open: '2026-11-01',
  registration_close: '2027-01-11',
  start_date: '2027-01-11',
  end_date: '2027-03-21',
  scoring_weeks: 10,
  status_override: null,
  rules_version: 'v1',
  ...over,
})

describe('season rows drive the challenge, not hardcoded years', () => {
  it('parses date-only columns as local dates', () => {
    const s = seasonFromRow(row(), new Date('2027-02-01T12:00:00'))
    expect(s.start.getFullYear()).toBe(2027)
    expect(s.start.getMonth()).toBe(0)
    expect(s.start.getDate()).toBe(11)
    expect(s.end.getDate()).toBe(21)
    expect(s.end.getHours()).toBe(23)
    expect(s.dateRange).toBe('11 Jan – 21 Mar 2027')
    expect(s.source).toBe('database')
  })

  it('derives all four states from the dates', () => {
    const at = (iso: string) => seasonFromRow(row(), new Date(iso)).state
    expect(at('2026-09-01T00:00:00')).toBe('off_season')
    expect(at('2026-12-01T00:00:00')).toBe('registration')
    expect(at('2027-02-01T00:00:00')).toBe('active')
    expect(at('2027-05-01T00:00:00')).toBe('complete')
  })

  it('honours an admin status override', () => {
    const s = seasonFromRow(row({ status_override: 'off_season' }), new Date('2027-02-01T00:00:00'))
    expect(s.state).toBe('off_season')
  })

  it('ignores an unknown override value', () => {
    const dates = seasonFromRow(row(), new Date('2027-02-01T00:00:00'))
    expect(deriveState(dates, 'nonsense', new Date('2027-02-01T00:00:00'))).toBe('active')
  })

  it('picks the live season, else the next, else the most recent', () => {
    const s2027 = seasonFromRow(row(), new Date('2028-06-01T00:00:00'))
    const s2028 = seasonFromRow(
      row({
        id: 'b',
        code: 'DEFIT2028',
        year: 2028,
        registration_open: '2027-11-01',
        registration_close: '2028-01-10',
        start_date: '2028-01-10',
        end_date: '2028-03-19',
      }),
      new Date('2028-06-01T00:00:00'),
    )
    const all = [s2028, s2027]
    expect(pickCurrentSeason(all, new Date('2028-02-01T00:00:00'))?.year).toBe(2028)
    expect(pickCurrentSeason(all, new Date('2027-06-01T00:00:00'))?.year).toBe(2028)
    expect(pickCurrentSeason(all, new Date('2029-06-01T00:00:00'))?.year).toBe(2028)
    expect(pickCurrentSeason([], new Date())).toBeNull()
  })

  it('reports week position inside the season', () => {
    const s = seasonFromRow(row(), new Date('2027-01-25T00:00:00'))
    expect(weekOf(s, new Date('2027-01-11T08:00:00'))).toBe(1)
    expect(weekOf(s, new Date('2027-01-25T08:00:00'))).toBe(3)
    expect(weekOf(s, new Date('2027-06-01T08:00:00'))).toBe(10)
    expect(weeksLeft(s, new Date('2027-06-01T08:00:00'))).toBe(0)
  })

  it('writes state-appropriate headlines', () => {
    expect(stateHeadline(seasonFromRow(row(), new Date('2026-12-01T00:00:00')))).toContain('Registration')
    expect(stateHeadline(seasonFromRow(row(), new Date('2027-01-25T00:00:00')), new Date('2027-01-25T00:00:00')))
      .toBe('Week 3 of 10 — view your ranking.')
    expect(stateHeadline(seasonFromRow(row(), new Date('2027-05-01T00:00:00')))).toContain('final standings')
    expect(stateHeadline(seasonFromRow(row(), new Date('2026-08-01T00:00:00')))).toContain('Keep training')
  })

  it('falls back to auto-roll dates when the table is unreachable', () => {
    const s = fallbackSeason(undefined, new Date('2027-02-01T00:00:00'))
    expect(s.source).toBe('fallback')
    expect(s.year).toBe(2027)
    expect(s.scoringWeeks).toBe(10)
    expect(s.state).toBe('active')
    expect(fallbackSeason(2028).year).toBe(2028)
  })

  it('spells out the year on both sides when a season crosses new year', () => {
    expect(formatDateRange(new Date(2027, 11, 27), new Date(2028, 2, 5))).toBe('27 Dec 2027 – 5 Mar 2028')
  })
})
