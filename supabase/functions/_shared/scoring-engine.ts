// DEFIT OML scoring engine — pure, framework-free so it can be unit tested.
// Single source of truth for ranking math shared by edge functions and tests.

export const DEFAULT_CHALLENGE_START = '2027-01-11'
export const DEFAULT_CHALLENGE_END = '2027-03-21'
export const CHALLENGE_CYCLE = 'DEFIT2027'

// ─── CONSTANTS ───
export const HIIT_WEEKLY_CAP = 45
export const TMARM_WEEKLY_CAP = 60
export const DEFAULT_SCORING_WEEKS = 10
export const COMPLETION_MINS = { cardio: 120, strength: 50000, hiit: 480, tmarm: 480 }
export const COMPLETION_WEIGHTS = { cardio: 0.3, strength: 0.3, hiit: 0.2, tmarm: 0.2 }

// ─── TYPES ───
export interface EntityMetrics {
  id: string
  name: string
  weeklyCardio: number[]
  weeklyStrength: number[]
  weeklyHiit: number[]
  weeklyTmarm: number[]
  totalCardio: number
  totalStrength: number
  totalHiit: number
  totalTmarm: number
  completionPct: number
  metadata?: Record<string, unknown>
}

export interface RankResult {
  entityId: string
  entityName: string
  componentA: number
  componentB: number
  componentC: number
  componentD: number
  componentE: number
  componentF: number | null
  totalScore: number
  finalRank: number
  rawValues: Record<string, number>
  metadata?: Record<string, unknown>
}

// ─── UTILITIES ───

/** Assign competition ranks (ties get same rank, next rank skips). */
export function assignRanks(items: { id: string; val: number }[], lowerBetter = false): Map<string, number> {
  const sorted = [...items].sort((a, b) => lowerBetter ? a.val - b.val : b.val - a.val)
  const m = new Map<string, number>()
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].val === sorted[i - 1].val) {
      m.set(sorted[i].id, m.get(sorted[i - 1].id)!)
    } else {
      m.set(sorted[i].id, i + 1)
    }
  }
  return m
}

/** Get 0-indexed week number for a date relative to challenge start. */
export function getWeekIndex(dateStr: string, start: Date): number {
  const d = new Date(dateStr)
  const diff = d.getTime() - start.getTime()
  if (diff < 0) return -1
  return Math.floor(diff / (7 * 24 * 3600 * 1000))
}

/** Compute individual completion % (weighted, capped at 100). */
export function completionPct(r: { cardio: number; strength: number; hiit: number; tmarm: number }): number {
  return (
    Math.min(r.cardio / COMPLETION_MINS.cardio, 1) * COMPLETION_WEIGHTS.cardio +
    Math.min(r.strength / COMPLETION_MINS.strength, 1) * COMPLETION_WEIGHTS.strength +
    Math.min(r.hiit / COMPLETION_MINS.hiit, 1) * COMPLETION_WEIGHTS.hiit +
    Math.min(r.tmarm / COMPLETION_MINS.tmarm, 1) * COMPLETION_WEIGHTS.tmarm
  ) * 100
}

export function isComplete(r: { cardio: number; strength: number; hiit: number; tmarm: number }): boolean {
  return r.cardio >= COMPLETION_MINS.cardio && r.strength >= COMPLETION_MINS.strength &&
    r.hiit >= COMPLETION_MINS.hiit && r.tmarm >= COMPLETION_MINS.tmarm
}

export function getUnitPoolSize(memberCount: number): number {
  if (memberCount >= 20) return 8
  if (memberCount >= 10) return 6
  return 4
}

// ─── BUILD METRICS ───

export function buildUserMetrics(
  userId: string, name: string,
  logs: { cardio: any[]; strength: any[]; hiit: any[]; tmarm: any[] },
  challengeStart: Date, scoringWeeks: number,
  metadata?: Record<string, unknown>,
): EntityMetrics {
  const wC = Array(scoringWeeks).fill(0)
  const wS = Array(scoringWeeks).fill(0)
  const wH = Array(scoringWeeks).fill(0)
  const wT = Array(scoringWeeks).fill(0)

  const add = (arr: number[], dateStr: string, val: number) => {
    const w = getWeekIndex(dateStr, challengeStart)
    if (w >= 0 && w < scoringWeeks) arr[w] += val
  }

  logs.cardio.filter(l => l.user_id === userId).forEach(l => add(wC, l.date, Number(l.distance) || 0))
  logs.strength.filter(l => l.user_id === userId).forEach(l => add(wS, l.date, Number(l.total_weight) || 0))
  logs.hiit.filter(l => l.user_id === userId).forEach(l => add(wH, l.date, l.duration || 0))
  logs.tmarm.filter(l => l.user_id === userId).forEach(l => add(wT, l.date, l.duration || 0))

  // Apply weekly caps
  for (let i = 0; i < scoringWeeks; i++) {
    wH[i] = Math.min(wH[i], HIIT_WEEKLY_CAP)
    wT[i] = Math.min(wT[i], TMARM_WEEKLY_CAP)
  }

  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
  const tc = sum(wC), ts = sum(wS), th = sum(wH), tt = sum(wT)

  return {
    id: userId, name,
    weeklyCardio: wC, weeklyStrength: wS, weeklyHiit: wH, weeklyTmarm: wT,
    totalCardio: tc, totalStrength: ts, totalHiit: th, totalTmarm: tt,
    completionPct: completionPct({ cardio: tc, strength: ts, hiit: th, tmarm: tt }),
    metadata,
  }
}

