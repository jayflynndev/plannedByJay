import { getEnquiryConfig } from '@/lib/enquiries/config';
import { secureEqual } from '@/lib/enquiries/security';
import { EnquiryStore } from '@/lib/enquiries/store';
import { processNotification } from '@/lib/enquiries/notifications';
export const runtime = 'nodejs';
export const maxDuration = 60;
/** Scheduler/manual recovery only. Returns counts, never enquiry or customer data. */
export async function POST(request: Request) {
  const config = getEnquiryConfig();
  if (!config) return Response.json({ code: 'unavailable' }, { status: 503 });
  if (
    !secureEqual(
      request.headers.get('authorization') || '',
      `Bearer ${config.retrySecret}`,
    )
  )
    return Response.json({ code: 'unauthorised' }, { status: 401 });
  const store = new EnquiryStore(config);
  let processed = 0;
  let failed = 0;
  // One record per request keeps runtimes bounded on serverless hosts. Schedule each minute;
  // increase throughput through concurrent authenticated calls, not unleased reads.
  try {
    const result = await processNotification(store, config, null);
    if (result !== 'idle') processed++;
    if (result === 'failed') failed++;
  } catch {
    console.error('holiday_notification_retry_failed');
    return Response.json({ code: 'retry_failed' }, { status: 503 });
  }
  return Response.json(
    { processed, failed },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
