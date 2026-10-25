# Suppliers and holiday offers

## Add a supplier (only when needed)

1. Open **Suppliers**, search the name. Existing incomplete preferred suppliers stay listed; do not process all 76 in advance.
2. If missing, choose **Add supplier**. Enter name, website and specialism; use a different public name only if necessary. Enter the public legal/trading name, business address, contact and booking-conditions link from the supplier website.
3. Leave ATOL blank if it does not apply. If entering an applicable holder/number, check their relationship to this supplier before marking them checked. Any necessary ATOL protection wording is entered once under **Advanced**, not retyped on offers. No dates, evidence questionnaire or artwork upload is required.
4. **Save supplier**. Partial records can be saved. Complete missing public trader details only when advertising a holiday from that supplier. **Edit** changes a record; **Archive** retains it and hides its offers. Known restrictions remain effective and appear under Advanced.

Existing research, private account/agent information, original evidence, logos and legacy fields remain in the database. Ordinary saves do not erase them. No Companies House account, CAA import, API key or bulk import is part of this workflow. Dale's general network permission is settled; use suppliers New Travel works with and observe known supplier restrictions.

## Add and publish an offer

1. **Holiday Offers > Add Offer**. Select the existing supplier; enter title, destination, accommodation, description and optional highlights.
2. Choose travel type. Enter dates or start date/nights; nights calculate from both dates. Only relevant transport fields appear. Package/tour entries ask whether flights are included; cruise-only, fly-cruise, accommodation and rail imply the appropriate transport choice.
3. Enter the full price including mandatory calculable charges, currency, per-person/party basis, adults/children and relevant occupancy or child ages. Enter the date the price was checked. Give any genuine supplier booking deadline in local time. Disclose unavoidable local charges and material exclusions/conditions where they apply; otherwise leave optional fields blank.
4. **Choose featured photograph** uses the shared CMS library. Select an existing photo or upload, check the suggested description and **Use described photograph**. Gallery images are optional. Check rights: a library record is not a licence.
5. Select holiday categories once and tick **Featured on homepage** if wanted.
6. **Save Draft**, then **Preview saved offer**. **Publish** when the factual information is complete. **Unpublish** or **Archive** stops public display. **Duplicate offer** retains useful content with a new identity/URL and requires a new price-check date while retaining the known supplier deadline and conditions.

Failures retain unsaved entries; leaving unsaved work raises the browser warning. Save drafts regularly: there is no background autosave or new browser storage. Private source/reference notes remain optional. The form no longer includes extraction, backups, repeat approval screens or manual UTC entry.

Publication automatically drives the existing individual route, listing, selected category pages, Featured homepage slot, SEO/sitemap and offer-reference enquiry. Nothing needs to be maintained separately on those pages. Enquiries still go to Jay; quotations/bookings remain in the approved New Travel workflow, including vCRM. This website does not take a booking or payment.

## The few checks that remain

- Admin authentication, Origin checks, RLS, media/slug ownership, bounded input and revision conflicts protect the system and other editors.
- Public trader name/address/contact, an identifiable holiday, travel date/duration, main inclusions, full numeric price/basis, priced party and described photograph make the advertisement usable and accurate. Categories are a listing requirement, not a separate legal approval.
- Flights require the actual checked protecting ATOL holder/number and applicable wording once on the supplier. Non-flight arrangements do not. Never mark imported suggested numbers checked without checking them. Different brands, agents and organisers are not automatically the same entity.
- Known supplier restrictions and archive choices apply. The pre-existing global site launch setting remains unchanged; a closed setting still prevents publication until separately authorised. No new supplier approvals are required.
- A supplier deadline or past travel date stops the offer being advertised. **No seven-day age/expiry rule remains.** Older prices show their checking date and clear reconfirmation wording; the dashboard offers non-blocking review reminders. Review prices against the supplier rather than assuming an unexpired deadline means availability.

Supplier information is reused near the bottom of the individual page in a keyboard/touch-accessible, initially open **About this supplier / tour operator** section. Protecting holder/number and required wording for flight-inclusive advertisements remain visible near the price, not hidden behind a modal. Price/local-charge details are visible on cards and detail pages. Supplier booking-condition links and actual deadlines are shown when supplied. No invented financial-protection statement or artwork is added.

## One manual migration before releasing this version

Use **only `supabase/migrations/20261030_simple_supplier_offer_workflow.sql`**, after the already-applied migrations through 20261028. It works whether 20261029 was applied or not; do not apply 20261029 now or rerun previous migrations/imports.

1. Confirm the intended Supabase project and its current backup. Review the entire new file.
2. In **SQL Editor**, paste and run the whole new file once, including `begin` and `commit`, as database owner. If it fails, roll back and investigate rather than resetting anything.
3. Confirm the existing 76 suppliers, offer UUIDs/references/statuses and enquiry/email snapshots remain. The launch setting must be unchanged. No existing offer is published by the migration.
4. In the updated app, test one existing supplier and a synthetic draft. Check its saved preview before deliberately publishing any real offer.

The migration adds three small private booleans (archive, checked ATOL facts, and preservation of previously hidden offers) and allows one booking-conditions URL in existing public supplier JSON. It replaces the old supplier/offer validation functions coherently, removes unused wrappers and preserves other columns and all research. Imported pending records are available without approval processing. Recorded restrictions/inactive intentional archives are retained; ATOL numbers and old review evidence are preserved, but no number is automatically marked checked: a general review date does not prove a specific ATOL check. Mark only actually checked facts when the supplier is used for a flight-inclusive offer. Existing flight-inclusive publicity may need that factual check before it can remain visible.