/** Aggregate pool members into a single entity. */
export function aggregatePool(members: EntityMetrics[], entityId: string, entityName: string, scoringWeeks: number, metadata?: Record<string, unknown>): EntityMetrics {
  const wC = Array(scoringWeeks).fill(0)
  const wS = Array(scoringWeeks).fill(0)
  const wH = Array(scoringWeeks).fill(0)
  const wT = Array(scoringWeeks).fill(0)

  members.forEach(m => {
    for (let w = 0; w < scoringWeeks; w++) {
      wC[w] += m.weeklyCardio[w] || 0
      wS[w] += m.weeklyStrength[w] || 0
      wH[w] += m.weeklyHiit[w] || 0
      wT[w] += m.weeklyTmarm[w] || 0
    }
  })

  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
  return {
    id: entityId, name: entityName,
    weeklyCardio: wC, weeklyStrength: wS, weeklyHiit: wH, weeklyTmarm: wT,
    totalCardio: sum(wC), totalStrength: sum(wS), totalHiit: sum(wH), totalTmarm: sum(wT),
    completionPct: 0,
    metadata,
  }
}

// ─── COMPONENT E ───

export function computeComponentE(entities: EntityMetrics[], scoringWeeks: number): Map<string, { rank: number; eRaw: number }> {
  const eRaws = new Map<string, number>()
  entities.forEach(e => eRaws.set(e.id, 0))

  for (let w = 0; w < scoringWeeks; w++) {
    const wA = assignRanks(entities.map(e => ({ id: e.id, val: e.weeklyCardio[w] || 0 })))
    const wB = assignRanks(entities.map(e => ({ id: e.id, val: e.weeklyStrength[w] || 0 })))
    const wC = assignRanks(entities.map(e => ({ id: e.id, val: e.weeklyHiit[w] || 0 })))
    const wD = assignRanks(entities.map(e => ({ id: e.id, val: e.weeklyTmarm[w] || 0 })))

    const weeklyScores = entities.map(e => ({
      id: e.id,
      val: (wA.get(e.id) || 0) + (wB.get(e.id) || 0) + (wC.get(e.id) || 0) + (wD.get(e.id) || 0),
    }))
    const weeklyOverallRank = assignRanks(weeklyScores, true)

    entities.forEach(e => {
      eRaws.set(e.id, (eRaws.get(e.id) || 0) + (weeklyOverallRank.get(e.id) || 0))
    })
  }

  const eRank = assignRanks(entities.map(e => ({ id: e.id, val: eRaws.get(e.id) || 0 })), true)
  const result = new Map<string, { rank: number; eRaw: number }>()
  entities.forEach(e => result.set(e.id, { rank: eRank.get(e.id) || 0, eRaw: eRaws.get(e.id) || 0 }))
  return result
}

// ─── COMPUTE RANKINGS ───

export function computeRankings(
  entities: EntityMetrics[],
  level: string,
  scoringWeeks: number,
  fValues?: Map<string, number>,
): RankResult[] {
  if (entities.length === 0) return []

  const rA = assignRanks(entities.map(e => ({ id: e.id, val: e.totalCardio })))
  const rB = assignRanks(entities.map(e => ({ id: e.id, val: e.totalStrength })))
  const rC = assignRanks(entities.map(e => ({ id: e.id, val: e.totalHiit })))
  const rD = assignRanks(entities.map(e => ({ id: e.id, val: e.totalTmarm })))
  const eComp = computeComponentE(entities, scoringWeeks)

  let rF: Map<string, number> | null = null
  if (fValues && level !== 'individual') {
    rF = assignRanks(Array.from(fValues.entries()).map(([id, val]) => ({ id, val })))
  }

  const hasF = level !== 'individual'
  const tieOrder: ('A' | 'B' | 'C' | 'D' | 'E' | 'F')[] = hasF
    ? ['F', 'E', 'A', 'B', 'C', 'D']
    : ['E', 'A', 'B', 'C', 'D']

  const getComp = (r: RankResult, c: string) =>
    c === 'A' ? r.componentA : c === 'B' ? r.componentB :
    c === 'C' ? r.componentC : c === 'D' ? r.componentD :
    c === 'E' ? r.componentE : r.componentF ?? 0

  const results: RankResult[] = entities.map(e => {
    const a = rA.get(e.id) || 0, b = rB.get(e.id) || 0
    const c = rC.get(e.id) || 0, d = rD.get(e.id) || 0
    const eVal = eComp.get(e.id)?.rank || 0
    const f = hasF ? (rF?.get(e.id) || 0) : null

    return {
      entityId: e.id, entityName: e.name,
      componentA: a, componentB: b, componentC: c, componentD: d,
      componentE: eVal, componentF: f,
      totalScore: a + b + c + d + eVal + (f || 0),
      finalRank: 0,
      rawValues: {
        cardio: e.totalCardio, strength: e.totalStrength,
        hiit: e.totalHiit, tmarm: e.totalTmarm,
        eRaw: eComp.get(e.id)?.eRaw || 0,
        completionPct: e.completionPct,
        ...(fValues ? { fRaw: fValues.get(e.id) || 0 } : {}),
      },
      metadata: e.metadata,
    }
  })

  // Sort: lowest total wins, tie-break by component ranks
  results.sort((a, b) => {
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore
    for (const comp of tieOrder) {
      const av = getComp(a, comp), bv = getComp(b, comp)
      if (av !== bv) return av - bv
    }
    return 0
  })

  // Assign final ranks (true ties get same rank)
  for (let i = 0; i < results.length; i++) {
    if (i === 0) { results[i].finalRank = 1; continue }
    const prev = results[i - 1], curr = results[i]
    const allSame = curr.totalScore === prev.totalScore &&
      tieOrder.every(c => getComp(curr, c) === getComp(prev, c))
    results[i].finalRank = allSame ? prev.finalRank : i + 1
  }

  return results
}

