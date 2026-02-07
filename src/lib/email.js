// ═══════════════════════════════════════════════════════
// EMAIL — Resend integration for lead notifications
// Falls back to console.log if RESEND_API_KEY not set
// ═══════════════════════════════════════════════════════

const RESEND_API = 'https://api.resend.com/emails';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function send(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'HomeVisualizer <noreply@homevisualizer.ai>';

  if (!apiKey) {
    console.log('[EMAIL-SKIP] No RESEND_API_KEY. To:', to, 'Subject:', subject);
    return { sent: false, reason: 'no_api_key' };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[EMAIL-ERROR]', err);
      return { sent: false, reason: err };
    }
    return { sent: true };
  } catch (err) {
    console.error('[EMAIL-ERROR]', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Notify the contractor about a new lead.
 */
export async function notifyContractorNewLead({
  contractorEmail,
  contractorName,
  lead,
  designUrl,
}) {
  if (!contractorEmail) return { sent: false, reason: 'no_contractor_email' };

  const subject = 'New Lead: ' + lead.name + ' wants a free estimate';

  const phoneRow = lead.phone
    ? '<tr><td style="padding:4px 8px 4px 0;color:#78716C;font-weight:600;">Phone</td><td style="padding:4px 0;"><a href="tel:' + esc(lead.phone) + '" style="color:#B8860B;">' + esc(lead.phone) + '</a></td></tr>'
    : '';
  const addressRow = lead.address
    ? '<tr><td style="padding:4px 8px 4px 0;color:#78716C;font-weight:600;">Address</td><td style="padding:4px 0;">' + esc(lead.address) + '</td></tr>'
    : '';
  const viewBtn = designUrl
    ? '<p style="margin:0 0 16px;"><a href="' + designUrl + '" style="display:inline-block;background:#B8860B;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Their Design</a></p>'
    : '';

  const html = [
    '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">',
    '<h2 style="margin:0 0 4px;font-size:20px;color:#1C1917;">New Visualization Lead</h2>',
    '<p style="margin:0 0 20px;color:#78716C;font-size:14px;">Someone used your HomeVisualizer and wants an estimate.</p>',
    '<div style="background:#FAFAF9;border:1px solid #E7E5E4;border-radius:12px;padding:16px;margin-bottom:16px;">',
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">',
    '<tr><td style="padding:4px 8px 4px 0;color:#78716C;font-weight:600;">Name</td><td style="padding:4px 0;">' + esc(lead.name) + '</td></tr>',
    '<tr><td style="padding:4px 8px 4px 0;color:#78716C;font-weight:600;">Email</td><td style="padding:4px 0;"><a href="mailto:' + esc(lead.email) + '" style="color:#B8860B;">' + esc(lead.email) + '</a></td></tr>',
    phoneRow,
    addressRow,
    '<tr><td style="padding:4px 8px 4px 0;color:#78716C;font-weight:600;">Project</td><td style="padding:4px 0;">' + esc(lead.materialBrand || '') + ' ' + esc(lead.materialName || '') + '</td></tr>',
    '</table></div>',
    viewBtn,
    '<p style="color:#78716C;font-size:12px;margin-top:24px;">Tip: Respond within 5 minutes for the best conversion rate.<br/>This lead came from your HomeVisualizer widget.</p>',
    '</div>',
  ].join('\n');

  return send(contractorEmail, subject, html);
}

/**
 * Send confirmation to the homeowner.
 */
export async function sendHomeownerConfirmation({
  homeownerEmail,
  homeownerName,
  contractorName,
  contractorPhone,
  designUrl,
}) {
  if (!homeownerEmail) return { sent: false, reason: 'no_email' };

  const subject = 'Your home design for ' + contractorName;

  const viewBtn = designUrl
    ? '<p style="margin:0 0 16px;"><a href="' + designUrl + '" style="display:inline-block;background:#B8860B;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Your Design</a></p>'
    : '';
  const phoneLine = contractorPhone
    ? '<p style="margin:4px 0 0;font-size:14px;"><a href="tel:' + esc(contractorPhone) + '" style="color:#B8860B;">' + esc(contractorPhone) + '</a></p>'
    : '';

  const html = [
    '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">',
    '<h2 style="margin:0 0 4px;font-size:20px;color:#1C1917;">Thanks, ' + esc(homeownerName) + '!</h2>',
    '<p style="margin:0 0 20px;color:#78716C;font-size:14px;">' + esc(contractorName) + ' received your design and will be in touch with a free estimate.</p>',
    viewBtn,
    '<div style="background:#FAFAF9;border:1px solid #E7E5E4;border-radius:12px;padding:16px;margin:16px 0;">',
    '<p style="margin:0;font-size:14px;font-weight:600;color:#1C1917;">' + esc(contractorName) + '</p>',
    phoneLine,
    '</div>',
    '<p style="color:#78716C;font-size:12px;margin-top:24px;">You received this email because you created a home visualization on ' + esc(contractorName) + "&#39;s website.</p>",
    '</div>',
  ].join('\n');

  return send(homeownerEmail, subject, html);
}

// ─── Welcome email after signup ──────────────────────
export async function sendWelcomeEmail({ email, company_name, slug, plan }) {
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const subject = `Welcome to HomeVisualizer — Let's get you set up`;

  const html = [
    '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">',
    '<h2 style="margin:0 0 4px;font-size:22px;color:#1C1917;">Welcome aboard, ' + esc(company_name) + '!</h2>',
    '<p style="margin:8px 0 20px;color:#78716C;font-size:14px;">Your HomeVisualizer account is live on the <strong>' + esc(plan) + '</strong> plan.</p>',
    '<div style="background:#FAFAF9;border:1px solid #E7E5E4;border-radius:12px;padding:16px;margin:16px 0;">',
    '<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1C1917;">Quick Start (2 minutes):</p>',
    '<ol style="margin:0;padding-left:20px;color:#44403C;font-size:14px;line-height:1.8;">',
    '<li>Set up your brand colors and logo</li>',
    '<li>Copy the embed code to your website</li>',
    '<li>Upload a photo and test it out</li>',
    '</ol>',
    '</div>',
    '<a href="' + appUrl + '/admin/setup" style="display:inline-block;background:#B8860B;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:8px 0;">Set Up Your Visualizer →</a>',
    '<p style="margin:20px 0 4px;font-size:14px;color:#44403C;">Your visualizer page:</p>',
    '<a href="' + appUrl + '/' + esc(slug) + '" style="color:#B8860B;font-size:14px;">' + appUrl + '/' + esc(slug) + '</a>',
    '<p style="color:#78716C;font-size:12px;margin-top:24px;">Questions? Reply to this email or reach out to support@homevisualizer.app</p>',
    '</div>',
  ].join('\n');

  return send(email, subject, html);
}