Previously hidden published offers remain hidden until Jay explicitly opens and **Publishes** the relevant offer. This prevents relaxed rules from silently reactivating an old advertisement. Existing visible offers retain their status. Private preservation metadata is not another ordinary approval procedure.

No hosted SQL, publication, secret change, enquiry activation, push or deployment was performed by this task. The earlier security upgrade remains separate.

Validation: 68 tests passed (38 server and 30 UI), plus lint, TypeScript and production build. Local database fixtures cover both migration histories, all 76 imported suppliers, existing records/research, immutable enquiry/email snapshots, RLS, new supplier/offer saves, actual deadlines and publication. UI fixtures cover directory search, photo selection, draft/save/preview links, publication failures and the unchanged three-stage enquiry. These do not prove hosted behaviour. No browser was connected to the available tools, so visual desktop/mobile checks remain for owner review; no development server was started or stopped.

Legal basis for the retained minimum: [CAA agency/publicity terms](https://www.caa.co.uk/publication/download/21385) require the correct protecting principal and applicable information; agents must not infer logo rights. [UK package-travel guidance](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1093536/package-travel-regulations-2018-guidance.pdf) distinguishes applicable pre-contract information from irrelevant fields. The website retains actual material information, rather than forcing empty regulatory paragraphs for every supplier.


## First holiday test corrections

- Directory search matches names, website and specialism, case-insensitively. Search and directory rows are hidden while adding/editing; cancelling or saving returns to the retained search.
- Choose **All-inclusive** in the existing public Holiday Offers filter (`/holiday-offers?type=all-inclusive`). It derives membership directly from **All Inclusive** or **All-inclusive** board basis, case-insensitively, including already saved offers. Do not select another category or re-enter this information. The existing six holiday-style guides/categories are unchanged; no duplicate all-inclusive guide or stored classification is introduced.
- Public travel arrangements use readable labels, including **Package holiday**, **Cruise only**, **Fly-cruise**, **Accommodation only**, **Tour** and **Rail holiday**. **Other** needs a brief description and an explicit flight choice. A package must still be classified as Package holiday; Other does not remove applicable obligations. Dates/nights and inclusions validation are unchanged.
- **Ask Jay about this holiday** appears beside the price and at the bottom of a live detail page. Saved preview also shows the link near the price. It uses the same saved offer reference and Holiday Brief; unpublished/unavailable offers cannot be enquired about as live offers and existing submission gates remain effective.

### One-time TUI check (no saved records changed by this task)

The old combined error came from `disclosureIssues` and the API before the database save. The database independently requires `atol_verified` plus non-empty holder, number and applicable wording for flight-inclusive offers (`cms_private.offer_disclosures_ready`, also called by the publication trigger/save). Preview displaying a name/number does not establish those other fields. Migration 20261030 intentionally did not mark imported numbers checked. The error now names the missing check, identity or wording separately. No artwork requirement has been restored.

No hosted supplier record was inspected or changed, so its current missing field cannot be asserted from the preview alone. In **Suppliers**, search TUI, then **Edit**:

1. Confirm the specific holiday's supplier documentation identifies **TUI UK Limited** as the protecting organiser, not just a TUI group brand, retailer or airline.
2. Use the [CAA current ATOL lookup](https://www.caa.co.uk/atol-protection/check-an-atol/search-atol-holders/) in your browser; search **2524**, confirm the current holder and the advertised arrangement. The research tool could not run this JavaScript application. [TUI's official terms](https://nhs.tui.co.uk/information/help-and-support/terms-and-conditions) identify TUI UK Limited / 2524; that page also distinguishes the retail agent from the organiser. [TUI's protection guidance](https://www.tui.co.uk/destinations/faq/payments-and-insurance) distinguishes flight-inclusive packages, flight-only and non-flight bookings. These do not establish the organiser of a specific unseen offer.
3. Once confirmed, retain **TUI UK Limited**, **2524** and tick **I have checked this ATOL holder, number and its relationship to this supplier**. Under **Advanced**, record applicable protection wording and optionally the checked source/date in private notes. For a confirmed TUI UK Limited flight-inclusive package, concise wording is: "Flight-inclusive packages organised by TUI UK Limited are ATOL protected under ATOL 2524. When you pay, an ATOL Certificate will identify the protected services. Please ask for it and check that it includes the services you booked. See the supplier booking conditions for details." Use this only for that arrangement; it is not a blanket claim about all TUI products or a substitute for applicable booking terms/certificates.
4. **Save supplier** once. Reopen/reload the saved offer editor after preserving any unsaved work so it retrieves the updated supplier and revision. Check **Package holiday**, **Flights included: Yes**, preview, then deliberately publish when ready. Supplier saves update linked offer revisions to protect against stale edits. No repeated supplier verification is required for offers using the same confirmed protecting arrangement; recheck if that arrangement or holder changes.

### Manual migration for Other

After 20261030, review and run the whole `supabase/migrations/20261031_offer_test_refinements.sql` once in Supabase SQL Editor as database owner before using **Other**. It replaces two existing functions to accept Other with a non-empty description while retaining all flight/ATOL, pricing, date, authorisation and publication checks. It creates no tables, changes no saved records, grants or launch gates, and has not been applied automatically. The other four corrections need no schema change.

Verification: all 68 tests, lint, TypeScript and production build passed after these corrections. Tests cover hidden edit-mode search, retained directory search, the board-derived filter query, readable labels, Other validation in both application and database, precise ATOL errors, preview/public enquiry links, unchanged saved records and the three-stage enquiry. No hosted records were edited, offers published, gates enabled or deployment performed.
