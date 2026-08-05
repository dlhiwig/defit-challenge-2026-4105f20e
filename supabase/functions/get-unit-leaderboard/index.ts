import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Challenge minimums for calculating completion %
const CHALLENGE_MINIMUMS = {
  cardioMiles: 120,
  strengthLbs: 50000,
  hiitMinutes: 300,
  tmarmMinutes: 200,
}

// Weights for overall completion calculation
const COMPLETION_WEIGHTS = {
  cardio: 0.30,
  strength: 0.30,
  hiit: 0.20,
  tmarm: 0.20,
}

// Minimum members required for unit to appear on leaderboard
const MIN_PARTICIPATING_MEMBERS = 1

const UNIT_CATEGORY_LABELS: Record<string, string> = {
  veterans: 'Veterans',
  government: 'Government Employees',
  military_family: 'Military Family',
  civilian: 'Civilian',
  other: 'Other',
}

interface MemberStats {
  cardioMiles: number
  strengthLbs: number
  hiitMinutes: number
  tmarmMinutes: number
}

interface UnitStats {
  unitName: string
  unitCategory: string
  unitCategoryLabel: string
  memberCount: number
  totalCardioMiles: number
  totalStrengthLbs: number
  totalHiitMinutes: number
  totalTmarmMinutes: number
  avgCardioMiles: number
  avgStrengthLbs: number
  avgHiitMinutes: number
  avgTmarmMinutes: number
  cardioCompletion: number
  strengthCompletion: number
  hiitCompletion: number
  tmarmCompletion: number
  overallCompletion: number
  members: Array<{ userId: string; name: string; overallCompletion: number }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching unit leaderboard data...')

    // Fetch all profiles with unit info
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, unit, unit_category')
      .not('unit', 'is', null)

    if (profilesError) throw profilesError

    // Fetch all workout logs
    const [cardioRes, strengthRes, hiitRes, tmarmRes] = await Promise.all([
      supabase.from('cardio_logs').select('user_id, distance'),
      supabase.from('strength_logs').select('user_id, total_weight'),
      supabase.from('hiit_logs').select('user_id, duration'),
      supabase.from('tmarm_logs').select('user_id, duration'),
    ])

    if (cardioRes.error) throw cardioRes.error
    if (strengthRes.error) throw strengthRes.error
    if (hiitRes.error) throw hiitRes.error
    if (tmarmRes.error) throw tmarmRes.error

    // Build user stats map
    const userStatsMap = new Map<string, MemberStats>()
    
    profiles?.forEach(profile => {
      userStatsMap.set(profile.user_id, {
        cardioMiles: 0,
        strengthLbs: 0,
        hiitMinutes: 0,
        tmarmMinutes: 0,
      })
    })

    cardioRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) stats.cardioMiles += Number(log.distance) || 0
    })

    strengthRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) stats.strengthLbs += Number(log.total_weight) || 0
    })

    hiitRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) stats.hiitMinutes += log.duration || 0
    })

    tmarmRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) stats.tmarmMinutes += log.duration || 0
    })

    // Calculate individual completion percentages
    const calculateCompletion = (stats: MemberStats) => {
      const cardio = Math.min((stats.cardioMiles / CHALLENGE_MINIMUMS.cardioMiles) * 100, 100)
      const strength = Math.min((stats.strengthLbs / CHALLENGE_MINIMUMS.strengthLbs) * 100, 100)
      const hiit = Math.min((stats.hiitMinutes / CHALLENGE_MINIMUMS.hiitMinutes) * 100, 100)
      const tmarm = Math.min((stats.tmarmMinutes / CHALLENGE_MINIMUMS.tmarmMinutes) * 100, 100)
      const overall = (cardio * COMPLETION_WEIGHTS.cardio) +
                      (strength * COMPLETION_WEIGHTS.strength) +
                      (hiit * COMPLETION_WEIGHTS.hiit) +
                      (tmarm * COMPLETION_WEIGHTS.tmarm)
      return { cardio, strength, hiit, tmarm, overall }
    }

    // Aggregate by unit
    const unitMap = new Map<string, UnitStats>()

    profiles?.forEach(profile => {
      if (!profile.unit) return
      
      const userStats = userStatsMap.get(profile.user_id)
      if (!userStats) return

      // Only count members with at least some activity
      const hasActivity = userStats.cardioMiles > 0 || userStats.strengthLbs > 0 || 
                         userStats.hiitMinutes > 0 || userStats.tmarmMinutes > 0
      if (!hasActivity) return

      const completion = calculateCompletion(userStats)
      
      if (!unitMap.has(profile.unit)) {
        unitMap.set(profile.unit, {
          unitName: profile.unit,
          unitCategory: profile.unit_category || 'other',
          unitCategoryLabel: UNIT_CATEGORY_LABELS[profile.unit_category || 'other'] || 'Other',
          memberCount: 0,
          totalCardioMiles: 0,
          totalStrengthLbs: 0,
          totalHiitMinutes: 0,
          totalTmarmMinutes: 0,
          avgCardioMiles: 0,
          avgStrengthLbs: 0,
          avgHiitMinutes: 0,
          avgTmarmMinutes: 0,
          cardioCompletion: 0,
          strengthCompletion: 0,
          hiitCompletion: 0,
          tmarmCompletion: 0,
          overallCompletion: 0,
          members: [],
        })
      }

      const unit = unitMap.get(profile.unit)!
      unit.memberCount += 1
      unit.totalCardioMiles += userStats.cardioMiles
      unit.totalStrengthLbs += userStats.strengthLbs
      unit.totalHiitMinutes += userStats.hiitMinutes
      unit.totalTmarmMinutes += userStats.tmarmMinutes
      unit.members.push({
        userId: profile.user_id,
        name: profile.full_name || 'Anonymous Soldier',
        overallCompletion: completion.overall,
      })
    })

    // Calculate unit averages and completion
    unitMap.forEach(unit => {
      if (unit.memberCount > 0) {
        unit.avgCardioMiles = unit.totalCardioMiles / unit.memberCount
        unit.avgStrengthLbs = unit.totalStrengthLbs / unit.memberCount
        unit.avgHiitMinutes = unit.totalHiitMinutes / unit.memberCount
        unit.avgTmarmMinutes = unit.totalTmarmMinutes / unit.memberCount

        // Unit completion is based on average member progress
        unit.cardioCompletion = Math.min((unit.avgCardioMiles / CHALLENGE_MINIMUMS.cardioMiles) * 100, 100)
        unit.strengthCompletion = Math.min((unit.avgStrengthLbs / CHALLENGE_MINIMUMS.strengthLbs) * 100, 100)
        unit.hiitCompletion = Math.min((unit.avgHiitMinutes / CHALLENGE_MINIMUMS.hiitMinutes) * 100, 100)
        unit.tmarmCompletion = Math.min((unit.avgTmarmMinutes / CHALLENGE_MINIMUMS.tmarmMinutes) * 100, 100)
        unit.overallCompletion = (unit.cardioCompletion * COMPLETION_WEIGHTS.cardio) +
                                 (unit.strengthCompletion * COMPLETION_WEIGHTS.strength) +
                                 (unit.hiitCompletion * COMPLETION_WEIGHTS.hiit) +
                                 (unit.tmarmCompletion * COMPLETION_WEIGHTS.tmarm)

        // Sort members by completion
        unit.members.sort((a, b) => b.overallCompletion - a.overallCompletion)
      }
    })

    // Filter units by minimum participation
    const qualifiedUnits = Array.from(unitMap.values())
      .filter(unit => unit.memberCount >= MIN_PARTICIPATING_MEMBERS)

    // Sort by overall completion
    qualifiedUnits.sort((a, b) => b.overallCompletion - a.overallCompletion)

    // Assign ranks
    let currentRank = 1
    let previousScore = -1
    const rankedUnits = qualifiedUnits.map((unit, index) => {
      if (unit.overallCompletion !== previousScore) {
        currentRank = index + 1
      }
      previousScore = unit.overallCompletion
      return { rank: currentRank, ...unit }
    })

    console.log(`Returning ${rankedUnits.length} unit entries`)

    return new Response(
      JSON.stringify({
        data: rankedUnits,
        challengeMinimums: CHALLENGE_MINIMUMS,
        completionWeights: COMPLETION_WEIGHTS,
        minParticipation: MIN_PARTICIPATING_MEMBERS,
        totalUnits: rankedUnits.length,
        challengeRound: 'DEFIT 2027 (11 Jan - 21 Mar)',
        snapshotDate: new Date().toISOString(),
        categoryLabels: UNIT_CATEGORY_LABELS,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Unit leaderboard error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/*
  Unit Leaderboard Aggregation Logic:

  1. Member Qualification:
     - Only members with at least one logged activity are counted
     - Members must have a non-null unit assigned in their profile

  2. Unit Aggregation:
     - Total metrics = sum of all qualifying member metrics
     - Average metrics = total / member count
     - Unit completion % is based on AVERAGE member progress (not totals)
       This ensures fairness between large and small units

  3. Unit Completion Calculation:
     - Same weighted formula as individual:
       Cardio 30% + Strength 30% + HIIT 20% + TMAR-M 20%
     - Based on average per-member progress toward individual minimums

  4. Minimum Participation Threshold:
     - Units must have at least MIN_PARTICIPATING_MEMBERS (default: 1)
     - Increase this value to exclude small/inactive units

  5. Ranking Rules:
     - Primary sort: Overall Completion % (descending)
     - Tied scores receive same rank
     - Future: Could add tie-breakers (total members, total cardio, etc.)

  6. API Response Schema:
     {
       "data": [
         {
           "rank": 1,
           "unitName": "123rd Reserve Unit",
           "unitCategory": "veterans",
           "unitCategoryLabel": "Veterans",
           "memberCount": 15,
           "totalCardioMiles": 450.5,
           "totalStrengthLbs": 325000,
           "avgCardioMiles": 30.03,
           "avgStrengthLbs": 21666.67,
           "overallCompletion": 72.5,
           "members": [{ "userId": "...", "name": "...", "overallCompletion": 85 }]
         }
       ],
       "challengeRound": "DEFIT 2027 (11 Jan - 21 Mar)",
       "snapshotDate": "2026-02-15T12:00:00Z",
       "totalUnits": 12
     }
*/
