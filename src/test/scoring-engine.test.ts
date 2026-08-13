import { describe, it, expect } from 'vitest'
import {
  assignRanks,
  getWeekIndex,
  completionPct,
  isComplete,
  getUnitPoolSize,
  buildUserMetrics,
  aggregatePool,
  computeRankings,
  HIIT_WEEKLY_CAP,
  TMARM_WEEKLY_CAP,
  COMPLETION_MINS,
  DEFAULT_SCORING_WEEKS,
  DEFAULT_CHALLENGE_START,
  DEFAULT_CHALLENGE_END,
  CHALLENGE_CYCLE,
  type EntityMetrics,
} from '../../supabase/functions/_shared/scoring-engine'

const START = new Date(`${DEFAULT_CHALLENGE_START}T00:00:00Z`)
const WEEKS = DEFAULT_SCORING_WEEKS

type Log = { user_id: string; date: string; distance?: number; total_weight?: number; duration?: number }
const emptyLogs = () => ({ cardio: [] as Log[], strength: [] as Log[], hiit: [] as Log[], tmarm: [] as Log[] })

function user(id: string, logs: ReturnType<typeof emptyLogs>) {
  return buildUserMetrics(id, id, logs, START, WEEKS)
}

describe('cycle configuration defaults', () => {
  it('defaults to the DEFIT 2027 10-week window', () => {
    expect(CHALLENGE_CYCLE).toBe('DEFIT2027')
    expect(DEFAULT_CHALLENGE_START).toBe('2027-01-11')
    expect(DEFAULT_CHALLENGE_END).toBe('2027-03-21')
    expect(WEEKS).toBe(10)
  })

  it('the default window spans exactly the configured number of weeks', () => {
    const days =
      (new Date(`${DEFAULT_CHALLENGE_END}T00:00:00Z`).getTime() - START.getTime()) / 86_400_000
    expect(days + 1).toBe(WEEKS * 7)
  })
})

describe('assignRanks', () => {
  it('ranks higher values first and skips ranks after ties', () => {
    const m = assignRanks([
      { id: 'a', val: 10 },
      { id: 'b', val: 10 },
      { id: 'c', val: 5 },
    ])
    expect(m.get('a')).toBe(1)
    expect(m.get('b')).toBe(1)
    expect(m.get('c')).toBe(3)
  })

  it('supports lower-is-better ranking', () => {
    const m = assignRanks([{ id: 'a', val: 3 }, { id: 'b', val: 1 }], true)
    expect(m.get('b')).toBe(1)
    expect(m.get('a')).toBe(2)
  })
})

describe('week boundaries', () => {
  it('buckets the cycle start day into week 0', () => {
    expect(getWeekIndex(DEFAULT_CHALLENGE_START, START)).toBe(0)
  })

  it('rolls to week 1 on day 7 and week 9 on the final day', () => {
    expect(getWeekIndex('2027-01-17', START)).toBe(0)
    expect(getWeekIndex('2027-01-18', START)).toBe(1)
    expect(getWeekIndex(DEFAULT_CHALLENGE_END, START)).toBe(WEEKS - 1)
  })

  it('rejects pre-cycle dates and puts post-cycle dates out of range', () => {
    expect(getWeekIndex('2027-01-10', START)).toBe(-1)
    expect(getWeekIndex('2027-03-22', START)).toBe(WEEKS)
  })

  it('ignores logs outside the cycle when building metrics', () => {
    const logs = emptyLogs()
    logs.cardio.push(
      { user_id: 'u1', date: '2027-01-10', distance: 100 }, // before cycle
      { user_id: 'u1', date: '2027-03-22', distance: 100 }, // after cycle
      { user_id: 'u1', date: '2027-02-01', distance: 5 },
    )
    expect(user('u1', logs).totalCardio).toBe(5)
  })
})

