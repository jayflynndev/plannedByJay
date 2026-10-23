import 'server-only';
import type { EnquiryConfig } from './config';
import type { Enquiry } from './schema';
import type { NotificationEmail } from './email';
export type StoredEnquiry = {
  id: string;
  reference: string;
  received_at: string;
  brief: Enquiry;
  notification_email: NotificationEmail;
  notification_status:
    'pending' | 'sending' | 'accepted' | 'failed' | 'manual_review';
  notification_attempts: number;
  notification_first_attempt_at: string | null;
  lease_token: string | null;
};
export type ReceiveResult = {
  outcome:
    | 'received'
    | 'duplicate'
    | 'conflict'
    | 'rate_limited'
    | 'reference_collision' | 'offer_unavailable';
  id?: string;
  reference?: string;
};
/** RLS-protected Supabase RPCs. Keys remain on the server; there are no browser database clients. */
export class EnquiryStore {
  constructor(private readonly config: EnquiryConfig) {}
  private async rpc<T>(
    name: string,
    arguments_: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(
      `${this.config.databaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${name}`,
      {
        method: 'POST',
        headers: {
          apikey: this.config.databaseKey,
          'Content-Type': 'application/json',
          // Legacy JWT service_role keys need Authorization; modern sb_secret keys use apikey only.
          ...(this.config.databaseKey.startsWith('sb_secret_')
            ? {}
            : { Authorization: `Bearer ${this.config.databaseKey}` }),
        },
        body: JSON.stringify(arguments_),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error('database_unavailable');
    return (await response.json()) as T;
  }
  receive(input: {
    id: string;
    reference: string;
    receivedAt: string;
    brief: Enquiry;
    email: NotificationEmail;
    fingerprint: string;
    sessionHash: string;
    emailHash: string;
    offerReference?: string;
    offerVersion?: string;
  }) {
    return this.rpc<ReceiveResult>(input.offerReference?'receive_holiday_offer_enquiry':'receive_holiday_enquiry_v2', {
      ...(input.offerReference?{p_offer_reference:input.offerReference,p_offer_version:input.offerVersion}:{}),
      p_id: input.id,
      p_reference: input.reference,
      p_received_at: input.receivedAt,
      p_brief: input.brief,
      p_email: input.email,
      p_fingerprint: input.fingerprint,
      p_session_hash: input.sessionHash,
      p_email_hash: input.emailHash,
    });
  }
  claim(id: string | null) {
    return this.rpc<StoredEnquiry[]>('claim_holiday_notification', {
      p_id: id,
    });
  }
  finish(
    id: string,
    lease: string,
    accepted: boolean,
    providerId: string | null,
    errorCode: string | null,
  ) {
    return this.rpc<boolean>('finish_holiday_notification', {
      p_id: id,
      p_lease: lease,
      p_accepted: accepted,
      p_provider_id: providerId,
      p_error_code: errorCode,
    });
  }
}
