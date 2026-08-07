// AI-generated workout feedback + next steps for the signed-in participant.
import {
  corsHeaders,
  json,
  serviceClient,
  getCallerId,
  loadActivity,
  describeActivity,
  COACH_SYSTEM_PROMPT,
} from '../_shared/participant-ai.ts';
import { callLovableAi, parseJsonFromModel, AiGatewayError } from '../_shared/lovable-ai.ts';

interface Feedback {
  headline: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  nextSteps: { pillar: string; action: string; target: string }[];
  weekAheadPlan: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = serviceClient();
    const callerId = await getCallerId(req, supabase);
    if (!callerId) return json({ error: 'Authentication required.' }, 401);

    let days = 28;
    try {
      const body = await req.json();
      const parsed = Number(body?.days);
      if (Number.isFinite(parsed)) days = Math.min(Math.max(Math.round(parsed), 7), 90);
    } catch {
      /* defaults are fine */
    }

    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const activity = await loadActivity(supabase, callerId, since);
    const hasLogs =
      activity.hiit.length + activity.tmarm.length + activity.cardio.length + activity.strength.length > 0;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, unit')
      .eq('user_id', callerId)
      .maybeSingle();

    const prompt = `Participant: ${profile?.full_name ?? 'Participant'}${profile?.unit ? ` (${profile.unit})` : ''}.

${describeActivity(activity, `last ${days} days (since ${since})`)}

Give feedback on this training block and concrete next steps.
Respond with JSON only, matching exactly:
{
  "headline": "short punchy line, max 60 characters",
  "summary": "2-3 sentence read on the block",
  "strengths": ["up to 3 short points"],
  "gaps": ["up to 3 short points"],
  "nextSteps": [{"pillar": "HIIT|TMAR-M|Cardio|Resistance", "action": "what to do", "target": "measurable target"}],
  "weekAheadPlan": ["day-by-day suggestions, 3-5 short items"]
}
Include 2-4 nextSteps. Keep every string under 180 characters.${
      hasLogs ? '' : '\nThe participant has no logs in this window — recommend a conservative ramp-up.'
    }`;

    const text = await callLovableAi([
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    const parsed = parseJsonFromModel<Feedback>(text);
    if (!parsed?.headline) {
      return json({ error: 'AI response could not be read. Try again.', raw: text }, 502);
    }

    const clampList = (v: unknown, max: number) =>
      Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max) : [];

    return json({
      windowDays: days,
      hasLogs,
      totals: activity.totals,
      feedback: {
        headline: String(parsed.headline).slice(0, 120),
        summary: String(parsed.summary ?? ''),
        strengths: clampList(parsed.strengths, 3),
        gaps: clampList(parsed.gaps, 3),
        nextSteps: Array.isArray(parsed.nextSteps)
          ? parsed.nextSteps
              .filter((s) => s && typeof s.action === 'string')
              .slice(0, 4)
              .map((s) => ({
                pillar: String(s.pillar ?? 'Training'),
                action: String(s.action),
                target: String(s.target ?? ''),
              }))
          : [],
        weekAheadPlan: clampList(parsed.weekAheadPlan, 5),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AiGatewayError) return json({ error: error.message }, error.status);
    console.error('ai-workout-feedback failed:', error);
    return json({ error: 'Unable to generate feedback right now.' }, 500);
  }
});
