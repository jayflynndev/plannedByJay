# Simple supplier directory

## Setup

Reuse the existing Supabase project, confirmed administrator login and publishable configuration. No additional API key, subscription, Companies House account, storage bucket or environment variable is required.

Before deploying, manually run **`supabase/migrations/20261026_suppliers_directory.sql`** in Supabase SQL Editor as the database owner. The Articles admin function must already exist. Run only this new migration; do not re-run the original Articles setup. It creates one empty `suppliers` table with administrator-only RLS, normalised-name uniqueness, timestamps and version protection. Re-running this migration retains supplier records and does not alter Articles or Holiday Types. Nothing is applied to hosted Supabase automatically.

All supplier records, including Approved records, are private to the existing administrator. There are no public supplier pages or anonymous supplier reads. No suppliers are imported or pre-registered.

## Everyday use

Open **Admin → Suppliers** and search the saved directory first. Search filters existing names, websites and specialisms immediately, without performing an internet lookup. An empty directory says “No suppliers added yet.”

If no record exists, choose **Add Supplier**. Enter its name, optionally use **Find Supplier Details**, review suggestions and complete missing fields manually. The form supports website, legal/trading name, published business/contact address, public email or contact-page URL, ATOL holder/number where applicable, booking conditions URL and a simple editable specialism. Only the name is required. Save Draft permits incomplete information; choose Approved and Save Supplier when satisfied with the record. Approved means Jay has reviewed the entered information, not a separate New Travel approval or certification of individual products.

Lookup results are never saved automatically. Choose a possible business where several are shown. Use an individual suggestion, or fill empty fields only. Replacing a non-empty manual entry asks for confirmation. A source label/link is retained with accepted values; manually editing a value removes its previous attribution. Lookup does not change the status to Approved. Save feedback appears beside the controls, requests prevent duplicates and failed saves keep current entries. Use Edit and Save Changes for later corrections.

Duplicate names ignore case and repeated whitespace. Archived names also remain reserved: include archived suppliers in directory search and restore the existing record instead of duplicating it. Archive and Restore both ask for confirmation. Archiving retains the stable supplier ID and all information, preserving future references. The application and authenticated database role have no permanent-delete operation. No offers or relationship tables have been built.

## What Find Supplier Details actually does

There is no search API or AI integration in the project. The implementation performs a small, bounded read of public web pages:

- **Jet2holidays by name:** reads its [official booking conditions](https://www.jet2holidays.com/terms-and-conditions) and [contact page](https://www.jet2holidays.com/contact-us). It suggests legal name and supplier-stated ATOL details only when the expected attributable statements are present in the live response. It can also suggest website, contact/booking links and a Package Holidays specialism. No email/address is guessed from the surrounding legal or regulatory text.
- **Ambiguous “Jet2”:** presents Jet2holidays and Jet2.com as possible websites. Jay chooses rather than silently assigning the airline's legal details to the holiday business.
- **Other names:** asks for the supplier's official HTTPS website. It reads that single supplied page for structured organisation data and same-site contact/booking links. Multiple organisation/legal entities are presented separately. These values are labelled “Suggested but needs checking”, because a supplied website and its structured data do not independently prove identity. General organisation addresses are deliberately ignored; only an explicit contact-point address is suggested.
- **Missing/blocked information:** leaves missing fields alone and explains the partial result. A failed page read offers only the supplied/known website address as a suggestion. Manual entry and Draft saving remain available.

“Found on official supplier website” means a successful read of the supported official site, not confirmation against an authoritative register. **No register is queried, no current CAA licence status is checked, and no lookup establishes financial protection for every product sold by a supplier.** Live page changes may reduce the fields returned; no stored legal/ATOL fallback is substituted.

The reader makes at most two concurrent requests per lookup, with eight-second deadlines and a 2 MB HTML limit per page. It executes no JavaScript, follows no redirects or discovered links, sends no cookies/credentials, and honours inaccessible/blocked responses. HTTPS and certificate verification stay enabled. Public address checks and pinned DNS results prevent requests to local/private networks. A best-effort per-process administrator throttle permits six lookups a minute; there is no additional rate-limit service or research-history database.

## Validation and limitations

Tests cover the real migration in isolated PostgreSQL, private RLS, duplicate names, approval, version conflicts, archive/restore, lookup evidence, ambiguous matches, missing details, unsafe URLs/addresses, safe prefill, instant directory search and the existing Articles/Holiday Types regression suite. Fixtures do not create hosted data.

The local Node HTTPS probe failed certificate-chain verification (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), so a successful live application lookup has not been established from this machine. The app returned its website-only fallback correctly; TLS verification was not disabled. The official pages were inspected separately during implementation, and field extraction is tested with controlled responses. After deployment, verify live lookup from the hosting environment; a blocked or unsupported supplier website still requires manual completion.

All 32 automated tests, ESLint, TypeScript validation and the production build passed. The installed shell runtime is Node 20; tests used a temporary WebSocket preload for the existing Supabase client, then removed it. Use the project's declared Node 22.13+ runtime for normal commands. No connected browser was available, so desktop/mobile visual checks were not completed. Hosted login, migration and supplier saves still require owner verification after the manual release; no hosted records were created by testing.
