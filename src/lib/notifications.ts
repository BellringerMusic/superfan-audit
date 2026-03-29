/**
 * Lead notification emails via Resend.
 *
 * Sends a notification to bellringerproductions@gmail.com whenever a new
 * lead submits the Superfan Audit form so you never miss a sign-up.
 *
 * All captured email subscribers are stored in ConvertKit (Kit).
 * Manage subscribers at: https://app.kit.com
 */

const NOTIFICATION_TO = 'bellringerproductions@gmail.com';

interface LeadNotificationParams {
  email: string;
  artistName: string;
  name: string;
  monthlyIncome?: string;
}

export async function sendLeadNotification(params: LeadNotificationParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[notifications] RESEND_API_KEY not configured — skipping lead notification');
    return false;
  }

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const incomeRow = params.monthlyIncome
    ? `<tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;">Monthly Income</td>
        <td style="padding:8px 12px;font-size:14px;">${escapeHtml(params.monthlyIncome)}</td>
      </tr>`
    : '';

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#ffffff;font-size:18px;">New Superfan Audit Lead</h2>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;">Artist Name</td>
        <td style="padding:8px 12px;font-size:14px;font-weight:600;">${escapeHtml(params.artistName)}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;">Email</td>
        <td style="padding:8px 12px;font-size:14px;">
          <a href="mailto:${escapeHtml(params.email)}" style="color:#7c3aed;">${escapeHtml(params.email)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;">Name</td>
        <td style="padding:8px 12px;font-size:14px;">${escapeHtml(params.name)}</td>
      </tr>
      ${incomeRow}
      <tr style="background:#f9fafb;">
        <td style="padding:8px 12px;color:#6b7280;font-size:14px;">Submitted</td>
        <td style="padding:8px 12px;font-size:14px;">${timestamp}</td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 12px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      This lead has been added to your
      <a href="https://app.kit.com" style="color:#7c3aed;">Kit (ConvertKit)</a>
      subscriber list automatically.
    </p>
  </div>
</div>`.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Superfan Audit <onboarding@resend.dev>',
        to: [NOTIFICATION_TO],
        subject: `New lead: ${params.artistName}`,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('[notifications] Resend API error:', error);
      return false;
    }

    console.log(`[notifications] Lead notification sent for ${params.email}`);
    return true;
  } catch (error) {
    console.error('[notifications] Failed to send lead notification:', error);
    return false;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
