import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cmsConfig } from '@/lib/cms/config';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({request});
  const config = cmsConfig();
  if (config) {
    const client = createServerClient(config.url, config.key, {
      cookieOptions: {httpOnly: true, secure: config.origin.startsWith('https:'), sameSite: 'lax', path: '/'},
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: entries => {
          entries.forEach(({name, value}) => request.cookies.set(name, value));
          response = NextResponse.next({request});
          entries.forEach(({name, value, options}) => response.cookies.set(name, value, options));
        },
      },
    });
    await client.auth.getClaims();
  }
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
export const config = { matcher: ['/admin/:path*', '/api/cms/:path*'] };
