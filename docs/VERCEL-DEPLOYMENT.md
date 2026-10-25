# Deployment configuration

No deployment or provider setting was changed. Deployment requires separate owner authorisation.

Next.js and Vercel retain native build/deployment identities and asset hashing. Do not restore source-hash deployment IDs; identical commits can be redeployed without repeating a custom ID. `next.config.ts` keeps the existing development compiler-cache safeguard. No Supabase image-host configuration remains.

This release is a static/public frontend with no admin or API routes, no authentication proxy, no provider calls and no enquiry transmission. Only the optional public canonical `SITE_URL` is used. Old provider credentials/settings have not been deleted or altered; the application no longer references them. Do not repurpose them or configure a replacement backend in this task.

Follow `maintenance/README.md` for the separately reviewed, backed-up database reset. Do not reset hosted data while the previous production application or scheduled jobs still rely on it. No scheduler was created or removed remotely by this task. Root noindex remains unchanged.
