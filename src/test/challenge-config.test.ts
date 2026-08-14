import { describe, it, expect } from 'vitest'
import {
  CHALLENGE_CYCLE,
  CHALLENGE_LABEL,
  CHALLENGE_START,
  CHALLENGE_END,
  CHALLENGE_WEEKS,
  CHALLENGE_DATE_RANGE,
  currentWeek,
  weeksRemaining,
  cycleStatus,
  requiredPacePerWeek,
  cycleForYear,
  cycleForDate,
  activeCycle,
  previousCycle,
  daysUntilStart,
  isOffSeason,

} from '@/lib/challenge'
import {
  DEFAULT_CHALLENGE_START,
  DEFAULT_CHALLENGE_END,
  DEFAULT_SCORING_WEEKS,
  CHALLENGE_CYCLE as ENGINE_CYCLE,
} from '../../supabase/functions/_shared/scoring-engine'

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('challenge configuration is consistent front to back', () => {
  it('frontend constants match the backend scoring defaults', () => {
    expect(CHALLENGE_CYCLE).toBe(ENGINE_CYCLE)
    expect(iso(CHALLENGE_START)).toBe(DEFAULT_CHALLENGE_START)
    expect(iso(CHALLENGE_END)).toBe(DEFAULT_CHALLENGE_END)
    expect(CHALLENGE_WEEKS).toBe(DEFAULT_SCORING_WEEKS)
  })

  it('labels and copy reference the active cycle year', () => {
    const year = CHALLENGE_START.getFullYear()
    expect(CHALLENGE_LABEL).toContain(String(year))
    expect(CHALLENGE_DATE_RANGE).toContain(String(year))
    expect(CHALLENGE_CYCLE).toBe(`DEFIT${year}`)
  })
})

describe('annual auto-roll', () => {
  it('starts each cycle on the second Monday of January', () => {
    expect(iso(cycleForYear(2027).start)).toBe('2027-01-11')
    expect(iso(cycleForYear(2028).start)).toBe('2028-01-10')
    expect(cycleForYear(2029).start.getDay()).toBe(1)
  })

  it('runs ten weeks and ends on a Sunday', () => {
    for (const y of [2027, 2028, 2029]) {
      const c = cycleForYear(y)
      const days = Math.round((c.end.setHours(0, 0, 0, 0) - c.start.getTime()) / 86400000)
      expect(days).toBe(CHALLENGE_WEEKS * 7 - 1)
    }
  })

  it('rolls to next year once the cycle has ended', () => {
    expect(activeCycle(new Date('2027-02-01T00:00:00')).year).toBe(2027)
    expect(activeCycle(new Date('2027-06-01T00:00:00')).year).toBe(2028)
    expect(activeCycle(new Date('2028-01-05T00:00:00')).year).toBe(2028)
  })

  it('reports the previous cycle only after one has finished', () => {
    expect(previousCycle(new Date('2026-08-01T00:00:00'))).toBeNull()
    expect(previousCycle(new Date('2027-06-01T00:00:00'))?.year).toBe(2027)
  })

  it('classifies off-season activity as outside any cycle', () => {
    expect(cycleForDate(new Date('2027-02-01T00:00:00'))?.year).toBe(2027)
    expect(cycleForDate(new Date('2027-08-01T00:00:00'))).toBeNull()
  })

  it('counts days until the next cycle opens', () => {
    expect(daysUntilStart(new Date('2027-01-01T00:00:00'))).toBe(10)
    expect(daysUntilStart(new Date('2027-02-01T00:00:00'))).toBe(0)
    expect(isOffSeason(new Date('2027-08-01T00:00:00'))).toBe(true)
    expect(isOffSeason(new Date('2027-02-01T00:00:00'))).toBe(false)
  })
})


describe('cycle week math', () => {
  it('reports upcoming, active and complete states', () => {
    expect(cycleStatus(new Date('2026-12-01T00:00:00'))).toBe('upcoming')
    expect(cycleStatus(new Date('2027-02-01T00:00:00'))).toBe('active')
    expect(cycleStatus(new Date('2027-04-01T00:00:00'))).toBe('complete')
  })

  it('clamps the week index to the cycle', () => {
    expect(currentWeek(new Date('2027-01-11T08:00:00'))).toBe(1)
    expect(currentWeek(new Date('2027-01-18T08:00:00'))).toBe(2)
    expect(currentWeek(new Date('2027-03-21T08:00:00'))).toBe(CHALLENGE_WEEKS)
    expect(currentWeek(new Date('2027-06-01T08:00:00'))).toBe(CHALLENGE_WEEKS)
    expect(currentWeek(new Date('2026-01-01T08:00:00'))).toBe(1)
  })

  it('counts remaining weeks and hits zero after the cycle', () => {
    expect(weeksRemaining(new Date('2027-01-11T00:00:00'))).toBe(CHALLENGE_WEEKS)
    expect(weeksRemaining(new Date('2027-04-01T00:00:00'))).toBe(0)
  })

  it('computes required weekly pace toward a minimum', () => {
    expect(requiredPacePerWeek(480, 480, new Date('2027-02-01T00:00:00'))).toBe(0)
    expect(requiredPacePerWeek(0, 480, new Date('2027-01-11T00:00:00'))).toBe(48)
    expect(requiredPacePerWeek(240, 480, new Date('2027-03-20T00:00:00'))).toBe(240)
  })
})