describe('weekly caps', () => {
  it('caps HIIT and TMAR-M per week but leaves cardio and strength uncapped', () => {
    const logs = emptyLogs()
    logs.hiit.push({ user_id: 'u1', date: '2027-01-12', duration: 500 })
    logs.tmarm.push({ user_id: 'u1', date: '2027-01-12', duration: 500 })
    logs.cardio.push({ user_id: 'u1', date: '2027-01-12', distance: 500 })
    logs.strength.push({ user_id: 'u1', date: '2027-01-12', total_weight: 900_000 })

    const m = user('u1', logs)
    expect(m.totalHiit).toBe(HIIT_WEEKLY_CAP)
    expect(m.totalTmarm).toBe(TMARM_WEEKLY_CAP)
    expect(m.totalCardio).toBe(500)
    expect(m.totalStrength).toBe(900_000)
  })

  it('applies the cap per week, not across the cycle', () => {
    const logs = emptyLogs()
    logs.hiit.push(
      { user_id: 'u1', date: '2027-01-12', duration: 90 },
      { user_id: 'u1', date: '2027-01-19', duration: 90 },
    )
    expect(user('u1', logs).totalHiit).toBe(HIIT_WEEKLY_CAP * 2)
  })

  it('only attributes logs to their owner', () => {
    const logs = emptyLogs()
    logs.cardio.push({ user_id: 'u2', date: '2027-01-12', distance: 42 })
    expect(user('u1', logs).totalCardio).toBe(0)
  })
})

describe('completion metric', () => {
  it('is 0 with no activity and 100 when every minimum is met', () => {
    expect(completionPct({ cardio: 0, strength: 0, hiit: 0, tmarm: 0 })).toBe(0)
    expect(completionPct(COMPLETION_MINS)).toBeCloseTo(100, 6)
  })

  it('caps each category so overachieving one pillar cannot exceed 100', () => {
    const pct = completionPct({ cardio: 10_000, strength: 0, hiit: 0, tmarm: 0 })
    expect(pct).toBeCloseTo(30, 6)
  })

  it('weights cardio and strength at 30% and HIIT/TMAR-M at 20%', () => {
    expect(completionPct({ cardio: COMPLETION_MINS.cardio, strength: 0, hiit: 0, tmarm: 0 })).toBeCloseTo(30, 6)
    expect(completionPct({ cardio: 0, strength: COMPLETION_MINS.strength, hiit: 0, tmarm: 0 })).toBeCloseTo(30, 6)
    expect(completionPct({ cardio: 0, strength: 0, hiit: COMPLETION_MINS.hiit, tmarm: 0 })).toBeCloseTo(20, 6)
    expect(completionPct({ cardio: 0, strength: 0, hiit: 0, tmarm: COMPLETION_MINS.tmarm })).toBeCloseTo(20, 6)
  })

  it('requires all four minimums for completer status', () => {
    expect(isComplete(COMPLETION_MINS)).toBe(true)
    expect(isComplete({ ...COMPLETION_MINS, tmarm: COMPLETION_MINS.tmarm - 1 })).toBe(false)
  })

  it('the 480-minute minimums equal 48 min/week over a 10-week cycle', () => {
    expect(COMPLETION_MINS.hiit / WEEKS).toBe(48)
    expect(COMPLETION_MINS.tmarm / WEEKS).toBe(48)
  })
})

describe('unit pool sizes', () => {
  it('scales the scoring pool with unit size', () => {
    expect(getUnitPoolSize(4)).toBe(4)
    expect(getUnitPoolSize(9)).toBe(4)
    expect(getUnitPoolSize(10)).toBe(6)
    expect(getUnitPoolSize(19)).toBe(6)
    expect(getUnitPoolSize(20)).toBe(8)
    expect(getUnitPoolSize(500)).toBe(8)
  })
})

