// GET /api/leads : read-only feed of website leads for an external dashboard.
// Auth: header  Authorization: Bearer <LEADS_API_KEY>   (or  X-API-Key: <LEADS_API_KEY>)
// Query: ?since=<ISO date>  only leads created after it
//        ?limit=<1-1000>    default 200, newest first
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LEADS_API_KEY

const crypto = require('crypto');

function keyOk(given) {
  const want = process.env.LEADS_API_KEY || '';
  if (!want || !given) return false;
  const a = Buffer.from(String(given)), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-API-Key');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method_not_allowed' }); }

  const auth = req.headers.authorization || '';
  const given = auth.startsWith('Bearer ') ? auth.slice(7).trim() : req.headers['x-api-key'];
  if (!keyOk(given)) return res.status(401).json({ error: 'unauthorized' });

  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'server_not_configured' });

  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 200));
  const q = new URLSearchParams({ select: 'id,created_at,name,org,phone,msg,source,status,notes,updated_at', order: 'created_at.desc', limit: String(limit) });
  const since = req.query.since && !isNaN(Date.parse(req.query.since)) ? new Date(req.query.since).toISOString() : '';
  if (since) q.set('created_at', `gt.${since}`);

  const r = await fetch(`${url}/rest/v1/leads?${q}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) return res.status(502).json({ error: 'read_failed' });
  const leads = await r.json();
  return res.status(200).json({ count: leads.length, leads });
};
