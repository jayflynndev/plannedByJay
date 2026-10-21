import 'server-only';
import type { EnquiryConfig } from './config';
import type { StoredEnquiry } from './store';
export type NotificationStore = {
  claim(id: string | null): Promise<StoredEnquiry[]>;
  finish(
    id: string,
    lease: string,
    accepted: boolean,
    providerId: string | null,
    errorCode: string | null,
  ): Promise<boolean>;
};
/** The outbox is drained synchronously for a new brief and by a protected scheduler for recovery. */
export async function processNotification(
  store: NotificationStore,
  config: EnquiryConfig,
  id: string | null,
) {
  const [record] = await store.claim(id);
  if (!record || !record.lease_token) return 'idle' as const;
  let accepted = false;
  let providerId: string | null = null;
  let errorCode: string | null = null;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `holiday-enquiry/${record.id}`,
      },
      body: JSON.stringify(record.notification_email),
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      const result = await response.json();
      if (typeof result.id === 'string' && result.id.length <= 200) {
        providerId = result.id;
        accepted = true;
      } else errorCode = 'provider_invalid_response';
    } else {
      errorCode = `provider_http_${response.status}`;
    }
  } catch {
    errorCode = 'provider_network_or_timeout';
  }
  // Do not log raw provider responses, credentials or customer data. If this write fails the lease
  // expires and the scheduler retries with the same provider idempotency key and email snapshot.
  const updated = await store.finish(
    record.id,
    record.lease_token,
    accepted,
    providerId,
    errorCode,
  );
  if (!updated) throw new Error('notification_state_not_saved');
  return accepted ? ('accepted' as const) : ('failed' as const);
}
