/**
 * Lead notification emails via Resend.
 *
 * Two notifications go to bellringerproductions@gmail.com:
 *   1. sendLeadNotification — fires the moment someone submits the form
 *      (so a lead is never lost even if the scanner pipeline errors).
 *   2. sendFullReportNotification — fires after the scan completes and
 *      includes EVERY input the user entered plus EVERY number the
 *      audit produced (scores, platform metrics, superfan signals,
 *      recommended offer, action items, benchmark comparison).
 *
 * All captured email subscribers are also stored in ConvertKit (Kit).
 * Manage subscribers at: https://app.kit.com
 */

import { AuditFormData, AuditResult } from '@/types/audit';

const NOTIFICATION_TO = 'bellringerproductions@gmail.com';
const FROM = 'Superfan Audit <onboarding@resend.dev>';

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

  const timestamp = formatTimestamp();

  const incomeRow = params.monthlyIncome
    ? row('Monthly Income', escapeHtml(params.monthlyIncome))
    : '';

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#ffffff;font-size:18px;">New Superfan Audit Lead</h2>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;">
      ${row('Artist Name', `<strong>${escapeHtml(params.artistName)}</strong>`, true)}
      ${row('Email', `<a href="mailto:${escapeHtml(params.email)}" style="color:#7c3aed;">${escapeHtml(params.email)}</a>`)}
      ${row('Name', escapeHtml(params.name), true)}
      ${incomeRow}
      ${row('Submitted', timestamp)}
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 12px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Lead added to <a href="https://app.kit.com" style="color:#7c3aed;">Kit (ConvertKit)</a>.
      Full scan results will arrive in a follow-up email once the audit finishes.
    </p>
  </div>
