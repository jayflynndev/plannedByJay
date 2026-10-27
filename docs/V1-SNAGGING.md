# Version 1 technical snagging

This pass preserves the existing design, saved editorial content and working enquiry services. No hosted SQL, data edits, email changes, deployment or Git publication was performed.

## Completed

- **A01/A02:** published article edits use Save Changes with visible status. Feature on Homepage and Pin to Top of Travel Advice are independent, respecting publication/expiry. Homepage selection is explicit; Advice orders pinned first, then newest.
- **A04/N09/N12:** the existing Tiptap editor supports pasted/basic tables, rows, columns and header cells with safe HTML and horizontal overflow. Only a matching leading article-title heading is omitted on display; the saved body and useful headings remain. Ordinary text no longer looks like a link through underlining; actual links stay underlined.
- **O01:** future offer references are random six-digit strings, with bounded collision handling, immutable assignment and permanent reservations against reuse. Bespoke reference handling is unchanged. Existing `000001` is safely reconciled as described below.
- **N01/A03/N06/N12:** all offer filters reset together during client navigation; the Advice search is compact, mobile offer filtering/padding is tighter, price/party appears earlier and a single result says “1 offer”.
- **N08/N10/H01:** reviewed photographs replace known placeholder/filename labels without guessing locations or rewriting hosted records. Explicit related Holiday Type links replace arbitrary first-in-list associations. The generic Travel Advice footer link is removed; no recommendation system was added.

## Manual release order

For the existing installation, review and run these two new files in Supabase SQL Editor **before deploying this application release**:

1. `supabase/migrations/20261027_article_placement.sql`: two genuinely absent article placement flags, their index and the existing atomic save function. Defaults are false; existing bodies, publication dates and records remain intact. Jay can select the intended homepage articles in the normal editor.
2. `supabase/migrations/20261027_random_offer_references.sql`: after the already-applied `20261026_holiday_offer_references.sql`. It reserves the entire consumed old sequence range plus numeric historical snapshot references, adds one immutable earlier-reference alias and changes only reference allocation. Never reset the old sequence, delete reservations or rerun the older reference migration afterwards.

The offer correction rotates `000001` once while keeping it valid as an earlier customer reference, visible/searchable in the existing Admin list/editor. Existing enquiry snapshots, notifications, IDs, URLs, prices, versions and timestamps stay unchanged. If a very old non-numeric/missing snapshot reference depends on the offer's current reference for retries, SQL emits a NOTICE and retains `000001` instead; future offers still use random references. This is a deliberate history-preservation exception, not a new launch gate or customer action.

No original migration is modified. No bespoke migration needs rerunning. These two migrations were exercised in isolated PostgreSQL fixtures, not hosted Supabase.

## SEO findings and launch setting

Read-only checks on the live website found `noindex, nofollow` on sampled public pages and a 404 for `/robots.txt`. Root metadata previously hardcoded noindex; there was no existing indexing switch. The live sitemap contained four article URLs, seven Holiday Types and one offer; sampled titles, descriptions and existing canonical URLs were present. The Holiday Brief and Privacy page lacked canonicals; both now use the existing canonical helper, as does Booking Information.

The new Next.js robots route allows public crawling, excludes `/admin` and `/api/`, and references the current sitemap. Public metadata **still defaults to noindex**. For the intended final production build/deployment, Jay can set:

```dotenv
SITE_URL=https://plannedbyjay.com
SITE_INDEXABLE=true
```

Vercel preview deployments stay noindex even with those values; an unrecognised/localhost canonical origin also stays noindex. Admin layouts/login retain explicit noindex, drafts/expired/ineligible records stay absent from public reads and the sitemap, and missing/draft routes return 404 with noindex. Existing Article/WebPage structured data is retained. This setting affects indexing only and does not change either enquiry journey.

## Verification and limits

- **Passed:** 71 automated tests (36 server/database tests and 35 UI tests), ESLint, TypeScript validation and the production build. `git diff --check` also passed. A source-hash comparison confirmed all 13 protected enquiry/auth files were unchanged.
- Automated regressions cover all existing modules plus placement independence/order, pasted table editing/safe rendering, random references/collisions/exhaustion/permanent reservation and historical reconciliation, filter reset, alt corrections, related links and production-only indexing.
- Headless Edge checked five public pages at **1440, 900, 390 and 320 pixels** using a read-only local copy of published data, including the Sol Tenerife offer. No page overflow was found; wide table content stayed inside its scroll region, price preceded remaining facts on mobile, photographs loaded, duplicate title presentation disappeared, and filter reset cleared all controls during hydrated client navigation.
- Local HTTP checks covered robots, sitemap, signed-out Admin redirect and draft/missing 404/noindex behaviour. Sitemap counts matched the copied published records; no private routes appeared. Existing fixture tests cover publication/expiry/ineligibility rules.
- Visual checks used local data and blocked private/mutating Supabase requests and Resend requests. No live submissions, sign-in, mailbox tests, hosted migration application or customer-record changes were performed. Jay has separately confirmed both live enquiry journeys.
- The original snagging checks used the machine's Node 20.11.1 with a temporary test shim. The subsequent security-patch verification used **Node 22.23.4**, satisfying the project's **Node 22.13+** requirement, with no shim or global runtime/configuration change.

Security finding resolved locally: **Next.js and eslint-config-next are pinned to 16.4.3**, the latest published stable 16.4 patch checked on 27 October 2026. This includes the fixes identified in the [official 14 October advisory](https://nextjs.org/blog/nextjs-security-update-october-14-2026); matching Next environment, compiler and ESLint plugin packages are updated in the lockfile. React/React DOM remain **19.3.0**, and Sharp remains **0.35.5**. All 71 tests, ESLint, TypeScript and the production build passed on Node 22.23.4. The production dependency audit reported zero vulnerabilities.

Post-upgrade local production checks passed for 12 public/login pages, signed-out Admin redirects, rejected and successful synthetic login, HttpOnly/Secure/SameSite cookies, four authenticated dashboards, logout, both enquiry HTTP endpoints (acceptance, stable retry receipt, validation and origin checks), sitemap/robots and actual Next Image optimisation. Authentication, storage and email used temporary in-memory stand-ins; no live login, hosted writes or emails were attempted. All 173 existing source, schema, asset and test files matched their pre-upgrade hashes. The patch changes dependency manifests and this verification note only; it requires no migration. Jay still controls deployment, so the hosted site is not patched until he deploys the updated dependencies.
