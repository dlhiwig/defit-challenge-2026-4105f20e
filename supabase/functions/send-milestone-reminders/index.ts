import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CYCLE = 'DEFIT2027';
const FROM = 'DEFIT Challenge <noreply@defit.work>';
// Send a reminder when a milestone is this many days out (or closer).
const LEAD_DAYS = 7;

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  milestone_date: string;
}

interface Registration {
  id: string;
  full_name: string;
  email: string;
}

function buildHtml(announcement: Announcement, name: string, daysOut: number) {
  const when = new Date(`${announcement.milestone_date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const timing =
    daysOut <= 0 ? 'is today' : daysOut === 1 ? 'is tomorrow' : `is in ${daysOut} days`;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#ffffff; padding:24px; color:#2b2b23;">
      <div style="max-width:560px; margin:0 auto; border:1px solid #d8cfae; border-radius:12px; padding:28px;">
        <p style="margin:0 0 4px; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#8a7a3d;">
          DEFIT 2027 &middot; 11 Jan &ndash; 21 Mar 2027
        </p>
        <h1 style="margin:0 0 16px; font-size:22px; color:#3b3f26;">${announcement.title}</h1>
        <p style="margin:0 0 12px; font-size:15px;">${name ? `${name},` : 'Soldier,'}</p>
        <p style="margin:0 0 12px; font-size:15px;">
          This milestone ${timing} (<strong>${when}</strong>).
        </p>
        <p style="margin:0 0 20px; font-size:15px; line-height:1.5;">${announcement.body}</p>
        <p style="margin:0 0 24px; font-size:14px; color:#5c5a45;">
          Remember: HIIT and TMAR-M each require <strong>480 minutes</strong> across the 10-week cycle
          (about 48 minutes per week). Logs stay Pending until a USARC admin verifies them.
        </p>
        <a href="https://defit.work/dashboard/progress"
           style="display:inline-block; background-color:#8a7a3d; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-size:14px;">
          Open your progress tracker
        </a>
        <p style="margin:24px 0 0; font-size:12px; color:#8b8878;">
          You receive DEFIT milestone reminders because you opted in during registration.
        </p>
      </div>
    </div>
  `;
}

const CRON_GUARD_HEADERS = { 'Content-Type': 'application/json' };
function assertCronSecret(req: Request): Response | null {
  const expected = Deno.env.get('CRON_SECRET');
  if (!expected) {
    return new Response(JSON.stringify({ error: 'Scheduler secret not configured' }), {
      status: 503,
      headers: { ...corsHeaders, ...CRON_GUARD_HEADERS },
    });
  }
  const provided =
    req.headers.get('x-cron-secret') ??
    (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, ...CRON_GUARD_HEADERS },
    });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cronDenied = assertCronSecret(req);
  if (cronDenied) return cronDenied;

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(resendApiKey);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const windowEnd = new Date(today.getTime() + LEAD_DAYS * 86400000)
      .toISOString()
      .split('T')[0];

    const { data: announcements, error: annError } = await supabase
      .from('announcements')
      .select('id, title, body, category, milestone_date')
      .eq('cycle', CYCLE)
      .eq('is_published', true)
      .not('milestone_date', 'is', null)
      .gte('milestone_date', todayStr)
      .lte('milestone_date', windowEnd)
      .order('milestone_date', { ascending: true });

    if (annError) throw annError;

    if (!announcements || announcements.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No upcoming milestones in window', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: registrations, error: regError } = await supabase
      .from('defit_registrations')
      .select('id, full_name, email')
      .eq('cycle', CYCLE)
      .eq('email_reminders', true)
      .eq('status', 'registered');

    if (regError) throw regError;

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No opted-in registrations', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const announcementIds = (announcements as Announcement[]).map((a) => a.id);
    const { data: alreadySent } = await supabase
      .from('milestone_reminder_log')
      .select('registration_id, announcement_id')
      .in('announcement_id', announcementIds);

    const sentKeys = new Set(
      (alreadySent ?? []).map((row) => `${row.registration_id}:${row.announcement_id}`)
    );

    let sent = 0;
    let failed = 0;

    for (const announcement of announcements as Announcement[]) {
      const daysOut = Math.round(
        (new Date(`${announcement.milestone_date}T12:00:00Z`).getTime() - today.getTime()) / 86400000
      );

      for (const registration of registrations as Registration[]) {
        const key = `${registration.id}:${announcement.id}`;
        if (sentKeys.has(key)) continue;

        const firstName = (registration.full_name || '').split(' ')[0] ?? '';

        try {
          await resend.emails.send({
            from: FROM,
            to: [registration.email],
            subject: `DEFIT 2027 reminder: ${announcement.title}`,
            html: buildHtml(announcement, firstName, daysOut),
          });

          await supabase.from('milestone_reminder_log').insert({
            registration_id: registration.id,
            announcement_id: announcement.id,
            recipient_email: registration.email,
            status: 'sent',
          });

          sentKeys.add(key);
          sent++;
        } catch (err) {
          failed++;
          console.error(`Reminder failed for ${registration.email}:`, err);
          await supabase.from('milestone_reminder_log').insert({
            registration_id: registration.id,
            announcement_id: announcement.id,
            recipient_email: registration.email,
            status: 'failed',
            error_message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    console.log(`Milestone reminders complete. sent=${sent} failed=${failed}`);

    return new Response(JSON.stringify({ success: true, sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-milestone-reminders error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
