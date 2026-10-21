# Your Planned by Jay website

## Getting started

Use Node.js 22.13 or newer for the full development toolchain. The Phase 3 Supabase SDK requires Node 22+; Node 20.11 is no longer suitable. In VS Code, open D:\plannedByJay and open Terminal → New Terminal.

1. Run `npm ci` to install the exact dependencies in package-lock.json.
2. Run `npm run dev`.
3. Open http://localhost:3000 (or the alternative port printed in the terminal).

Changes normally appear automatically. Stop the server with Ctrl+C. Run `npm run lint`, `npm run typecheck` and `npm run build` before sharing a release. Use `npm start` to serve the production build.

## Changing homepage text

Travel articles are now managed through `/admin`, after the manual setup in [ADMIN-PORTAL-GUIDE.md](ADMIN-PORTAL-GUIDE.md). Paste Markdown, add a photo, preview and explicitly publish without editing files or redeploying. `/travel-advice` displays published articles; the existing Travel Advice navigation link now opens it. The homepage design and Holiday Brief are preserved.

Apply only the new CMS and editorial Storage migrations listed in that guide to your existing database. Do not reset enquiry tables or change the working Resend configuration. CMS users have separate permissions and cannot access customer enquiries. The CMS gate and search-indexing gate default to false; `.env.local` has not been edited automatically.

General editorial labels/content types live in `src/content/cms.ts`. Available content-type changes also need a matching database CHECK migration. Homepage copy remains in `src/content/home.ts`; enquiry copy remains in `src/content/enquiry.ts`. Private research sources and notes belong in the editor's private fields, never in public Markdown. The admin guide covers first-account setup, recovery, categories, images, duplicate URLs, revision conflicts and troubleshooting.

Open `src/content/home.ts`. Keep quotation marks and commas intact. The content objects match the page sections:

| Page area | Property |
| --- | --- |
| Hero headline | `home.hero.headline` |
| Hero paragraph | `home.hero.description` |
| Hero buttons | `home.hero.primary` and `home.hero.secondary` (`label`, `href`) |
| Starting points | `home.paths.title` and `home.paths.items` |
| Introduction to Jay | `home.why.title`, `description`, `closing`, `points` |
| Holiday section | `home.holidays.title`, `description`, `items` |
| Editorial section | `home.inspiration.title`, `description`, `items` |
| Final invitation | `home.cta.title`, `description`, `button` |

Section eyebrow labels are also editable. Avoid putting marketing text into components.

## Changing the hero photograph

1. Copy a licensed JPG, PNG or WebP into `public/images/home/`, for example `my-coast.jpg`.
2. Open `src/content/home.ts`.
3. Change `home.hero.image` to `/images/home/my-coast.jpg`; the URL omits `public`.
4. Update `home.hero.imageAlt` to describe what is actually visible. Recommended size: about 1600 × 1800 pixels. It crops to a tall desktop frame and a broader mobile frame; keep the focal point near the centre.
5. Save and check localhost on desktop and a narrow mobile viewport. If reusing a filename, refresh the browser; a new filename avoids stale image caches.

Images are rendered using Next.js Image. No remote image requests are needed at runtime. Avoid huge originals; aim for under 500 KB where quality permits.

## Other images and Jay's portrait

Category photographs live in `public/images/destinations/`; edit each `home.holidays.items[].src` and `alt`. Use 1200 × 900 (4:3) or larger. Editorial images live in `public/images/home/`; edit `home.inspiration.items[].image` and `alt`. Use around 1200 × 750 (16:10), with room to crop to 16:9 on mobile.

Jay's portrait is deliberately a labelled placeholder, not a stock person. Add a real approved portrait to `public/images/home/jay.jpg`, then set `home.why.portrait` to `/images/home/jay.jpg` and update `portraitAlt`. About 1000 × 1200 works well. Keep the subject centred.

See `docs/IMAGE-ASSETS.md` for the development photography source register. Images illustrate holiday styles; they are not offers or evidence of destination accessibility.

## Changing navigation

Edit `src/content/navigation.ts`. Each item has `label` and `href`; the prominent action is `primaryNavigation`, now pointing to `/plan-my-holiday`. Explore Holidays, Travel Advice and Why Jay still use homepage anchors. Footer links reuse this configuration. When a future page is ready, replace its anchor with the actual route. Homepage enquiry buttons are configured in `home.hero.primary`, `home.paths.items[].action`, `home.holidays.actionHref` and `home.cta.href`.

