// GET /api/config : hands the dashboard its public Supabase settings (URL + anon key only).
module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const cfg = { supabaseUrl: process.env.SUPABASE_URL || '', supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '' };
  res.status(200).send(`window.SULAM_CONFIG = ${JSON.stringify(cfg)};`);
};
