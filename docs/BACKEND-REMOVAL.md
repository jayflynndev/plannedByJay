# Backend demolition handover

## Recovery and identity

- Starting commit: `f31db8ca78604ef7f08557e33e9c7168d9854bf0`.
- All existing uncommitted work preserved in recovery commit **`447a777c8ee760d293e7f7f753b51cde136368d4`**, branch **`backup/pre-demolition-20261025`**. Demolition is a separate change set on **`codex/backend-demolition`**. No push performed.
- Private local archive: **`backups/pre-demolition-20261025/`**, ignored by Git and excluded from TypeScript/lint. Never move it into `public/` or deploy it. It contains `source.zip`, `repository.bundle`, historical docs/tests, public-table JSON exports, `uploaded-media/`, object inventory and the hosted export manifest. Environment files/secrets are not in the source archive; the original `.env.local` remains untouched.
- Source ZIP SHA-256: `B3054FAF867BD2FA62EFAA971D4C90513B333B4AC4DC3700A5B3D4B9E6EAE9E3`.
- Git bundle SHA-256: `19E56E147E4DF10D2752F76D06B0987A27992DFA129A5E93153F0F36EFCD2C9F`.
- Configured project reference: **`watlnbiurgavvlalqwqz`**, host **`watlnbiurgavvlalqwqz.supabase.co`**. The owner identifies this as Planned by Jay; verify the dashboard's exact reference before resetting. No QuizHub project was accessed or changed. Vercel's project/environment identity was not independently verified.

## Backup completion: hosted reset is blocked

The existing server credential exported 17 public application tables. Those exports contain two article records, one holiday offer, three media metadata records, and zero enquiry rows returned by this project's export at this time. This does not establish where any earlier test enquiry was stored. All three files listed in the editorial media bucket were downloaded, including metadata inventory. No customer or credential values were printed in tool output.

**The hosted backup is not complete.** Five `cms_private` tables cannot be exported via the exposed REST schemas: administrators, offer information, launch settings, slug history and private supplier information. The schema, function/grant definitions and provider Auth configuration also need a complete database/configuration backup. Public JSON exports alone are not a replacement for a restorable database dump. Obtain and verify that backup before removing any hosted files or running reset SQL. Do not mark the backup acknowledgement true merely because the local source archive exists.

## Removed from the working application

Admin routes, authentication/proxy, CMS/supplier/offer editors, APIs, enquiry storage/security/email/retries, database clients and services, validation/RPC contracts, lookup/import data and active migrations have been deleted. Obsolete backend tests/docs are retained only in the ignored recovery archive and Git history. Backend-only packages and configuration references have been removed. No replacement backend, abstraction or compatibility layer was built.

## What remains

Home, navigation/footer, Why Jay, Explore Holidays and its six guides, assets/portrait, fonts/colours/responsive styling, policy presentation and approval guards, metadata and static sitemap remain. Article/offer rendering components are presentation-only, with local image inputs and no database contracts. Travel Advice and Holiday Offers show empty states; homepage dynamic listings remain hidden. Old article and offer slugs return 404 rather than stale content. The Holiday Brief displays its original stages with disabled fields, no mutable answer state and no transmission/receipt code. Only stage-navigation state exists.

The `public/` assets were not deleted or rewritten. Public CSS was retained; unused admin/editor selectors were removed from the surviving content stylesheet. Existing policy text remains recoverable and guarded; removing a backend does not approve policies or make historical processing descriptions current legal advice.

## Hosted reset

Use only **`maintenance/RESET-PLANNED-BY-JAY.sql`**, following **`maintenance/README.md`**, after full backup verification. It is a manual destructive maintenance script, not a replacement migration. It has not been executed against Supabase. No storage bucket, Auth account, hosted secret, scheduled task, DNS/domain or email setting has been changed. Provider-side jobs/auth/storage settings require the owner's separate cleanup as documented. No deployment was performed.

## Verification

The reset was exercised only in an isolated PostgreSQL fixture reconstructed from the recovery commit: backup acknowledgements and outside-dependency refusal passed; known application objects were removed; unrelated sentinel, Auth, Storage and migration infrastructure survived. The fixture and its obsolete backend dependency are not part of the remaining test suite.

Final validation passed: **14 retained/adapted frontend tests**, lint, standalone TypeScript and production build. Built HTTP checks returned 200 for Home, Why Jay, Explore Holidays/all six guides, Travel Advice, Holiday Offers, disabled Holiday Brief, Booking Information and sitemap. Unapproved Privacy/Cookies retain 404 under existing guards. Old article/offer URLs, admin routes and sampled GET/POST API endpoints returned real 404 responses. A streamed article-not-found 200 was caught and corrected with an empty static-params set and `dynamicParams=false`.

The temporary production preview on port 3107 was stopped. No development server was started or stopped, and no browser visual inspection is claimed. Public assets and `.env.local` have no changes. The replacement backend must be specified separately; this task stops after demolition.