## Holiday category cards

In `home.holidays.items`, edit the title, description, src and alt of an object. Copy an object to add a category, delete the full object to remove one, or move it to reorder. Keep titles unique. The responsive grid adapts automatically. All category cards now lead to `/plan-my-holiday`, with a descriptive accessible name; there are no category pages yet.

## Editorial previews

Edit `home.inspiration.items`. Each object controls category, title, description, image and alt. Add or reorder complete objects. These are clearly labelled sample previews and deliberately have no article links. Once articles are commissioned and built, introduce real route properties and links in `TravelInspiration.tsx`. Do not present draft titles as published advice.

## Contact, social and legal details

Open `src/content/site.ts`. Set `site.contact.email` to an approved email string to show the public footer email link. Set `phone` to a real approved number to show a telephone link. The homepage enquiry buttons use the new holiday brief page independently of these public contact details. The private business notification address belongs in `.env.local`, not this content file. Update `site.contact.pending` before launch to reflect the actual availability of contact channels.

Add approved `{ label, href }` objects to `site.social` and `site.policies` only when their destinations exist. Replace the legal placeholder with approved wording, including the precise agency and protection information. Never infer membership numbers or protection guarantees. Confirm all public wording with the business before release.

## Colours and fonts

Edit the `:root` tokens at the top of `src/app/globals.css`. `--ink`, `--paper`, `--accent`, `--muted`, `--sage` and `--line` control the palette. `--font-heading` and `--font-body` control fonts. Georgia and Arial are intentional system fonts: no font service or download is required. If changing colours, recheck text contrast and keyboard focus visibility.

## Adding future pages

The homepage and `/plan-my-holiday` are implemented. Next.js App Router uses folders: `src/app/travel-advice/page.tsx` creates `/travel-advice`. Export a page component and metadata. The shared layout automatically adds the navbar and footer. Store new copy in a separate content file, reuse UI components and document the page. Then change the relevant navigation href. Do not add other pages until requested.

## Connecting APIs later

Server-only service helpers live in `src/lib/`; route handlers in `src/app/api/<name>/route.ts`. Phase 2 includes unconfigured Supabase and Resend adapters in `src/lib/enquiries/`. Keep secrets in the ignored `.env.local`; variable names are documented in `.env.example`. None of the enquiry secrets should use the `NEXT_PUBLIC_` prefix. No analytics, customer authentication or VHUB connection is implemented.

## SEO and release preparation

Edit `site.title` and `site.description` for homepage metadata. `src/app/layout.tsx` currently sets robots to noindex/nofollow because the site is unfinished. Change that only once ready for publication; then add the confirmed production origin and appropriate canonical/social metadata. No fictional domain is configured. Replace development contact, portrait, legal and policy placeholders, review photography rights and final alt text, and check mobile navigation before launch. Deployment requires your explicit approval.

## Troubleshooting

- **npm is not recognised:** install a supported Node.js LTS release and reopen VS Code.
- **Port already in use:** use the alternative port printed by Next.js, or `npm run dev -- --port 3001`.
- **Missing image:** check spelling and case; a public image URL starts `/images/`, not `/public/`.
- **Syntax error after editing:** check closing quotes, commas and braces. Run `npm run typecheck` for file locations.
- **Dependencies missing:** run `npm ci` in the folder containing package.json.
- **Stale preview:** restart the dev server and refresh. If necessary, stop the server and remove only the project's `.next` generated folder, then restart.
- **Navigation hydration:** navigation configuration is server-only. `RootLayout` passes links, the primary action and branding into `Navbar` as serialised props so server HTML and client hydration share a single content snapshot. Do not import `src/content/navigation.ts` into a client component. After installing this fix, restart your one development server and hard-refresh once (Ctrl+Shift+R) to replace already-loaded old browser code. Check both `/` and `/plan-my-holiday`, then open/close the mobile menu; the primary link should remain `/plan-my-holiday` without new hydration warnings. Never use `suppressHydrationWarning` to mask a mismatch.
- **Enquiry form says submissions aren't open:** this is deliberate until the server-side provider settings and submission gate are configured. See the setup instructions below.
- **Preview links do not open articles:** article pages are future work; sample previews have no links.

