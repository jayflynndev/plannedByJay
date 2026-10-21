import 'server-only';
import { z } from 'zod';
import { enquiryContent } from '../../content/enquiry';

const configSchema = z.object({
  origin: z.url(),
  databaseUrl: z.url().refine((value) => new URL(value).protocol === 'https:'),
  databaseKey: z.string().min(20),
  resendKey: z.string().min(10),
  from: z
    .string()
    .min(3)
    .max(254)
    .refine((value) => !/[\r\n]/.test(value)),
  to: z.email(),
  secret: z.string().min(32),
  retrySecret: z.string().min(32),
  turnstileSecret: z.string().optional(),
  turnstileSiteKey: z.string().optional(),
});
export type EnquiryConfig = z.infer<typeof configSchema>;
/** Server only. No credentials or business notification recipient are passed to the form. */
export function getEnquiryConfig(): EnquiryConfig | null {
  if (process.env.ENQUIRIES_ENABLED !== 'true') return null;
  const parsed = configSchema.safeParse({
    origin: process.env.APP_ORIGIN,
    databaseUrl: process.env.SUPABASE_URL,
    databaseKey: process.env.SUPABASE_SECRET_KEY,
    resendKey: process.env.RESEND_API_KEY,
    from: process.env.ENQUIRY_EMAIL_FROM,
    to: process.env.ENQUIRY_EMAIL_TO,
    secret: process.env.ENQUIRY_SECURITY_SECRET,
    retrySecret: process.env.ENQUIRY_RETRY_SECRET,
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY || undefined,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || undefined,
  });
  if (!parsed.success) return null;
  const config = parsed.data;
  const origin = new URL(config.origin);
  if (origin.origin !== config.origin) return null;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (
    !local &&
    (origin.protocol !== 'https:' ||
      process.env.ENQUIRIES_LIVE_APPROVED !== 'true' ||
      process.env.ENQUIRY_PRIVACY_APPROVED !== 'true' ||
      !enquiryContent.privacyHref)
  )
    return null;
  if (Boolean(config.turnstileSecret) !== Boolean(config.turnstileSiteKey))
    return null;
  return config;
}