</div>`.trim();

  return await sendEmail({
    apiKey,
    subject: `New lead: ${params.artistName}`,
    html,
  });
}

interface FullReportParams {
  formData: AuditFormData;
  result: AuditResult;
}

export async function sendFullReportNotification(params: FullReportParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[notifications] RESEND_API_KEY not configured — skipping full-report notification');
    return false;
  }

  const { formData, result } = params;

  const inputsTable = `
    <table style="width:100%;border-collapse:collapse;">
      ${row('Artist / Band', `<strong>${escapeHtml(formData.artistName)}</strong>`, true)}
      ${row('Real Name', escapeHtml(formData.name))}
      ${row('Email', `<a href="mailto:${escapeHtml(formData.email)}" style="color:#7c3aed;">${escapeHtml(formData.email)}</a>`, true)}
      ${row('Genre', escapeHtml(formData.genre))}
      ${row('Monthly Income', escapeHtml(formData.monthlyIncome), true)}
      ${row('Years Active', escapeHtml(formData.yearsActive))}
      ${row('Spotify URL', formatLink(formData.spotifyUrl), true)}
      ${row('YouTube URL', formatLink(formData.youtubeUrl))}
      ${row('Instagram', escapeHtml(formData.instagramHandle || '—'), true)}
      ${formData.instagramFollowers ? row('Instagram Followers (self-reported)', escapeHtml(formData.instagramFollowers)) : ''}
      ${row('TikTok', escapeHtml(formData.tiktokHandle || '—'), !formData.instagramFollowers)}
      ${row('Website', formatLink(formData.websiteUrl))}
      ${row('Submitted', formatTimestamp(), true)}
    </table>`;

  const sb = result.scoreBreakdown;
  const scoresTable = `
    <table style="width:100%;border-collapse:collapse;">
      ${row('TOTAL Audience Strength', `<strong style="font-size:18px;color:#7c3aed;">${sb.total} / 100</strong>`, true)}
      ${row('YouTube', `${sb.youtube} / 35`)}
      ${row('Spotify', `${sb.spotify} / 25`, true)}
      ${row('Cross-Platform', `${sb.crossPlatform} / 20`)}
      ${row('Web Presence', `${sb.webPresence} / 10`, true)}
      ${row('Social (IG + TikTok)', `${sb.social} / 10`)}
    </table>`;

  const platformBlocks = result.platformBreakdowns.map((p) => {
    const metricsRows = Object.entries(p.metrics)
      .map(([k, v], i) => row(formatKey(k), escapeHtml(String(v)), i % 2 === 1))
      .join('');
    return `
      <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:#f3f4f6;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
          <strong style="color:#111827;font-size:14px;">${escapeHtml(p.icon)} ${escapeHtml(p.platform)}</strong>
          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;background:${ratingBg(p.strengthRating)};color:${ratingFg(p.strengthRating)};">${escapeHtml(p.strengthRating)}</span>
        </div>
        <div style="padding:0 14px;">
          <table style="width:100%;border-collapse:collapse;">${metricsRows || row('(no metrics returned)', '—')}</table>
        </div>
        <div style="padding:10px 14px;background:#fafafa;border-top:1px solid #e5e7eb;font-size:13px;color:#374151;">
          ${escapeHtml(p.insight)}
        </div>
        <div style="padding:6px 14px;background:#fafafa;border-top:1px solid #f3f4f6;font-size:12px;color:#6b7280;">
          Platform score: <strong>${p.score}</strong>
        </div>
      </div>`;
  }).join('');

  const sa = result.superfanAnalysis;
  const indicatorsList = sa.keyIndicators
    .map((k) => `<li style="margin:4px 0;color:#374151;font-size:13px;">${escapeHtml(k)}</li>`)
    .join('');

  const offer = result.recommendedOffer;
  const offerExamples = offer.examples?.length
    ? `<ul style="margin:8px 0 0;padding-left:20px;">${offer.examples.map(e => `<li style="font-size:13px;color:#374151;">${escapeHtml(e)}</li>`).join('')}</ul>`
    : '';

  const actions = result.actionItems
    .map((a) => `
      <div style="margin-top:10px;padding:12px;border:1px solid #e5e7eb;border-radius:6px;">
        <div style="font-size:11px;font-weight:600;color:${priorityColor(a.priority)};text-transform:uppercase;letter-spacing:0.05em;">#${a.number} · ${escapeHtml(a.priority)} priority</div>
        <div style="font-size:14px;font-weight:600;color:#111827;margin-top:4px;">${escapeHtml(a.title)}</div>
        <div style="font-size:13px;color:#374151;margin-top:4px;">${escapeHtml(a.description)}</div>
      </div>`)
    .join('');

  const bc = result.benchmarkComparison;
  const benchmarkBlock = `
    <table style="width:100%;border-collapse:collapse;">
      ${row('Tier', `<strong>${escapeHtml(bc.tierLabel)}</strong>`, true)}
      ${row('Your Score', String(bc.yourScore))}
      ${row('Tier Average', String(bc.avgScore), true)}
      ${row('Top Performer', String(bc.topPerformerScore))}
    </table>
    ${bc.insights?.length ? `<ul style="margin:10px 0 0;padding-left:20px;">${bc.insights.map(i => `<li style="font-size:13px;color:#374151;">${escapeHtml(i)}</li>`).join('')}</ul>` : ''}`;

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;color:#111827;">
  <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#ffffff;font-size:18px;">Audit Complete · ${escapeHtml(formData.artistName)}</h2>
    <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px;">Score: ${sb.total}/100 · ${escapeHtml(sa.tier)} · ${escapeHtml(bc.tierLabel)}</p>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">

    ${section('1. What They Submitted', inputsTable)}
    ${section('2. Audience Strength Score', scoresTable)}

    ${result.brandSummary ? section('3. Brand Summary', `<p style="margin:0;font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(result.brandSummary)}</p>`) : ''}

    ${section(`${result.brandSummary ? '4' : '3'}. Superfan Signals`, `
      <div style="padding:12px;background:#faf5ff;border-left:3px solid #7c3aed;border-radius:4px;">
        <div style="font-weight:600;font-size:14px;color:#5b21b6;">${escapeHtml(sa.tier)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">Engagement rate signal: ${sa.engagementRate}%</div>
      </div>
      <p style="margin:10px 0 6px;font-size:13px;color:#374151;">${escapeHtml(sa.description)}</p>
      <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:10px;">Key Indicators</div>
      <ul style="margin:6px 0 0;padding-left:20px;">${indicatorsList}</ul>
    `)}

    ${section(`${result.brandSummary ? '5' : '4'}. Platform-by-Platform`, platformBlocks)}

    ${section(`${result.brandSummary ? '6' : '5'}. Recommended Offer`, `
      <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(offer.tier)}</div>
      <div style="font-size:16px;font-weight:600;color:#111827;margin-top:2px;">${escapeHtml(offer.title)}</div>
      <p style="margin:8px 0;font-size:13px;color:#374151;">${escapeHtml(offer.description)}</p>
      ${offerExamples}
      <p style="margin:10px 0 0;font-size:13px;color:#6b7280;font-style:italic;">${escapeHtml(offer.whyThisWorks)}</p>
    `)}

    ${section(`${result.brandSummary ? '7' : '6'}. Top 3 Action Items`, actions)}

    ${section(`${result.brandSummary ? '8' : '7'}. Benchmark Comparison`, benchmarkBlock)}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Auto-generated from <a href="https://superfanaudit.com" style="color:#7c3aed;">superfanaudit.com</a>.
      Lead is in <a href="https://app.kit.com" style="color:#7c3aed;">Kit</a> tagged with their score.
    </p>
  </div>
