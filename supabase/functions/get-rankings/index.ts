import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ─── CONSTANTS ───
const HIIT_WEEKLY_CAP = 45
const TMARM_WEEKLY_CAP = 60
const DEFAULT_SCORING_WEEKS = 8
const COMPLETION_MINS = { cardio: 120, strength: 50000, hiit: 300, tmarm: 200 }
const COMPLETION_WEIGHTS = { cardio: 0.3, strength: 0.3, hiit: 0.2, tmarm: 0.2 }

// ─── TYPES ───
interface EntityMetrics {
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

interface RankResult {
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
function assignRanks(items: { id: string; val: number }[], lowerBetter = false): Map<string, number> {
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
function getWeekIndex(dateStr: string, start: Date): number {
  const d = new Date(dateStr)
  const diff = d.getTime() - start.getTime()
  if (diff < 0) return -1
  return Math.floor(diff / (7 * 24 * 3600 * 1000))
}

/** Compute individual completion % (weighted, capped at 100). */
function completionPct(r: { cardio: number; strength: number; hiit: number; tmarm: number }): number {
  return (
    Math.min(r.cardio / COMPLETION_MINS.cardio, 1) * COMPLETION_WEIGHTS.cardio +
    Math.min(r.strength / COMPLETION_MINS.strength, 1) * COMPLETION_WEIGHTS.strength +
    Math.min(r.hiit / COMPLETION_MINS.hiit, 1) * COMPLETION_WEIGHTS.hiit +
    Math.min(r.tmarm / COMPLETION_MINS.tmarm, 1) * COMPLETION_WEIGHTS.tmarm
  ) * 100
}

function isComplete(r: { cardio: number; strength: number; hiit: number; tmarm: number }): boolean {
  return r.cardio >= COMPLETION_MINS.cardio && r.strength >= COMPLETION_MINS.strength &&
    r.hiit >= COMPLETION_MINS.hiit && r.tmarm >= COMPLETION_MINS.tmarm
}

function getUnitPoolSize(memberCount: number): number {
  if (memberCount >= 20) return 8
  if (memberCount >= 10) return 6
  return 4
}

// ─── BUILD METRICS ───

function buildUserMetrics(
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
function aggregatePool(members: EntityMetrics[], entityId: string, entityName: string, scoringWeeks: number, metadata?: Record<string, unknown>): EntityMetrics {
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

function computeComponentE(entities: EntityMetrics[], scoringWeeks: number): Map<string, { rank: number; eRaw: number }> {
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

function computeRankings(
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

// ─── MAIN HANDLER ───

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Parse params from URL (GET) or body (POST)
    let level = 'individual', limit = 50, search = '', findMe = ''
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        level = body.level || level
        limit = body.limit || limit
        search = (body.search || '').trim()
        findMe = (body.findMe || '').trim()
      } catch { /* use defaults */ }
    } else {
      const url = new URL(req.url)
      level = url.searchParams.get('level') || level
      limit = parseInt(url.searchParams.get('limit') || '50')
      search = (url.searchParams.get('search') || '').trim()
      findMe = (url.searchParams.get('findMe') || '').trim()
    }

    if (!['individual', 'team', 'unit', 'command'].includes(level)) {
      return new Response(JSON.stringify({ error: 'Invalid level. Use: individual, team, unit, command' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch config
    const { data: configRows } = await supabase.from('challenge_config').select('key, value')
    const cfg: Record<string, string> = {}
    configRows?.forEach(r => { cfg[r.key] = r.value })
    const challengeStart = new Date(cfg.challenge_start_date || '2026-01-12')
    const scoringWeeks = parseInt(cfg.scoring_weeks || String(DEFAULT_SCORING_WEEKS))

    // Fetch all data in parallel
    const [profilesRes, cardioRes, strengthRes, hiitRes, tmarmRes, teamsRes, membersRes, commandsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, unit, unit_category, command_id').limit(10000),
      supabase.from('cardio_logs').select('user_id, date, distance').limit(50000),
      supabase.from('strength_logs').select('user_id, date, total_weight').limit(50000),
      supabase.from('hiit_logs').select('user_id, date, duration').limit(50000),
      supabase.from('tmarm_logs').select('user_id, date, duration').limit(50000),
      level === 'team' ? supabase.from('teams').select('id, name, is_usar') : Promise.resolve({ data: [], error: null }),
      level === 'team' ? supabase.from('team_members').select('team_id, user_id') : Promise.resolve({ data: [], error: null }),
      level === 'command' ? supabase.from('commands').select('id, name') : Promise.resolve({ data: [], error: null }),
    ])

    for (const res of [profilesRes, cardioRes, strengthRes, hiitRes, tmarmRes]) {
      if (res.error) throw res.error
    }

    const profiles = profilesRes.data || []
    const allLogs = {
      cardio: cardioRes.data || [], strength: strengthRes.data || [],
      hiit: hiitRes.data || [], tmarm: tmarmRes.data || [],
    }

    // Build individual metrics for all active users
    const userMetrics = new Map<string, EntityMetrics>()
    for (const p of profiles) {
      const m = buildUserMetrics(p.user_id, p.full_name || 'Anonymous', allLogs, challengeStart, scoringWeeks, {
        unit: p.unit, unitCategory: p.unit_category, commandId: p.command_id,
      })
      if (m.totalCardio > 0 || m.totalStrength > 0 || m.totalHiit > 0 || m.totalTmarm > 0) {
        userMetrics.set(p.user_id, m)
      }
    }

    let results: RankResult[] = []

    if (level === 'individual') {
      results = computeRankings(Array.from(userMetrics.values()), 'individual', scoringWeeks)
    }

    else if (level === 'team') {
      const indivResults = computeRankings(Array.from(userMetrics.values()), 'individual', scoringWeeks)
      const indivScores = new Map<string, number>()
      indivResults.forEach(r => indivScores.set(r.entityId, r.totalScore))

      const teams = teamsRes.data || []
      const allMembers = membersRes.data || []
      const teamEntities: EntityMetrics[] = []
      const fValues = new Map<string, number>()

      for (const team of teams) {
        const tMembers = allMembers.filter(m => m.team_id === team.id)
        if (tMembers.length < 4) continue

        const mMetrics = tMembers
          .map(m => userMetrics.get(m.user_id))
          .filter(Boolean) as EntityMetrics[]
        mMetrics.sort((a, b) => (indivScores.get(a.id) || Infinity) - (indivScores.get(b.id) || Infinity))

        const pool = mMetrics.slice(0, 4)
        if (pool.length < 4) continue

        teamEntities.push(aggregatePool(pool, team.id, team.name, scoringWeeks, {
          is_usar: team.is_usar, memberCount: tMembers.length,
        }))

        const avgCompletion = pool.reduce((s, m) => s + m.completionPct, 0) / pool.length
        fValues.set(team.id, avgCompletion)
      }

      results = computeRankings(teamEntities, 'team', scoringWeeks, fValues)
    }

    else if (level === 'unit') {
      const indivResults = computeRankings(Array.from(userMetrics.values()), 'individual', scoringWeeks)
      const indivScores = new Map<string, number>()
      indivResults.forEach(r => indivScores.set(r.entityId, r.totalScore))

      const unitGroups = new Map<string, EntityMetrics[]>()
      userMetrics.forEach(m => {
        const u = m.metadata?.unit as string
        if (!u) return
        if (!unitGroups.has(u)) unitGroups.set(u, [])
        unitGroups.get(u)!.push(m)
      })

      const unitEntities: EntityMetrics[] = []
      const fValues = new Map<string, number>()

      unitGroups.forEach((members, unitName) => {
        if (members.length < 4) return
        const poolSize = getUnitPoolSize(members.length)
        const sorted = [...members].sort((a, b) =>
          (indivScores.get(a.id) || Infinity) - (indivScores.get(b.id) || Infinity)
        )
        const pool = sorted.slice(0, poolSize)
        unitEntities.push(aggregatePool(pool, unitName, unitName, scoringWeeks, {
          memberCount: members.length, poolSize,
          unitCategory: members[0]?.metadata?.unitCategory,
        }))

        const avgCompletion = pool.reduce((s, m) => s + m.completionPct, 0) / pool.length
        const completers = members.filter(m => isComplete({
          cardio: m.totalCardio, strength: m.totalStrength, hiit: m.totalHiit, tmarm: m.totalTmarm,
        })).length
        fValues.set(unitName, avgCompletion + (completers / members.length) * 100)
      })

      results = computeRankings(unitEntities, 'unit', scoringWeeks, fValues)
    }

    else if (level === 'command') {
      const indivResults = computeRankings(Array.from(userMetrics.values()), 'individual', scoringWeeks)
      const indivScores = new Map<string, number>()
      indivResults.forEach(r => indivScores.set(r.entityId, r.totalScore))

      const commands = commandsRes.data || []
      const cmdGroups = new Map<string, { name: string; members: EntityMetrics[] }>()
      commands.forEach(c => cmdGroups.set(c.id, { name: c.name, members: [] }))

      userMetrics.forEach(m => {
        const cid = m.metadata?.commandId as string
        if (cid && cmdGroups.has(cid)) cmdGroups.get(cid)!.members.push(m)
      })

      const cmdEntities: EntityMetrics[] = []
      const fValues = new Map<string, number>()

      cmdGroups.forEach(({ name, members }, cmdId) => {
        if (members.length < 4) return
        const sorted = [...members].sort((a, b) =>
          (indivScores.get(a.id) || Infinity) - (indivScores.get(b.id) || Infinity)
        )
        const pool = sorted.slice(0, 12)
        cmdEntities.push(aggregatePool(pool, cmdId, name, scoringWeeks, { memberCount: members.length }))

        const avgCompletion = pool.reduce((s, m) => s + m.completionPct, 0) / pool.length
        const completers = members.filter(m => isComplete({
          cardio: m.totalCardio, strength: m.totalStrength, hiit: m.totalHiit, tmarm: m.totalTmarm,
        })).length
        fValues.set(cmdId, avgCompletion + (completers / members.length) * 100)
      })

      results = computeRankings(cmdEntities, 'command', scoringWeeks, fValues)
    }

    const totalRanked = results.length

    // ─── FIND ME ───
    // findMe is a user_id — resolve BEFORE search filtering so we always find them
    let foundMe: RankResult | null = null
    if (findMe) {
      foundMe = results.find(r => r.entityId === findMe) || null
    }

    // ─── SEARCH FILTER ───
    // Search filters the FULL ranked results by name (case-insensitive, partial match)
    // Global ranks are preserved from the full computation
    let searchApplied = false
    if (search) {
      searchApplied = true
      const q = search.toLowerCase()
      results = results.filter(r => r.entityName.toLowerCase().includes(q))
    }

    // Apply limit only when not searching (search returns all matches)
    const outputData = searchApplied ? results : results.slice(0, limit)

    return new Response(JSON.stringify({
      level, data: outputData, total: totalRanked,
      searchTotal: searchApplied ? results.length : undefined,
      challengeStart: challengeStart.toISOString(), scoringWeeks,
      foundMe,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error) {
    console.error('Rankings error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})

/*
  DEFIT OML-Style Scoring System
  
  All components are RANKS (lower is better). Total Score = sum of ranks.
  
  COMPONENTS:
  A — Cardio Rank (no cap)
  B — Resistance/Strength Rank (no cap)
  C — HIIT Rank (capped at 45 min/week)
  D — TMAR-M Rank (capped at 60 min/week)
  E — Cumulative Weekly Rank (sum of weekly overall ranks for weeks 1-8)
  F — Completion Metric (Team/Unit/Command only)
  
  INDIVIDUAL:  Total = A + B + C + D + E        | Tie-break: E → A → B → C → D
  TEAM:        Total = A + B + C + D + E + F    | Tie-break: F → E → A → B → C → D
  UNIT:        Total = A + B + C + D + E + F    | Tie-break: F → E → A → B → C → D
  COMMAND:     Total = A + B + C + D + E + F    | Tie-break: F → E → A → B → C → D
  
  POOLS:
  Team: Top 4 members (min 4 required)
  Unit: Top 4 (Small <10), Top 6 (Medium 10-19), Top 8 (Large 20+)
  Command: Top 12
  
  F COMPUTATION:
  Team F_raw = avg completion % of top 4
  Unit F_raw = avg completion % of top N + (completers / total members) * 100
  Command F_raw = avg completion % of top 12 + (completers / total members) * 100
*/