## Where presentation lives

`src/components/home/` contains one component per major section; `src/components/layout/` contains navbar and footer; `src/components/ui/` contains shared primitives. `src/app/page.tsx` controls section order. Interactive client components are the navbar and enquiry form. The rest of the layout stays server-rendered.

## Phase 2: editing the holiday brief

Open `src/content/enquiry.ts`. `enquiryContent` controls the page heading, descriptions, stage headings, `fields` question labels, `hints`, placeholders, buttons and customer-facing status messages. `enquiryOptions` controls destination approach, holiday type, dates, duration, budget, contact method and planning intention.

- **Budget ranges:** edit `enquiryOptions.budget`. Change labels freely; preserve existing `value` codes so stored records remain understandable. Add a new object for a new band. The schema automatically permits the configured values; do not introduce a minimum budget or remove the guidance option.
- **Departure preferences:** edit `enquiryContent.fields.departurePreferences`, `hints.departurePreferences` and `placeholders.departurePreferences`. This is one optional text input for airports, ports, flexible departures or no preference; there is no airport option list. The shared schema trims and limits the text to 300 characters.
- **Questions:** labels are in `enquiryContent.fields`. For a genuinely new question, update `EnquiryDraft`, the relevant schema in `src/lib/enquiries/schema.ts`, the form component and the email summary, then add tests. Adding an option requires only the option list when it has no special behaviour. Do not rename the special destination/date/contact values without adapting the conditional logic.
- **Privacy link:** set `enquiryContent.privacyHref` only after an approved policy page exists. No policy page is invented in Phase 2.

Validation first runs when Continue or Submit is attempted. After an unsuccessful attempt, errors update as answers change without moving typing focus back to the summary. Returning with Back or Edit starts that stage without premature errors. Error-summary buttons focus their matching fields below the sticky header.

The three stages preserve answers while moving backwards/forwards. Answers remain in the tab's memory, not browser storage; refresh/closing the page clears unfinished answers. Hidden conditional answers are removed from the accepted record. There is no customer acknowledgement email, newsletter or booking action.

## Phase 2: providers and database

Read [ENQUIRY-SETUP.md](ENQUIRY-SETUP.md) for the exact setup and recovery procedure. In brief:

1. Create/configure your own Supabase project. Run `supabase/migrations/20261012_holiday_enquiries.sql` once in its SQL editor. The records are in `public.holiday_enquiries`; row-level security and revoked anonymous/authenticated privileges keep them private. Access them only through the business's authorised Supabase workspace.
2. Configure Resend and verify a business sending domain. Put its API key and the verified sender into `RESEND_API_KEY` and `ENQUIRY_EMAIL_FROM` in `.env.local`.
3. Set `ENQUIRY_EMAIL_TO` to the approved business notification inbox. This address is server-only and independent of the public footer email. Update it and restart the server to use it for new enquiries. Existing pending notifications retain their original immutable recipient; review those before changing an inbox.
4. Copy the variable names from `.env.example`, configure the Supabase URL/server secret key, generate the two independent security secrets and set `APP_ORIGIN` to the exact local origin. Set `ENQUIRIES_ENABLED=true` for a controlled local test; leave public approval flags false.
5. Run `npm run dev`, open `/plan-my-holiday`, send a brief using your own test details and verify the matching database reference, provider acceptance and actual business inbox receipt. No external email delivery has been tested without your credentials.

## Phase 2: failed notifications and retries

Database `notification_status` distinguishes `pending`, `sending`, `accepted`, `failed` and `manual_review`. `accepted` means Resend accepted the API request, not confirmed inbox delivery. Check attempts, provider ID, last error and due time in Supabase. A brief is durably recorded before sending, so a failed notification cannot erase it.

`POST /api/enquiries/retry` is protected by `Authorization: Bearer <ENQUIRY_RETRY_SECRET>`. Configure an external scheduler to call it every minute; none is connected now. It processes one due notification per call, uses a lease and backoff, and returns only counts. Manual instructions and safe reconciliation SQL are in the setup guide. Never expose the retry secret in a browser or call an unprotected public dashboard. Check Resend logs for delivery/bounce information and inspect spam folders; a successful send API response alone is not inbox confirmation.