</div>`.trim();

  // Plain-text fallback for email clients that block HTML.
  const text = buildPlainText(formData, result);

  return await sendEmail({
    apiKey,
    subject: `Audit complete: ${formData.artistName} — ${sb.total}/100 (${sa.tier})`,
    html,
    text,
    replyTo: formData.email,
  });
}

interface SendEmailParams {
  apiKey: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

async function sendEmail({ apiKey, subject, html, text, replyTo }: SendEmailParams): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      from: FROM,
      to: [NOTIFICATION_TO],
      subject,
      html,
    };
    if (text) body.text = text;
    if (replyTo) body.reply_to = replyTo;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('[notifications] Resend API error:', error);
      return false;
    }

    console.log(`[notifications] Sent: ${subject}`);
    return true;
  } catch (error) {
    console.error('[notifications] Send failed:', error);
    return false;
  }
}

function buildPlainText(formData: AuditFormData, result: AuditResult): string {
  const lines: string[] = [];
  lines.push(`SUPERFAN AUDIT — ${formData.artistName}`);
  lines.push(`Score: ${result.scoreBreakdown.total}/100 · ${result.superfanAnalysis.tier}`);
  lines.push('');
  lines.push('— Inputs —');
  lines.push(`Name: ${formData.name}`);
  lines.push(`Email: ${formData.email}`);
  lines.push(`Genre: ${formData.genre}`);
  lines.push(`Monthly Income: ${formData.monthlyIncome}`);
  lines.push(`Years Active: ${formData.yearsActive}`);
  lines.push(`Spotify: ${formData.spotifyUrl || '—'}`);
  lines.push(`YouTube: ${formData.youtubeUrl || '—'}`);
  lines.push(`Instagram: ${formData.instagramHandle || '—'}${formData.instagramFollowers ? ` (self-reported ${formData.instagramFollowers} followers)` : ''}`);
  lines.push(`TikTok: ${formData.tiktokHandle || '—'}`);
  lines.push(`Website: ${formData.websiteUrl || '—'}`);
  lines.push('');
  lines.push('— Score Breakdown —');
  lines.push(`Total: ${result.scoreBreakdown.total}/100`);
  lines.push(`YouTube: ${result.scoreBreakdown.youtube}/35`);
  lines.push(`Spotify: ${result.scoreBreakdown.spotify}/25`);
  lines.push(`Cross-Platform: ${result.scoreBreakdown.crossPlatform}/20`);
  lines.push(`Web Presence: ${result.scoreBreakdown.webPresence}/10`);
  lines.push(`Social: ${result.scoreBreakdown.social}/10`);
  lines.push('');
  lines.push('— Platform Metrics —');
  for (const p of result.platformBreakdowns) {
    lines.push(`${p.platform} [${p.strengthRating}] score=${p.score}`);
    for (const [k, v] of Object.entries(p.metrics)) {
      lines.push(`  ${formatKey(k)}: ${v}`);
    }
    lines.push(`  insight: ${p.insight}`);
  }
  lines.push('');
  lines.push('— Superfan Analysis —');
  lines.push(`Tier: ${result.superfanAnalysis.tier}`);
  lines.push(`Engagement rate signal: ${result.superfanAnalysis.engagementRate}%`);
  result.superfanAnalysis.keyIndicators.forEach((k) => lines.push(`  • ${k}`));
  lines.push('');
  lines.push('— Recommended Offer —');
  lines.push(`${result.recommendedOffer.tier}: ${result.recommendedOffer.title}`);
  lines.push(result.recommendedOffer.description);
  lines.push('');
  lines.push('— Action Items —');
  result.actionItems.forEach((a) => {
    lines.push(`#${a.number} [${a.priority}] ${a.title}`);
    lines.push(`  ${a.description}`);
  });
  lines.push('');
  lines.push('— Benchmark —');
  lines.push(`Tier: ${result.benchmarkComparison.tierLabel}`);
  lines.push(`Your: ${result.benchmarkComparison.yourScore} · Avg: ${result.benchmarkComparison.avgScore} · Top: ${result.benchmarkComparison.topPerformerScore}`);
  return lines.join('\n');
}

function row(label: string, value: string, striped = false): string {
  const bg = striped ? 'background:#f9fafb;' : '';
  return `<tr style="${bg}"><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:40%;">${escapeHtml(label)}</td><td style="padding:8px 12px;font-size:13px;color:#111827;">${value}</td></tr>`;
}

function section(title: string, body: string): string {
  return `
    <div style="margin-top:24px;">
      <h3 style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(title)}</h3>
      ${body}
    </div>`;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatLink(url: string | undefined): string {
  if (!url) return '—';
  const safe = escapeHtml(url);
  return `<a href="${safe}" style="color:#7c3aed;" target="_blank" rel="noopener">${safe}</a>`;
}

function formatTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function ratingBg(rating: string): string {
  switch (rating) {
    case 'Strong': return '#dcfce7';
    case 'Growing': return '#fef3c7';
    case 'Not Found': return '#fee2e2';
    case 'Scan Limited': return '#e5e7eb';
    default: return '#e5e7eb';
  }
}

function ratingFg(rating: string): string {
  switch (rating) {
    case 'Strong': return '#166534';
    case 'Growing': return '#92400e';
    case 'Not Found': return '#991b1b';
    case 'Scan Limited': return '#374151';
    default: return '#374151';
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'High': return '#dc2626';
    case 'Medium': return '#d97706';
    default: return '#6b7280';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
