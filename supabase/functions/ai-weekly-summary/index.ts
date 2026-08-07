// Weekly AI progress summary: in-app notification for every participant, email when opted in.
// Scheduler-only (CRON_SECRET). Intended to run once a week.
import { Resend } from 'https://esm.sh/resend@2.0.0';
import {
  corsHeaders,
  json,
  serviceClient,
  assertCronSecret,
  loadActivity,
  describeActivity,
  COACH_SYSTEM_PROMPT,
  CHALLENGE_LABEL,
} from '../_shared/participant-ai.ts';
import { callLovableAi, parseJsonFromModel, AiGatewayError } from '../_shared/lovable-ai.ts';

interface WeeklySummary {
  subject: string;
  summary: string;
  wins: string[];
  focusNextWeek: string[];
}

const MAX_PARTICIPANTS = 200;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const denied = assertCronSecret(req);
  if (denied) return denied;

  const supabase = serviceClient();
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const resend = resendKey ? new Resend(resendKey) : null;

  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, unit, email_notifications, in_app_notifications, notify_weekly_summary')
      .limit(MAX_PARTICIPANTS);
    if (error) throw error;

    const { data: authList } = await supabase.auth.admin.listUsers();
    const emailByUser = new Map((authList?.users ?? []).map((u) => [u.id, u.email]));

    let notified = 0;
    let emailed = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const profile of profiles ?? []) {
      try {
        if ((profile as { notify_weekly_summary?: boolean }).notify_weekly_summary === false) {
          skipped++;
          continue;
        }

        const activity = await loadActivity(supabase, profile.user_id, since);
        const logCount =
          activity.hiit.length + activity.tmarm.length + activity.cardio.length + activity.strength.length;
        if (logCount === 0) {
          skipped++;
          continue;
        }

        const text = await callLovableAi(
          [
            { role: 'system', content: COACH_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `${describeActivity(activity, 'the last 7 days')}

Write this participant's weekly ${CHALLENGE_LABEL} progress summary.
Respond with JSON only:
{"subject":"email subject, max 70 chars","summary":"2-3 sentences on the week","wins":["up to 3 short wins"],"focusNextWeek":["2-3 short focus items"]}`,
            },
          ],
          { maxTokens: 1200 },
        );

        const parsed = parseJsonFromModel<WeeklySummary>(text);
        if (!parsed?.summary) {
          failures.push(`${profile.user_id}: unreadable AI response`);
          continue;
        }

        const wins = (parsed.wins ?? []).filter((w) => typeof w === 'string').slice(0, 3);
        const focus = (parsed.focusNextWeek ?? []).filter((w) => typeof w === 'string').slice(0, 3);
        const messageLines = [
          parsed.summary,
          wins.length ? `Wins: ${wins.join('; ')}` : '',
          focus.length ? `Focus next week: ${focus.join('; ')}` : '',
        ].filter(Boolean);

        if (profile.in_app_notifications !== false) {
          const { error: notifyError } = await supabase.from('notifications').insert({
            user_id: profile.user_id,
            type: 'weekly_summary',
            title: String(parsed.subject ?? 'Your weekly progress summary').slice(0, 120),
            message: messageLines.join('\n\n'),
          });
          if (notifyError) throw notifyError;
          notified++;
        }

        const email = emailByUser.get(profile.user_id);
        if (resend && email && profile.email_notifications) {
          const html = buildHtml(profile.full_name ?? 'Participant', parsed.summary, wins, focus);
          try {
            await resend.emails.send({
              from: `${CHALLENGE_LABEL} <onboarding@resend.dev>`,
              to: [email],
              subject: String(parsed.subject ?? `Your ${CHALLENGE_LABEL} week in review`).slice(0, 120),
              html,
            });
            emailed++;
          } catch (mailError) {
            failures.push(`${profile.user_id}: email failed`);
            console.error('weekly summary email failed', mailError);
          }
        }
      } catch (participantError) {
        if (participantError instanceof AiGatewayError && (participantError.status === 402 || participantError.status === 429)) {
          console.error('Stopping weekly summary run:', participantError.message);
          return json(
            { error: participantError.message, notified, emailed, skipped, failures },
            participantError.status,
          );
        }
        console.error(`weekly summary failed for ${profile.user_id}`, participantError);
        failures.push(`${profile.user_id}: ${String(participantError)}`);
      }
    }

    return json({ success: true, notified, emailed, skipped, failures });
  } catch (error) {
    console.error('ai-weekly-summary failed:', error);
    return json({ error: 'Weekly summary run failed.' }, 500);
  }
});

function buildHtml(name: string, summary: string, wins: string[], focus: string[]): string {
  const list = (items: string[]) => items.map((i) => `<li style="margin:4px 0">${escapeHtml(i)}</li>`).join('');
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#1c1f16;font-family:Arial,Helvetica,sans-serif;color:#e8e0cd">
  <div style="max-width:560px;margin:0 auto;background:#242819;border:1px solid #c8a44a33;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c8a44a">${CHALLENGE_LABEL}</p>
    <h1 style="margin:0 0 16px;font-size:22px">Week in review — ${escapeHtml(name)}</h1>
    <p style="line-height:1.6;color:#d8d0bd">${escapeHtml(summary)}</p>
    ${wins.length ? `<h2 style="font-size:15px;color:#c8a44a;margin:20px 0 6px">Wins</h2><ul style="padding-left:18px;color:#d8d0bd">${list(wins)}</ul>` : ''}
    ${focus.length ? `<h2 style="font-size:15px;color:#c8a44a;margin:20px 0 6px">Focus next week</h2><ul style="padding-left:18px;color:#d8d0bd">${list(focus)}</ul>` : ''}
    <p style="margin-top:24px;font-size:12px;color:#9a9482">Generated by AI from your logged sessions. Manage notification settings in your profile.</p>
  </div>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
