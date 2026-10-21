import { cookies } from 'next/headers';
import { getEnquiryConfig } from '@/lib/enquiries/config';
import {
  newSession,
  readSession,
  sessionCookie,
} from '@/lib/enquiries/security';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const config = getEnquiryConfig();
  if (!config)
    return Response.json(
      { ready: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== config.origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return Response.json({ ready: false }, { status: 403 });
  const jar = await cookies();
  if (!readSession(jar.get(sessionCookie)?.value, config.secret))
    jar.set(sessionCookie, newSession(config.secret), {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.origin.startsWith('https:'),
      path: '/api/enquiries',
      maxAge: 86400,
    });
  return Response.json(
    { ready: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
