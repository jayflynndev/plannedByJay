import 'server-only';
export function cmsConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const origin = process.env.APP_ORIGIN;
  if (process.env.CMS_ENABLED !== 'true' || !url || !key || !origin) return null;
  try {
    const parsed = new URL(url); const app = new URL(origin);
    if (parsed.protocol !== 'https:' || !['https:','http:'].includes(app.protocol) || (app.protocol === 'http:' && app.hostname !== 'localhost' && app.hostname !== '127.0.0.1')) return null;
    // Never allow an enquiry secret/service key to be reused by the CMS.
    if (!key.startsWith('sb_publishable_')) return null;
    return { url: parsed.origin, key, origin: app.origin, bucket: 'editorial-images' };
  } catch { return null; }
}
export function publicOrigin() {
  try { return new URL(process.env.SITE_URL || process.env.APP_ORIGIN || 'http://localhost:3000').origin; }
  catch { return 'http://localhost:3000'; }
}
