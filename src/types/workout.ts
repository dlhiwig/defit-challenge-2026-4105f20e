// Workout Types for DEFIT Challenge

export type CardioType = 'run_walk_ruck' | 'bike' | 'swim' | 'row_elliptical';

export interface CardioLog {
  id: string;
  date: Date;
  type: CardioType;
  distance: number; // canonical miles (server-computed)
  distanceUnit: 'miles' | 'meters'; // unit the participant entered
  originalDistance?: number; // value as entered, in `distanceUnit`
  notes?: string;
  verified?: boolean;
  createdAt: Date;
}

export interface StrengthLog {
  id: string;
  date: Date;
  exerciseName: string;
  sets: number;
  repsPerSet: number;
  weightPerRep: number; // lbs
  totalWeight: number; // weight × reps × sets
  notes?: string;
  verified?: boolean;
  createdAt: Date;
}

export interface HIITLog {
  id: string;
  date: Date;
  duration: number; // minutes
  description?: string;
  verified?: boolean;
  createdAt: Date;
}

export interface TMARMLog {
  id: string;
  date: Date;
  duration: number; // minutes
  description?: string;
  verified?: boolean;
  createdAt: Date;
}

export interface WorkoutTotals {
  cardioMiles: number;
  strengthLbs: number;
  hiitMinutes: number;
  tmarmMinutes: number;
}

// Official DEFIT 2027 completer minimums (11 Jan – 21 Mar 2027)
export const CHALLENGE_MINIMUMS: WorkoutTotals = {
  cardioMiles: 120,      // 12 cardio miles per week average
  strengthLbs: 50000,    // Total lbs volume lifted
  hiitMinutes: 480,      // 48 min/week average
  tmarmMinutes: 480,     // 48 min/week average
};

export const CARDIO_TYPE_LABELS: Record<CardioType, string> = {
  run_walk_ruck: 'Run/Walk/Ruck',
  bike: 'Bike',
  swim: 'Swim',
  row_elliptical: 'Row/Elliptical',
};

// Utility: Convert meters to miles
export const metersToMiles = (meters: number): number => {
  return meters * 0.000621371;
};

// Generate unique ID (kept for local fallback)
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
