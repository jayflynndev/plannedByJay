import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cmsConfig } from './config';
import { CmsError, verifyAdministrator } from './security';
export async function sessionClient() {
  const config = cmsConfig();
  if (!config) throw new CmsError('The content portal has not been configured. See the Admin Portal Guide.', 503);
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, secure: config.origin.startsWith('https:'), sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: entries => { try { entries.forEach(({name, value, options}) => jar.set(name, value, options)); } catch { /* Proxy refreshes cookies for read-only server components. */ } },
    },
  });
}
export async function adminClient() {
  const client = await sessionClient();
  await verifyAdministrator(client);
  return client;
}
export async function pageAdmin() {
  try { return await adminClient(); }
  catch (error) {
    if (error instanceof CmsError && error.status === 401) redirect('/admin/login');
    throw error;
  }
}
// Public routes ALWAYS use a fresh anonymous client, even if the reader has an admin cookie.
export function publicClient() {
  const config = cmsConfig();
  if (!config) return null;
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, {...init, cache: 'no-store'}) } });
}
