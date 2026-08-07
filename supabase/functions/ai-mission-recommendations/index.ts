// AI recommendations for which DEFIT missions/challenges a participant should take on next.
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

interface Recommendation {
  slug: string;
  fitScore: number;
  reason: string;
  startTip: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = serviceClient();
    const callerId = await getCallerId(req, supabase);
    if (!callerId) return json({ error: 'Authentication required.' }, 401);

    let goals = '';
    try {
      const body = await req.json();
      goals = String(body?.goals ?? '').trim().slice(0, 600);
    } catch {
      /* goals are optional */
    }

    const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    const [activity, missionsRes, enrolledRes] = await Promise.all([
      loadActivity(supabase, callerId, since),
      supabase
        .from('missions')
        .select('slug, title, short_description, focus, difficulty, duration_days, duration_weeks')
        .eq('is_published', true)
        .limit(60),
      supabase.from('user_missions').select('mission_id, status').eq('user_id', callerId),
    ]);

    const missions = missionsRes.data ?? [];
    if (missions.length === 0) return json({ recommendations: [], missions: [], note: 'No missions published yet.' });

    const catalog = missions
      .map(
        (m) =>
          `- slug: ${m.slug} | ${m.title} | focus: ${m.focus} | difficulty: ${m.difficulty} | ${
            m.duration_weeks ? `${m.duration_weeks} weeks` : `${m.duration_days} days`
          } | ${m.short_description}`,
      )
      .join('\n');

    const prompt = `${describeActivity(activity, 'last 60 days')}

Stated goals: ${goals || 'not provided — infer from activity'}
Missions already joined: ${enrolledRes.data?.length ?? 0}

Available missions:
${catalog}

Pick the 3 best-fit missions for this participant. Use only slugs from the list above.
Respond with JSON only:
{"recommendations":[{"slug":"exact-slug","fitScore":0-100,"reason":"why it fits, max 200 chars","startTip":"how to start well, max 160 chars"}]}
Order best fit first.`;

    const text = await callLovableAi([
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    const parsed = parseJsonFromModel<{ recommendations: Recommendation[] }>(text);
    const bySlug = new Map(missions.map((m) => [m.slug, m]));
    const recommendations = (parsed?.recommendations ?? [])
      .filter((r) => r && bySlug.has(String(r.slug)))
      .slice(0, 3)
      .map((r) => {
        const mission = bySlug.get(String(r.slug))!;
        return {
          slug: mission.slug,
          title: mission.title,
          focus: mission.focus,
          difficulty: mission.difficulty,
          durationLabel: mission.duration_weeks
            ? `${mission.duration_weeks} week${mission.duration_weeks > 1 ? 's' : ''}`
            : `${mission.duration_days} days`,
          fitScore: Math.min(Math.max(Math.round(Number(r.fitScore) || 0), 0), 100),
          reason: String(r.reason ?? '').slice(0, 300),
          startTip: String(r.startTip ?? '').slice(0, 240),
        };
      });

    if (recommendations.length === 0) {
      return json({ error: 'AI could not match a mission. Try describing your goals differently.' }, 502);
    }

    return json({ recommendations, generatedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof AiGatewayError) return json({ error: error.message }, error.status);
    console.error('ai-mission-recommendations failed:', error);
    return json({ error: 'Unable to generate recommendations right now.' }, 500);
  }
});
