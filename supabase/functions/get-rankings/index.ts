import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

import {
  DEFAULT_SCORING_WEEKS, DEFAULT_CHALLENGE_START, DEFAULT_CHALLENGE_END, CHALLENGE_CYCLE,
  buildUserMetrics, aggregatePool, computeRankings, isComplete, getUnitPoolSize,
} from '../_shared/scoring-engine.ts'
import type { EntityMetrics, RankResult } from '../_shared/scoring-engine.ts'

// ─── MAIN HANDLER ───

/** Fetch competition logs, optionally restricted to admin-verified entries. */
function logQuery(client: any, table: string, columns: string, verifiedOnly: boolean) {
  const q = client.from(table).select(columns).limit(50000)
  return verifiedOnly ? q.eq('verified', true) : q
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Parse params from URL (GET) or body (POST)
    let level = 'individual', limit = 50, search = '', findMe = '', dataset = 'cycle', adjudication = 'provisional'
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        level = body.level || level
        limit = body.limit || limit
        search = (body.search || '').trim()
        findMe = (body.findMe || '').trim()
        dataset = body.dataset || dataset
        adjudication = body.adjudication || adjudication
      } catch { /* use defaults */ }
    } else {
      const url = new URL(req.url)
      level = url.searchParams.get('level') || level
      limit = parseInt(url.searchParams.get('limit') || '50')
      search = (url.searchParams.get('search') || '').trim()
      findMe = (url.searchParams.get('findMe') || '').trim()
      dataset = url.searchParams.get('dataset') || dataset
      adjudication = url.searchParams.get('adjudication') || adjudication
    }

    if (!['individual', 'team', 'unit', 'command'].includes(level)) {
      return new Response(JSON.stringify({ error: 'Invalid level. Use: individual, team, unit, command' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!['cycle', 'sample'].includes(dataset)) dataset = 'cycle'
    // 'official' counts only admin-verified logs; 'provisional' includes pending logs
    if (!['provisional', 'official'].includes(adjudication)) adjudication = 'provisional'
    const verifiedOnly = adjudication === 'official'

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch config
    const { data: configRows } = await supabase.from('challenge_config').select('key, value')
    const cfg: Record<string, string> = {}
    configRows?.forEach(r => { cfg[r.key] = r.value })
    let challengeStart = new Date(cfg.challenge_start_date || DEFAULT_CHALLENGE_START)
    let scoringWeeks = parseInt(cfg.scoring_weeks || String(DEFAULT_SCORING_WEEKS))
    const challengeEnd = cfg.challenge_end_date || DEFAULT_CHALLENGE_END
    const cycle = cfg.cycle || CHALLENGE_CYCLE


    // Fetch all data in parallel
    const [profilesRes, cardioRes, strengthRes, hiitRes, tmarmRes, teamsRes, membersRes, commandsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, unit, unit_category, command_id').limit(10000),
      logQuery(supabase, 'cardio_logs', 'user_id, date, distance', verifiedOnly),
      logQuery(supabase, 'strength_logs', 'user_id, date, total_weight', verifiedOnly),
      logQuery(supabase, 'hiit_logs', 'user_id, date, duration', verifiedOnly),
      logQuery(supabase, 'tmarm_logs', 'user_id, date, duration', verifiedOnly),
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

    // ─── SAMPLE DATASET MODE ───
    // Preview mode: ignore the configured 2027 window and score every log on record.
    // The window starts at the earliest log (Monday-aligned) and spans all logged weeks.
    let datasetStart: string | null = null
    let datasetEnd: string | null = null
    if (dataset === 'sample') {
      const dates = [
        ...allLogs.cardio, ...allLogs.strength, ...allLogs.hiit, ...allLogs.tmarm,
      ].map(l => String(l.date)).filter(Boolean).sort()
      if (dates.length > 0) {
        datasetStart = dates[0]
        datasetEnd = dates[dates.length - 1]
        const first = new Date(datasetStart + 'T00:00:00Z')
        // Align to the Monday of that week so weekly buckets stay week-aligned
        const dow = first.getUTCDay() // 0=Sun
        const backToMonday = (dow + 6) % 7
        first.setUTCDate(first.getUTCDate() - backToMonday)
        challengeStart = first
        const spanMs = new Date(datasetEnd + 'T00:00:00Z').getTime() - first.getTime()
        scoringWeeks = Math.max(1, Math.ceil((spanMs + 1) / (7 * 24 * 3600 * 1000)))
      }
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
      level, dataset, data: outputData, total: totalRanked,
      searchTotal: searchApplied ? results.length : undefined,
      challengeStart: challengeStart.toISOString(), challengeEnd, cycle, scoringWeeks,
      // provisional = pending logs included (may change after review); official = verified logs only
      adjudication,
      datasetStart, datasetEnd,
      generatedAt: new Date().toISOString(),
      foundMe,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=900',
      },
      status: 200,
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
