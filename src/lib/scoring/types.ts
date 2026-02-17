/** OML-style rank entry returned by the get-rankings edge function. */
export interface RankEntry {
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
  rawValues: {
    cardio: number
    strength: number
    hiit: number
    tmarm: number
    eRaw: number
    completionPct: number
    fRaw?: number
  }
  metadata?: {
    unit?: string
    unitCategory?: string
    memberCount?: number
    poolSize?: number
    is_usar?: boolean
    commandId?: string
  }
}

export interface RankingsResponse {
  level: RankingLevel
  data: RankEntry[]
  total: number
  challengeStart: string
  scoringWeeks: number
}

export type RankingLevel = 'individual' | 'team' | 'unit' | 'command'

export const RANKING_LEVELS: { value: RankingLevel; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'team', label: 'Team' },
  { value: 'unit', label: 'Unit (UIC)' },
  { value: 'command', label: 'Command' },
]

/** Component labels for display. */
export const COMPONENT_LABELS: Record<string, string> = {
  A: 'Cardio',
  B: 'Resistance',
  C: 'HIIT',
  D: 'TMAR-M',
  E: 'Weekly Consistency',
  F: 'Completion',
}

/** Tie-break orders by level. */
export const TIE_BREAK_ORDER: Record<RankingLevel, string[]> = {
  individual: ['E', 'A', 'B', 'C', 'D'],
  team: ['F', 'E', 'A', 'B', 'C', 'D'],
  unit: ['F', 'E', 'A', 'B', 'C', 'D'],
  command: ['F', 'E', 'A', 'B', 'C', 'D'],
}