describe('individual rankings', () => {
  function participant(id: string, cardio: number, strength: number, hiit: number, tmarm: number) {
    const logs = emptyLogs()
    logs.cardio.push({ user_id: id, date: '2027-01-12', distance: cardio })
    logs.strength.push({ user_id: id, date: '2027-01-12', total_weight: strength })
    logs.hiit.push({ user_id: id, date: '2027-01-12', duration: hiit })
    logs.tmarm.push({ user_id: id, date: '2027-01-12', duration: tmarm })
    return user(id, logs)
  }

  it('ranks the strongest all-round participant first (lower total wins)', () => {
    const entities = [
      participant('strong', 100, 40_000, 40, 50),
      participant('mid', 50, 20_000, 30, 40),
      participant('light', 10, 5_000, 10, 10),
    ]
    const res = computeRankings(entities, 'individual', WEEKS)
    expect(res[0].entityId).toBe('strong')
    expect(res[2].entityId).toBe('light')
    expect(res[0].totalScore).toBeLessThan(res[1].totalScore)
    expect(res.map(r => r.finalRank)).toEqual([1, 2, 3])
  })

  it('omits component F for individuals', () => {
    const res = computeRankings([participant('a', 5, 100, 5, 5)], 'individual', WEEKS)
    expect(res[0].componentF).toBeNull()
    expect(res[0].totalScore).toBe(
      res[0].componentA + res[0].componentB + res[0].componentC + res[0].componentD + res[0].componentE,
    )
  })

  it('gives identical performers the same rank', () => {
    const res = computeRankings(
      [participant('a', 20, 1_000, 10, 10), participant('b', 20, 1_000, 10, 10)],
      'individual',
      WEEKS,
    )
    expect(res[0].finalRank).toBe(1)
    expect(res[1].finalRank).toBe(1)
    expect(res[0].totalScore).toBe(res[1].totalScore)
  })

  it('breaks ties on weekly consistency (E) before volume components', () => {
    // Both log the same totals, but one spreads work across weeks.
    const spreadLogs = emptyLogs()
    const burstLogs = emptyLogs()
    for (let w = 0; w < 4; w++) {
      const date = new Date(START.getTime() + w * 7 * 86_400_000).toISOString().slice(0, 10)
      spreadLogs.cardio.push({ user_id: 'spread', date, distance: 10 })
      spreadLogs.hiit.push({ user_id: 'spread', date, duration: 30 })
    }
    burstLogs.cardio.push({ user_id: 'burst', date: '2027-01-12', distance: 40 })
    burstLogs.hiit.push({ user_id: 'burst', date: '2027-01-12', duration: 45 })

    const res = computeRankings([user('spread', spreadLogs), user('burst', burstLogs)], 'individual', WEEKS)
    const spread = res.find(r => r.entityId === 'spread')!
    const burst = res.find(r => r.entityId === 'burst')!
    expect(spread.componentE).toBeLessThan(burst.componentE)
    expect(spread.rawValues.eRaw).toBeLessThan(burst.rawValues.eRaw)
  })

  it('returns an empty array when there are no entities', () => {
    expect(computeRankings([], 'individual', WEEKS)).toEqual([])
  })

  it('an extreme-volume outlier takes the top volume ranks (uncapped cardio/strength)', () => {
    const res = computeRankings(
      [participant('outlier', 5_000, 5_000_000, 45, 60), participant('normal', 120, 50_000, 45, 60)],
      'individual',
      WEEKS,
    )
    expect(res[0].entityId).toBe('outlier')
    expect(res[0].componentA).toBe(1)
    expect(res[0].componentB).toBe(1)
  })
})

