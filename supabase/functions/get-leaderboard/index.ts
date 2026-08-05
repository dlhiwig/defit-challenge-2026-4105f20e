import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Challenge minimums for calculating completion %
const CHALLENGE_MINIMUMS = {
  cardioMiles: 120,
  strengthLbs: 50000,
  hiitMinutes: 480,
  tmarmMinutes: 480,
}

// Weights for overall completion calculation
const COMPLETION_WEIGHTS = {
  cardio: 0.30,    // 30%
  strength: 0.30,  // 30%
  hiit: 0.20,      // 20%
  tmarm: 0.20,     // 20%
}

interface UserStats {
  userId: string
  name: string
  unit: string | null
  cardioMiles: number
  strengthLbs: number
  hiitMinutes: number
  tmarmMinutes: number
  cardioCompletion: number
  strengthCompletion: number
  hiitCompletion: number
  tmarmCompletion: number
  overallCompletion: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching leaderboard data...')

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, unit')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }

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

    // Aggregate stats per user
    const userStatsMap = new Map<string, UserStats>()

    // Initialize with profiles
    profiles?.forEach(profile => {
      userStatsMap.set(profile.user_id, {
        userId: profile.user_id,
        name: profile.full_name || 'Anonymous Soldier',
        unit: profile.unit,
        cardioMiles: 0,
        strengthLbs: 0,
        hiitMinutes: 0,
        tmarmMinutes: 0,
        cardioCompletion: 0,
        strengthCompletion: 0,
        hiitCompletion: 0,
        tmarmCompletion: 0,
        overallCompletion: 0,
      })
    })

    // Aggregate cardio
    cardioRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) {
        stats.cardioMiles += Number(log.distance) || 0
      }
    })

    // Aggregate strength
    strengthRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) {
        stats.strengthLbs += Number(log.total_weight) || 0
      }
    })

    // Aggregate HIIT
    hiitRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) {
        stats.hiitMinutes += log.duration || 0
      }
    })

    // Aggregate TMARM
    tmarmRes.data?.forEach(log => {
      const stats = userStatsMap.get(log.user_id)
      if (stats) {
        stats.tmarmMinutes += log.duration || 0
      }
    })

    // Calculate completion percentages
    userStatsMap.forEach(stats => {
      stats.cardioCompletion = Math.min((stats.cardioMiles / CHALLENGE_MINIMUMS.cardioMiles) * 100, 100)
      stats.strengthCompletion = Math.min((stats.strengthLbs / CHALLENGE_MINIMUMS.strengthLbs) * 100, 100)
      stats.hiitCompletion = Math.min((stats.hiitMinutes / CHALLENGE_MINIMUMS.hiitMinutes) * 100, 100)
      stats.tmarmCompletion = Math.min((stats.tmarmMinutes / CHALLENGE_MINIMUMS.tmarmMinutes) * 100, 100)
      
      // Weighted overall completion
      stats.overallCompletion = 
        (stats.cardioCompletion * COMPLETION_WEIGHTS.cardio) +
        (stats.strengthCompletion * COMPLETION_WEIGHTS.strength) +
        (stats.hiitCompletion * COMPLETION_WEIGHTS.hiit) +
        (stats.tmarmCompletion * COMPLETION_WEIGHTS.tmarm)
    })

    // Convert to array and filter out users with no activity
    const leaderboardData = Array.from(userStatsMap.values())
      .filter(stats => 
        stats.cardioMiles > 0 || 
        stats.strengthLbs > 0 || 
        stats.hiitMinutes > 0 || 
        stats.tmarmMinutes > 0
      )

    // Sort by overall completion (default)
    leaderboardData.sort((a, b) => b.overallCompletion - a.overallCompletion)

    // Assign ranks (handling ties)
    let currentRank = 1
    let previousScore = -1
    const rankedData = leaderboardData.map((stats, index) => {
      if (stats.overallCompletion !== previousScore) {
        currentRank = index + 1
      }
      previousScore = stats.overallCompletion
      return {
        rank: currentRank,
        ...stats,
      }
    })

    console.log(`Returning ${rankedData.length} leaderboard entries`)

    return new Response(
      JSON.stringify({
        data: rankedData,
        challengeMinimums: CHALLENGE_MINIMUMS,
        completionWeights: COMPLETION_WEIGHTS,
        totalParticipants: rankedData.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Leaderboard error:', error)
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
  Leaderboard Calculation Logic:
  
  1. Overall Challenge Completion % = Weighted average of category completions:
     - Cardio: 30% weight (cardioMiles / 120 miles target)
     - Strength: 30% weight (strengthLbs / 50,000 lbs target)
     - HIIT: 20% weight (hiitMinutes / 300 minutes target)
     - TMAR-M: 20% weight (tmarmMinutes / 200 minutes target)
  
  2. Each category is capped at 100% (no extra credit for exceeding minimums)
  
  3. Ranking Rules:
     - Primary sort: Overall Completion % (descending)
     - Tie-breaker: Same rank assigned to tied scores
     - Future: Could add secondary sort by cardio, then strength, then earliest completion date
  
  4. API Response Schema:
     {
       "data": [
         {
           "rank": 1,
           "userId": "uuid",
           "name": "John Doe",
           "unit": "123rd Reserve Unit",
           "cardioMiles": 85.5,
           "strengthLbs": 42000,
           "hiitMinutes": 280,
           "tmarmMinutes": 150,
           "cardioCompletion": 71.25,
           "strengthCompletion": 84.0,
           "hiitCompletion": 93.33,
           "tmarmCompletion": 75.0,
           "overallCompletion": 80.43
         }
       ],
       "challengeMinimums": {...},
       "completionWeights": {...},
       "totalParticipants": 127
     }
*/
