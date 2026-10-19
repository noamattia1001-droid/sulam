// POST /api/lead : saves a website enquiry in Supabase and notifies the team.
// Env vars (Vercel > Settings > Environment Variables):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY           (required)
//   CALLMEBOT_PHONE, CALLMEBOT_APIKEY                 (optional: WhatsApp alert to you)
//   RESEND_API_KEY, NOTIFY_EMAIL, NOTIFY_FROM         (optional: email alert)
//   SITE_URL                                          (optional: link to the dashboard in alerts)
//   ZIV_WEBHOOK_URL, LEADS_API_KEY                    (optional: push each new lead to Ziv's dashboard)

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // honeypot: real people never fill this hidden field
  if (body.website) return res.status(200).json({ ok: true });

  const lead = {
    name: clean(body.name, 120),
    org: clean(body.org, 160),
    phone: clean(body.phone, 30),
    msg: clean(body.msg, 2000),
    source: 'website',
  };
  if (!lead.name || !/^[0-9+\-\s()]{7,20}$/.test(lead.phone)) {
    return res.status(400).json({ error: 'missing_name_or_phone' });
  }

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'server_not_configured' });

  const r = await fetch(`${url}/rest/v1/leads`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(lead),
  });
  if (!r.ok) return res.status(502).json({ error: 'save_failed' });

  const saved = (await r.json().catch(() => []))[0] || lead;

  // notifications never block the visitor
  const site = process.env.SITE_URL || '';
  const text = `פנייה חדשה מהאתר של סולם\n${lead.name}${lead.org ? ' · ' + lead.org : ''}\n${lead.phone}\n${lead.msg || ''}${site ? '\n' + site + '/admin' : ''}`;
  const jobs = [];
  if (process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_APIKEY) {
    const q = new URLSearchParams({ phone: process.env.CALLMEBOT_PHONE, text, apikey: process.env.CALLMEBOT_APIKEY });
    jobs.push(fetch(`https://api.callmebot.com/whatsapp.php?${q}`));
  }
  if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'Sulam <onboarding@resend.dev>',
        to: process.env.NOTIFY_EMAIL.split(',').map(s => s.trim()),
        subject: `פנייה חדשה: ${lead.name}${lead.org ? ' · ' + lead.org : ''}`,
        text,
      }),
    }));
  }
  if (process.env.ZIV_WEBHOOK_URL) {
    jobs.push(fetch(process.env.ZIV_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LEADS_API_KEY || ''}`, 'X-API-Key': process.env.LEADS_API_KEY || '' },
      body: JSON.stringify({ event: 'lead.created', lead: saved }),
      signal: AbortSignal.timeout(5000),
    }));
  }
  await Promise.allSettled(jobs);
  return res.status(200).json({ ok: true });
};
