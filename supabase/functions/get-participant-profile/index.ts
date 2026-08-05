import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Kept in sync with get-rankings / get-leaderboard
const HIIT_WEEKLY_CAP = 45
const TMARM_WEEKLY_CAP = 60
const DEFAULT_SCORING_WEEKS = 10
const MINIMUMS = { cardio: 120, strength: 50000, hiit: 480, tmarm: 480 }
const WEIGHTS = { cardio: 0.3, strength: 0.3, hiit: 0.2, tmarm: 0.2 }

type LogRow = Record<string, unknown>

interface HistoryEntry {
  id: string
  pillar: 'cardio' | 'strength' | 'hiit' | 'tmarm'
  date: string
  summary: string
  detail: string | null
  value: number
  unit: string
  verified: boolean
  inWindow: boolean
  weekNumber: number | null
}

function weekIndex(dateStr: string, start: Date): number {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`)
  const diff = d.getTime() - start.getTime()
  if (diff < 0) return -1
  return Math.floor(diff / (7 * 24 * 3600 * 1000))
}

const CARDIO_LABELS: Record<string, string> = {
  run_walk_ruck: 'Run / Walk / Ruck',
  bike: 'Bike',
  swim: 'Swim',
  row_elliptical: 'Row / Elliptical',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    let userId = ''
    let dataset = 'cycle'
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        userId = String(body?.userId ?? '').trim()
        dataset = String(body?.dataset ?? 'cycle')
      } catch {
        /* validated below */
      }
    } else {
      const url = new URL(req.url)
      userId = (url.searchParams.get('userId') ?? '').trim()
      dataset = url.searchParams.get('dataset') ?? 'cycle'
    }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(userId)) {
      return new Response(JSON.stringify({ error: 'A valid participant id is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!['cycle', 'sample'].includes(dataset)) dataset = 'cycle'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const [profileRes, cfgRes, cardioRes, strengthRes, hiitRes, tmarmRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, unit, unit_category').eq('user_id', userId).maybeSingle(),
      supabase.from('challenge_config').select('key, value'),
      supabase.from('cardio_logs')
        .select('id, date, cardio_type, distance, distance_unit, notes, verified')
        .eq('user_id', userId).order('date', { ascending: false }).limit(2000),
      supabase.from('strength_logs')
        .select('id, date, exercise_name, sets, reps_per_set, weight_per_rep, total_weight, notes, verified')
        .eq('user_id', userId).order('date', { ascending: false }).limit(2000),
      supabase.from('hiit_logs')
        .select('id, date, duration, description, verified')
        .eq('user_id', userId).order('date', { ascending: false }).limit(2000),
      supabase.from('tmarm_logs')
        .select('id, date, duration, description, verified')
        .eq('user_id', userId).order('date', { ascending: false }).limit(2000),
    ])

    for (const res of [cardioRes, strengthRes, hiitRes, tmarmRes]) {
      if (res.error) throw res.error
    }

    const cfg: Record<string, string> = {}
    cfgRes.data?.forEach((r: { key: string; value: string }) => { cfg[r.key] = r.value })
    let windowStart = new Date(`${cfg.challenge_start_date || '2027-01-11'}T00:00:00Z`)
    let scoringWeeks = parseInt(cfg.scoring_weeks || String(DEFAULT_SCORING_WEEKS))

    const cardio = (cardioRes.data ?? []) as LogRow[]
    const strength = (strengthRes.data ?? []) as LogRow[]
    const hiit = (hiitRes.data ?? []) as LogRow[]
    const tmarm = (tmarmRes.data ?? []) as LogRow[]

    // Sample mode mirrors get-rankings: window derived from this participant's own logs,
    // Monday-aligned so weekly caps line up with the ranking engine.
    if (dataset === 'sample') {
      const dates = [...cardio, ...strength, ...hiit, ...tmarm]
        .map(l => String(l.date ?? '').slice(0, 10))
        .filter(Boolean)
        .sort()
      if (dates.length > 0) {
        const first = new Date(`${dates[0]}T00:00:00Z`)
        first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7))
        windowStart = first
        const spanMs = new Date(`${dates[dates.length - 1]}T00:00:00Z`).getTime() - first.getTime()
        scoringWeeks = Math.max(1, Math.ceil((spanMs + 1) / (7 * 24 * 3600 * 1000)))
      }
    }

    const windowEnd = new Date(windowStart.getTime() + scoringWeeks * 7 * 24 * 3600 * 1000 - 24 * 3600 * 1000)

    const weekly = {
      cardio: Array(scoringWeeks).fill(0) as number[],
      strength: Array(scoringWeeks).fill(0) as number[],
      hiit: Array(scoringWeeks).fill(0) as number[],
      tmarm: Array(scoringWeeks).fill(0) as number[],
    }

    const history: HistoryEntry[] = []

    const push = (
      pillar: HistoryEntry['pillar'],
      row: LogRow,
      value: number,
      unit: string,
      summary: string,
      detail: string | null
    ) => {
      const date = String(row.date ?? '').slice(0, 10)
      const w = weekIndex(date, windowStart)
      const inWindow = w >= 0 && w < scoringWeeks
      if (inWindow) weekly[pillar][w] += value
      history.push({
        id: String(row.id),
        pillar,
        date,
        summary,
        detail,
        value,
        unit,
        verified: Boolean(row.verified),
        inWindow,
        weekNumber: inWindow ? w + 1 : null,
      })
    }

    cardio.forEach(l => {
      const miles = Number(l.distance) || 0
      push(
        'cardio', l, miles, 'mi',
        CARDIO_LABELS[String(l.cardio_type)] ?? 'Cardio',
        `${miles.toFixed(1)} ${String(l.distance_unit ?? 'mi')}${l.notes ? ` · ${String(l.notes)}` : ''}`
      )
    })
    strength.forEach(l => {
      const lbs = Number(l.total_weight) || 0
      push(
        'strength', l, lbs, 'lbs',
        String(l.exercise_name ?? 'Resistance'),
        `${l.sets ?? 0} × ${l.reps_per_set ?? 0} @ ${Number(l.weight_per_rep) || 0} lbs${l.notes ? ` · ${String(l.notes)}` : ''}`
      )
    })
    hiit.forEach(l => {
      push('hiit', l, Number(l.duration) || 0, 'min', 'HIIT session', (l.description as string) ?? null)
    })
    tmarm.forEach(l => {
      push('tmarm', l, Number(l.duration) || 0, 'min', 'TMAR-M session', (l.description as string) ?? null)
    })

    history.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

    // Weekly caps apply to HIIT and TMAR-M for scoring purposes.
    const cappedHiit = weekly.hiit.map(v => Math.min(v, HIIT_WEEKLY_CAP))
    const cappedTmarm = weekly.tmarm.map(v => Math.min(v, TMARM_WEEKLY_CAP))
    const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)

    const totals = {
      cardio: sum(weekly.cardio),
      strength: sum(weekly.strength),
      hiit: sum(cappedHiit),
      tmarm: sum(cappedTmarm),
    }
    const rawTotals = {
      cardio: sum(weekly.cardio),
      strength: sum(weekly.strength),
      hiit: sum(weekly.hiit),
      tmarm: sum(weekly.tmarm),
    }

    const pct = (v: number, min: number) => Math.min((v / min) * 100, 100)
    const completion = {
      cardio: pct(totals.cardio, MINIMUMS.cardio),
      strength: pct(totals.strength, MINIMUMS.strength),
      hiit: pct(totals.hiit, MINIMUMS.hiit),
      tmarm: pct(totals.tmarm, MINIMUMS.tmarm),
    }
    const overall =
      completion.cardio * WEIGHTS.cardio +
      completion.strength * WEIGHTS.strength +
      completion.hiit * WEIGHTS.hiit +
      completion.tmarm * WEIGHTS.tmarm

    const activeWeeks = Array.from({ length: scoringWeeks }, (_, i) =>
      weekly.cardio[i] > 0 || weekly.strength[i] > 0 || cappedHiit[i] > 0 || cappedTmarm[i] > 0 ? 1 : 0
    ).reduce((s: number, v: number) => s + v, 0)

    return new Response(
      JSON.stringify({
        participant: {
          userId,
          name: (profileRes.data?.full_name as string) || 'Anonymous Soldier',
          unit: (profileRes.data?.unit as string) ?? null,
          unitCategory: (profileRes.data?.unit_category as string) ?? null,
        },
        dataset,
        window: {
          start: windowStart.toISOString().slice(0, 10),
          end: windowEnd.toISOString().slice(0, 10),
          weeks: scoringWeeks,
        },
        minimums: MINIMUMS,
        weights: WEIGHTS,
        weeklyCaps: { hiit: HIIT_WEEKLY_CAP, tmarm: TMARM_WEEKLY_CAP },
        totals,
        rawTotals,
        completion,
        overallCompletion: overall,
        activeWeeks,
        weekly: { cardio: weekly.cardio, strength: weekly.strength, hiit: cappedHiit, tmarm: cappedTmarm },
        history,
        logCounts: {
          total: history.length,
          inWindow: history.filter(h => h.inWindow).length,
          verified: history.filter(h => h.verified).length,
          pending: history.filter(h => !h.verified).length,
        },
        generatedAt: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=900',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Participant profile error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
