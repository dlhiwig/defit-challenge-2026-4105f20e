import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigestItem {
  id: string;
  user_id: string;
  log_id: string;
  log_type: string;
  log_date: string;
  log_details: string;
  previous_status: string;
  new_status: string;
  admin_comment: string | null;
  created_at: string;
}

interface UserDigest {
  userId: string;
  email: string;
  userName: string;
  unit: string;
  items: DigestItem[];
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
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily digest processing...');

    // Get all unprocessed digest items
    const { data: digestItems, error: digestError } = await supabase
      .from('digest_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (digestError) {
      console.error('Error fetching digest queue:', digestError);
      throw digestError;
    }

    if (!digestItems || digestItems.length === 0) {
      console.log('No pending digest items found');
      return new Response(
        JSON.stringify({ success: true, message: 'No digests to send', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${digestItems.length} pending digest items`);

    // Group items by user
    const userItemsMap = new Map<string, DigestItem[]>();
    for (const item of digestItems) {
      const existing = userItemsMap.get(item.user_id) || [];
      existing.push(item);
      userItemsMap.set(item.user_id, existing);
    }

    // Get user info for all users with pending items
    const userIds = Array.from(userItemsMap.keys());
    
    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, unit, notification_mode, email_notifications')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get user emails from auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

    let sentCount = 0;
    let skippedCount = 0;
    const processedIds: string[] = [];

    // Process each user's digest
    for (const [userId, items] of userItemsMap) {
      const profile = profileMap.get(userId);
      const email = userEmailMap.get(userId);

      // Skip if user has disabled notifications or isn't on digest mode
      if (!profile || !email || !profile.email_notifications || profile.notification_mode !== 'digest') {
        console.log(`Skipping user ${userId}: notifications disabled or not on digest mode`);
        skippedCount++;
        // Still mark as processed
        processedIds.push(...items.map(i => i.id));
        continue;
      }

      // Count verified and flagged
      const verifiedCount = items.filter(i => i.new_status === 'verified').length;
      const flaggedCount = items.filter(i => i.new_status === 'flagged').length;

      // Build email content
      const subject = buildSubject(verifiedCount, flaggedCount);
      const html = buildDigestHtml(profile.full_name || 'Participant', profile.unit || 'N/A', items);

      try {
        const emailResponse = await resend.emails.send({
          from: 'DEFIT Challenge <onboarding@resend.dev>',
          to: [email],
          subject: subject,
          html: html,
        });

        console.log(`Digest sent to ${email}:`, emailResponse);

        // Log the email
        await supabase.from('email_logs').insert({
          recipient_user_id: userId,
          recipient_email: email,
          log_id: items[0].log_id, // Use first log ID as reference
          log_type: 'digest',
          notification_type: 'digest',
          status: 'sent',
        });

        sentCount++;
        processedIds.push(...items.map(i => i.id));
      } catch (emailError: any) {
        console.error(`Failed to send digest to ${email}:`, emailError);
        
        // Log the failure
        await supabase.from('email_logs').insert({
          recipient_user_id: userId,
          recipient_email: email,
          log_id: items[0].log_id,
          log_type: 'digest',
          notification_type: 'digest',
          status: 'failed',
          error_message: emailError.message,
        });
      }
    }

    // Mark processed items
    if (processedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('digest_queue')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .in('id', processedIds);

      if (updateError) {
        console.error('Error marking items as processed:', updateError);
      }
    }

    console.log(`Digest processing complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        skipped: skippedCount,
        processed: processedIds.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error in daily digest:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSubject(verifiedCount: number, flaggedCount: number): string {
  const parts: string[] = [];
  if (verifiedCount > 0) parts.push(`${verifiedCount} verified`);
  if (flaggedCount > 0) parts.push(`${flaggedCount} flagged`);
  return `[DEFIT] Daily Status Update — ${parts.join(' / ')}`;
}

function buildDigestHtml(userName: string, unit: string, items: DigestItem[]): string {
  const verifiedItems = items.filter(i => i.new_status === 'verified');
  const flaggedItems = items.filter(i => i.new_status === 'flagged');

  const formatLogType = (type: string) => {
    const types: Record<string, string> = {
      cardio: 'Cardio',
      strength: 'Strength',
      hiit: 'HIIT',
      tmarm: 'TMAR-M',
    };
    return types[type] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = (item: DigestItem, isFlagged: boolean) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-size: 14px;">${formatDate(item.log_date)}</td>
      <td style="padding: 12px; font-size: 14px;">${formatLogType(item.log_type)}</td>
      <td style="padding: 12px; font-size: 14px;">${item.log_details}</td>
      <td style="padding: 12px; font-size: 14px;">
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; ${
          isFlagged 
            ? 'background-color: #fef2f2; color: #dc2626;' 
            : 'background-color: #f0fdf4; color: #16a34a;'
        }">
          ${isFlagged ? '⚠️ Flagged' : '✓ Verified'}
        </span>
      </td>
    </tr>
    ${item.admin_comment ? `
    <tr style="background-color: #fef2f2;">
      <td colspan="4" style="padding: 8px 12px; font-size: 13px; color: #dc2626;">
        <strong>Admin Comment:</strong> ${item.admin_comment}
      </td>
    </tr>
    ` : ''}
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEFIT Daily Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3d4f27 0%, #2d3a1f 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #d4a84b; font-size: 28px; font-weight: 700; letter-spacing: 2px;">DEFIT</h1>
              <p style="margin: 8px 0 0 0; color: #e8dcc8; font-size: 14px;">Daily Status Digest</p>
            </td>
          </tr>

          <!-- User Info -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                <strong>${userName}</strong> · ${unit}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">Status Changes Summary</h2>
              <div style="display: flex; gap: 16px;">
                ${verifiedItems.length > 0 ? `
                <div style="display: inline-block; padding: 12px 20px; background-color: #f0fdf4; border-radius: 8px; margin-right: 12px;">
                  <span style="font-size: 24px; font-weight: 700; color: #16a34a;">${verifiedItems.length}</span>
                  <span style="font-size: 14px; color: #16a34a; margin-left: 8px;">Verified</span>
                </div>
                ` : ''}
                ${flaggedItems.length > 0 ? `
                <div style="display: inline-block; padding: 12px 20px; background-color: #fef2f2; border-radius: 8px;">
                  <span style="font-size: 24px; font-weight: 700; color: #dc2626;">${flaggedItems.length}</span>
                  <span style="font-size: 14px; color: #dc2626; margin-left: 8px;">Flagged</span>
                </div>
                ` : ''}
              </div>
            </td>
          </tr>

          ${flaggedItems.length > 0 ? `
          <!-- Flagged Items (Priority) -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #dc2626;">⚠️ Requires Attention</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden;">
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Date</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Type</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Details</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Status</th>
                  </tr>
                  ${flaggedItems.map(item => renderItem(item, true)).join('')}
                </table>
              </div>
            </td>
          </tr>
          ` : ''}

          ${verifiedItems.length > 0 ? `
          <!-- Verified Items -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #16a34a;">✓ Verified Entries</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 4px; overflow: hidden;">
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Date</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Type</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Details</th>
                  <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Status</th>
                </tr>
                ${verifiedItems.map(item => renderItem(item, false)).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="https://defit.lovable.app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #d4a84b; color: #1f2937; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 14px;">
                View Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-align: center;">
                You're receiving this daily digest because you enabled digest notifications.
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                <a href="https://defit.lovable.app/profile" style="color: #d4a84b;">Manage notification preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
