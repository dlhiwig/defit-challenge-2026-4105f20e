// Shared helpers for participant-facing AI edge functions.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

export const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** Verifies the caller's JWT and returns their user id, or null. */
export async function getCallerId(req: Request, supabase: SupabaseClient): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const { data, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !data?.user) return null;
  return data.user.id;
}

export function assertCronSecret(req: Request): Response | null {
  const expected = Deno.env.get('CRON_SECRET');
  if (!expected) return json({ error: 'Scheduler secret not configured' }, 503);
  const provided =
    req.headers.get('x-cron-secret') ??
    (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (provided !== expected) return json({ error: 'Unauthorized' }, 401);
  return null;
}

export const CHALLENGE_MINIMUMS = { hiit: 480, tmarm: 480, cardioMiles: 120, strengthLbs: 50000 };
export const CHALLENGE_LABEL = 'DEFIT 2027';
export const CHALLENGE_RANGE = '11 Jan – 21 Mar 2027';

export interface MinuteLog {
  date: string;
  duration: number;
  description: string | null;
  verified: boolean;
}

export interface ActivitySnapshot {
  hiit: MinuteLog[];
  tmarm: MinuteLog[];
  cardio: { date: string; cardio_type: string; distance: number; verified: boolean }[];
  strength: { date: string; exercise_name: string; total_weight: number; verified: boolean }[];
  totals: { hiitMinutes: number; tmarmMinutes: number; cardioMiles: number; strengthLbs: number };
  recentDaysActive: number;
  longestGapDays: number;
}

/** Loads a participant's logs since `sinceIso` and derives simple aggregates. */
export async function loadActivity(
  supabase: SupabaseClient,
  userId: string,
  sinceIso: string,
): Promise<ActivitySnapshot> {
  const [hiitRes, tmarmRes, cardioRes, strengthRes] = await Promise.all([
    supabase.from('hiit_logs').select('date, duration, description, verified')
      .eq('user_id', userId).gte('date', sinceIso).order('date', { ascending: false }).limit(200),
    supabase.from('tmarm_logs').select('date, duration, description, verified')
      .eq('user_id', userId).gte('date', sinceIso).order('date', { ascending: false }).limit(200),
    supabase.from('cardio_logs').select('date, cardio_type, distance, verified')
      .eq('user_id', userId).gte('date', sinceIso).order('date', { ascending: false }).limit(200),
    supabase.from('strength_logs').select('date, exercise_name, total_weight, verified')
      .eq('user_id', userId).gte('date', sinceIso).order('date', { ascending: false }).limit(200),
  ]);

  const hiit = (hiitRes.data ?? []) as MinuteLog[];
  const tmarm = (tmarmRes.data ?? []) as MinuteLog[];
  const cardio = (cardioRes.data ?? []) as ActivitySnapshot['cardio'];
  const strength = (strengthRes.data ?? []) as ActivitySnapshot['strength'];

  const sum = (arr: { duration?: number }[]) => arr.reduce((s, l) => s + (Number(l.duration) || 0), 0);
  const dates = [...hiit, ...tmarm, ...cardio, ...strength]
    .map((l) => String(l.date ?? '').slice(0, 10))
    .filter(Boolean)
    .sort();
  const uniqueDates = Array.from(new Set(dates));
  let longestGapDays = 0;
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap =
      (new Date(`${uniqueDates[i]}T00:00:00Z`).getTime() -
        new Date(`${uniqueDates[i - 1]}T00:00:00Z`).getTime()) /
      86400000;
    if (gap > longestGapDays) longestGapDays = Math.round(gap);
  }

  return {
    hiit,
    tmarm,
    cardio,
    strength,
    totals: {
      hiitMinutes: sum(hiit),
      tmarmMinutes: sum(tmarm),
      cardioMiles: cardio.reduce((s, l) => s + (Number(l.distance) || 0), 0),
      strengthLbs: strength.reduce((s, l) => s + (Number(l.total_weight) || 0), 0),
    },
    recentDaysActive: uniqueDates.length,
    longestGapDays,
  };
}

/** Compact, token-friendly text description of a participant's activity. */
export function describeActivity(a: ActivitySnapshot, windowLabel: string): string {
  const line = (l: MinuteLog) =>
    `- ${l.date}: ${l.duration} min${l.description ? ` (${l.description})` : ''}${l.verified ? ' [verified]' : ' [pending]'}`;
  return [
    `Window: ${windowLabel}`,
    `Totals in window — HIIT ${a.totals.hiitMinutes} min, TMAR-M ${a.totals.tmarmMinutes} min, cardio ${a.totals.cardioMiles.toFixed(1)} mi, resistance ${Math.round(a.totals.strengthLbs)} lbs.`,
    `Distinct training days: ${a.recentDaysActive}. Longest gap between sessions: ${a.longestGapDays} days.`,
    `Cycle minimums: HIIT ${CHALLENGE_MINIMUMS.hiit} min, TMAR-M ${CHALLENGE_MINIMUMS.tmarm} min, cardio ${CHALLENGE_MINIMUMS.cardioMiles} mi, resistance ${CHALLENGE_MINIMUMS.strengthLbs} lbs.`,
    '',
    'HIIT sessions:',
    a.hiit.slice(0, 20).map(line).join('\n') || '- none',
    '',
    'TMAR-M sessions:',
    a.tmarm.slice(0, 20).map(line).join('\n') || '- none',
    '',
    'Cardio sessions:',
    a.cardio.slice(0, 15).map((l) => `- ${l.date}: ${l.cardio_type} ${l.distance} mi`).join('\n') || '- none',
    '',
    'Resistance sessions:',
    a.strength.slice(0, 15).map((l) => `- ${l.date}: ${l.exercise_name} ${Math.round(l.total_weight)} lbs total`).join('\n') || '- none',
  ].join('\n');
}

export const COACH_SYSTEM_PROMPT = `You are the ${CHALLENGE_LABEL} H2F coach for U.S. Army Reserve soldiers and DEFIT participants.
The challenge runs ${CHALLENGE_RANGE} across four pillars: HIIT, TMAR-M (tactical mobility, active recovery, mindfulness), cardio miles, and resistance volume.
Be direct, encouraging, and specific. Use plain language, no emojis, no medical claims, no diagnosis.
Never invent logs the participant did not record. If data is sparse, say so and recommend a simple starting plan.`;
