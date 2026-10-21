import { cookies } from 'next/headers';
import { getEnquiryConfig } from '@/lib/enquiries/config';
import { parseSubmission } from '@/lib/enquiries/request';
import {
  hash,
  readSession,
  sessionCookie,
  validOrigin,
  verifyTurnstile,
} from '@/lib/enquiries/security';
import { EnquiryStore } from '@/lib/enquiries/store';
import { buildNotification } from '@/lib/enquiries/email';
import { processNotification } from '@/lib/enquiries/notifications';
import { receiveWithFriendlyReference } from '@/lib/enquiries/references';
export const runtime = 'nodejs';
export const maxDuration = 60;
const reply = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const config = getEnquiryConfig();
  if (!config) return reply({ code: 'unavailable' }, 503);
  if (!validOrigin(request, config)) return reply({ code: 'spam' }, 403);
  const session = readSession(
    (await cookies()).get(sessionCookie)?.value,
    config.secret,
  );
  if (!session) return reply({ code: 'session' }, 403);
  try {
    const result = await parseSubmission(request);
    if (!result.ok) return reply(result.body, result.status);
    const { brief, submissionId, turnstileToken } = result.data;
    if (!(await verifyTurnstile(turnstileToken, config)))
      return reply({ code: 'spam' }, 403);
    const store = new EnquiryStore(config);
    const id = submissionId;
    const receivedAt = new Date().toISOString();
    const received = await receiveWithFriendlyReference((reference) =>
      store.receive({
        id,
        reference,
        receivedAt,
        brief,
        email: buildNotification(
          brief,
          reference,
          receivedAt,
          config.from,
          config.to,
        ),
        fingerprint: hash(JSON.stringify(brief), config.secret),
        sessionHash: hash(`session:${session}`, config.secret),
        emailHash: hash(`email:${brief.email}`, config.secret),
      }),
    );
    if (received.outcome === 'rate_limited')
      return reply({ code: 'rateLimit' }, 429);
    if (received.outcome === 'conflict')
      return reply({ code: 'conflict' }, 409);
    if (!received.id || !received.reference)
      throw new Error('invalid_database_result');
    // Receipt means durable storage. Email must be attempted, but a temporary failure must not
    // erase the brief or ask the customer to send it again. The protected outbox will recover it.
    try {
      await processNotification(store, config, received.id);
    } catch {
      console.error('holiday_notification_pending', received.reference);
    }
    return reply({ reference: received.reference }, 200);
  } catch {
    console.error('holiday_enquiry_processing_failed');
    return reply({ code: 'failure' }, 503);
  }
}