describe('pooled rankings (team / unit / command)', () => {
  function member(id: string, weekly: number) {
    const logs = emptyLogs()
    for (let w = 0; w < WEEKS; w++) {
      const date = new Date(START.getTime() + w * 7 * 86_400_000).toISOString().slice(0, 10)
      logs.cardio.push({ user_id: id, date, distance: weekly })
      logs.strength.push({ user_id: id, date, total_weight: weekly * 500 })
      logs.hiit.push({ user_id: id, date, duration: 48 })
      logs.tmarm.push({ user_id: id, date, duration: 48 })
    }
    return user(id, logs)
  }

  it('aggregates weekly buckets across pool members', () => {
    const pool = [member('m1', 10), member('m2', 5)]
    const agg = aggregatePool(pool, 'team-1', 'Team One', WEEKS)
    expect(agg.weeklyCardio[0]).toBe(15)
    expect(agg.totalCardio).toBe(15 * WEEKS)
    expect(agg.weeklyHiit[0]).toBe(HIIT_WEEKLY_CAP * 2)
  })

  it('selects only the top four members for a team pool', () => {
    const members = [member('a', 40), member('b', 30), member('c', 20), member('d', 10), member('e', 1)]
    const indiv = computeRankings(members, 'individual', WEEKS)
    const scores = new Map(indiv.map(r => [r.entityId, r.totalScore]))
    const sorted = [...members].sort((x, y) => scores.get(x.id)! - scores.get(y.id)!)
    const pool = sorted.slice(0, 4)
    expect(pool.map(p => p.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(aggregatePool(pool, 't', 'T', WEEKS).totalCardio).toBe((40 + 30 + 20 + 10) * WEEKS)
  })

  it('includes component F for pooled levels and uses it as the first tie-break', () => {
    const strong = aggregatePool([member('a', 40), member('b', 40)], 'unit-a', 'Unit A', WEEKS)
    const weak = aggregatePool([member('c', 5), member('d', 5)], 'unit-b', 'Unit B', WEEKS)
    const fValues = new Map([['unit-a', 95], ['unit-b', 20]])
    const res = computeRankings([strong, weak], 'unit', WEEKS, fValues)
    expect(res[0].entityId).toBe('unit-a')
    expect(res[0].componentF).toBe(1)
    expect(res[1].componentF).toBe(2)
    expect(res[0].rawValues.fRaw).toBe(95)
  })

  it('command pools take the top twelve members', () => {
    const members = Array.from({ length: 15 }, (_, i) => member(`m${i}`, 100 - i))
    const indiv = computeRankings(members, 'individual', WEEKS)
    const scores = new Map(indiv.map(r => [r.entityId, r.totalScore]))
    const pool = [...members].sort((x, y) => scores.get(x.id)! - scores.get(y.id)!).slice(0, 12)
    expect(pool).toHaveLength(12)
    expect(pool.map(p => p.id)).not.toContain('m14')
  })

  it('keeps totals stable regardless of member ordering', () => {
    const a = member('a', 12)
    const b = member('b', 7)
    const one = aggregatePool([a, b], 'x', 'X', WEEKS)
    const two = aggregatePool([b, a], 'x', 'X', WEEKS)
    expect(one.totalCardio).toBe(two.totalCardio)
    expect(one.weeklyStrength).toEqual(two.weeklyStrength)
  })
})

describe('synthetic competition simulation', () => {
  it('produces a complete, gapless, deterministic ordering for a mixed field', () => {
    const profiles: { id: string; cardio: number; strength: number; hiit: number; tmarm: number }[] = [
      { id: 'casual', cardio: 3, strength: 1_000, hiit: 15, tmarm: 20 },
      { id: 'endurance', cardio: 30, strength: 2_000, hiit: 45, tmarm: 30 },
      { id: 'powerlifter', cardio: 2, strength: 30_000, hiit: 20, tmarm: 60 },
      { id: 'balanced', cardio: 14, strength: 6_000, hiit: 48, tmarm: 48 },
      { id: 'fabricated', cardio: 400, strength: 800_000, hiit: 300, tmarm: 300 },
    ]

    const entities: EntityMetrics[] = profiles.map(p => {
      const logs = emptyLogs()
      for (let w = 0; w < WEEKS; w++) {
        const date = new Date(START.getTime() + w * 7 * 86_400_000).toISOString().slice(0, 10)
        logs.cardio.push({ user_id: p.id, date, distance: p.cardio })
        logs.strength.push({ user_id: p.id, date, total_weight: p.strength })
        logs.hiit.push({ user_id: p.id, date, duration: p.hiit })
        logs.tmarm.push({ user_id: p.id, date, duration: p.tmarm })
      }
      return user(p.id, logs)
    })

    const first = computeRankings(entities, 'individual', WEEKS)
    const second = computeRankings([...entities].reverse(), 'individual', WEEKS)

    expect(first).toHaveLength(profiles.length)
    expect(first.map(r => r.entityId)).toEqual(second.map(r => r.entityId))
    expect(first.map(r => r.finalRank)).toEqual([1, 2, 3, 4, 5])
    expect(first[0].entityId).toBe('fabricated')
    expect(first[first.length - 1].entityId).toBe('casual')

    // Capped pillars neutralise fabricated HIIT/TMAR-M volume.
    const fab = first.find(r => r.entityId === 'fabricated')!
    expect(fab.rawValues.hiit).toBe(HIIT_WEEKLY_CAP * WEEKS)
    expect(fab.rawValues.tmarm).toBe(TMARM_WEEKLY_CAP * WEEKS)

    // Balanced participant is the only one meeting every minimum.
    const balanced = first.find(r => r.entityId === 'balanced')!
    expect(balanced.rawValues.completionPct).toBeGreaterThan(
      first.find(r => r.entityId === 'casual')!.rawValues.completionPct,
    )
  })
})
