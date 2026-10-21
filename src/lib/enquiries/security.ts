import 'server-only';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { EnquiryConfig } from './config';
export const sessionCookie = 'pbj-enquiry-session';
export function hash(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('hex');
}
export function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function newSession(secret: string) {
  const value = `${randomUUID()}.${Math.floor(Date.now() / 1000)}`;
  return `${value}.${hash(value, secret)}`;
}
export function readSession(cookie: string | undefined, secret: string) {
  if (!cookie || cookie.length > 200) return null;
  const [id, issued, signature, extra] = cookie.split('.');
  const age = Date.now() / 1000 - Number(issued);
  if (
    extra ||
    !id ||
    !/^\d+$/.test(issued || '') ||
    !signature ||
    age < 0 ||
    age > 86400 ||
    !secureEqual(hash(`${id}.${issued}`, secret), signature)
  )
    return null;
  return id;
}
export function validOrigin(request: Request, config: EnquiryConfig) {
  return request.headers.get('origin') === config.origin;
}
export async function verifyTurnstile(
  token: string | undefined,
  config: EnquiryConfig,
): Promise<boolean> {
  if (!config.turnstileSecret) return true;
  if (!token) return false;
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: config.turnstileSecret,
          response: token,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await response.json();
    return (
      response.ok &&
      result.success === true &&
      result.hostname === new URL(config.origin).hostname &&
      result.action === 'holiday-enquiry'
    );
  } catch {
    return false;
  }
}