## Phase 2: future VHUB integration

Enquiries stay separate from customer records. An authorised future manual export/import or API adapter belongs in a server-only module such as `src/lib/vhub/`, called only after Jay decides the enquiry should enter the customer workflow. Do not push every enquiry automatically or assume VHUB offers a public API. Document approved fields, access and failure handling when that phase is authorised.

## Phase 2: test and launch requirements

Run `npm test` for validation, local PostgreSQL queue/access-control checks and DOM form interactions; then run lint, typecheck and build. DOM tests cover conditional fields, step retention, keyboard focus, phone requirements, duplicate clicks, loading, safe failure and same-ID retry. They are not a visual browser review or genuine provider delivery test.

Before live submissions: Jay's explicit approval, an approved privacy page and retention procedure, configured/verified providers, successful genuine email and recovery tests, a protected retry scheduler with operational monitoring, hosting time/body limits, dependency review and desktop/mobile/keyboard browser review. The code rejects non-local origins until `ENQUIRIES_LIVE_APPROVED=true`, `ENQUIRY_PRIVACY_APPROVED=true`, an actual privacy link and an HTTPS `APP_ORIGIN` are configured. Do not set these flags merely to bypass setup.

## Phase 2 mobile refinements: records and launch notice

New enquiries store the optional text at `brief.departurePreferences`, replacing the former `departures` array and `departureOther` string. No new Supabase migration is required: the existing brief column is JSONB and the RPC accepts JSON. If the database has not been set up, use the existing initial migration. If it exists, leave older records, fingerprints and immutable notification snapshots untouched; retries continue sending their original snapshots. Old enquiry data is not automatically converted. Refresh any tabs with the previous form before testing a new submission.

Stage 1 now has a simple "Who's travelling?" heading. Adult/child limits remain internal; age guidance appears when children are selected. Stage 3 keeps the complete holiday review, including free-text departures, and its existing Edit buttons retain answers.

The development notice is rendered only when the server supplies `enabled=false`. It disappears automatically when the existing provider/privacy/approval launch configuration permits submission. No gate or environment setting was activated by these refinements.

Mobile safeguards include wrapping for long labels/errors/review text and action buttons, zero minimum input width, and sticky-header offsets for stage headings, error summaries and focused inputs. Actual browser review at 375px, 390px and 440px remains required if no browser is connected; DOM tests cannot measure rendered overflow.

## Application-version consistency

See [APPLICATION-VERSION.md](APPLICATION-VERSION.md) for the investigation, remaining browser-verification limit and exact checks. The enquiry form deliberately remounts during Fast Refresh code edits so an older draft cannot survive a field-shape change. This clears unfinished answers during development edits, but normal Back/Continue/Edit operations retain them. The optional departure field still starts as an empty string and strict validation is unchanged.

Next.js and Vercel manage native build/deployment identities and asset hashes. The former source-derived custom ID was removed because redeploying unchanged code reused an ID already registered with Vercel. See [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md) for the cause and Vercel settings to verify, including Skew Protection and system environment variables. Do not configure a fixed deployment-ID override. Persistent Turbopack development cache remains disabled, and the navigation/form hydration safeguards remain intact. Rebuild changed code before starting production; restart your single dev server when checking source changes. No extra server is needed.

## Friendly enquiry references

New references are six random digits, such as `PBJ-583742`, with no leading zero or sequential counter. Internal UUIDs and notification idempotency stay unchanged. Edit confirmation headings, response text, reference note and copy-button messages in `enquiryContent.messages` in `src/content/enquiry.ts`.

Before testing the updated form, manually apply **only** `supabase/migrations/20261013_friendly_enquiry_references.sql` to your existing Supabase project. Do not rerun the initial table-creation migration. Follow [ENQUIRY-REFERENCES.md](ENQUIRY-REFERENCES.md) for the exact SQL Editor steps and verification queries. Codex has not applied this migration to your project.

Existing enquiries retain their original references, UUIDs, briefs, statuses and immutable notification emails. Existing duplicates return the original reference. New numbers are permanently reserved even after an enquiry is deleted; never remove reservation history. New confirmation and business email use the same accepted short reference. The Copy reference button uses browser clipboard access and offers a manual-copy message if it is unavailable.
