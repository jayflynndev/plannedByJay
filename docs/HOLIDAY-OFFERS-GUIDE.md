# Curated holiday offers: owner's guide

Offers are a manually maintained shop window, separate from editorial articles, enquiries and supplier booking systems. Nothing is booked, reserved or paid for through these pages. No offers or suppliers are seeded, scraped or automatically approved.

## Install safely, without activating publication

Jay confirms both Phase 8 migrations (`20261025_curated_holiday_offers.sql` and `20261026_offer_enquiry_snapshots.sql`) are already applied. **Do not rerun them.**

For Phase 8.1, manually apply **only** `supabase/migrations/20261027_supplier_offer_disclosures.sql`:

1. Review the new file and confirm a backup of the intended project. In Supabase SQL Editor check the project identity and presence of `holiday_offer_suppliers`, `holiday_offers` and the existing offer-enquiry receiver.
2. Paste the **entire new file**, including `begin` and `commit`, into a new query and run once. Do not rerun fragments or old migrations. If it fails, roll back and diagnose the exact error.
3. Confirm `select column_name from information_schema.columns where table_schema='public' and table_name='holiday_offer_suppliers' and column_name='disclosures';` returns the new column. As project owner confirm `select enabled from cms_private.offer_launch where singleton;` is unchanged. Do not update the gate.
4. Compare existing offer/enquiry counts and references with the backup. Existing UUIDs, references, statuses and immutable snapshots remain intact. New supplier fields start unverified; incomplete published offers are hidden until reviewed without rewriting their rows. Apply before releasing the matching application.

No hosted SQL was executed by Codex. This transactional migration extends supplier fields, the public details allowlist, guards and future-only snapshot receiver. No customer data, pending message, provider ID, quota or idempotency key is changed. No new credential/environment variable is needed.

The independent owner launch gate starts **false** in `cms_private.offer_launch`. Public `/holiday-offers` routes return 404 until that gate is explicitly approved; homepage and guide sections stay absent. Applying migrations does not activate it. No admin API or browser role can change the gate. Supplier permissions also start pending, and the database refuses publication unless the global gate, active supplier permission and offer review approval all permit it.

New Travel's general permission for its working suppliers with attribution is confirmed. After individual network membership, restrictions, permitted assets and applicable disclosures are verified, the owner must explicitly authorise a separate launch action. Only then may a project owner update that singleton row in SQL Editor, recording `enabled=true`, the approval/evidence identifier in `approved_by` and the decision timestamp in `approved_at`. This is **not an instruction to activate now**. To close publication again, an authorised project owner can set `enabled=false`; existing records remain private/intact. Enquiry activation and search indexing have their own unchanged approvals and are never enabled by this gate.

## Suppliers

Open `/admin/suppliers` → **Add supplier**. Enter the supplier's actual name and public display name. Private website/agent-portal URLs, contacts, evidence and notes are kept separately in the protected schema and are never public query fields. Use HTTPS URLs. Names differing only by case or repeated spaces are duplicates; reuse/edit the existing record rather than creating another. Concurrent duplicates are prevented by a database uniqueness constraint. Updates use revision checks to avoid overwriting another editor's work.

Keep individual supplier marketing **Pending** until network membership/restrictions are verified. Record the network checkbox, **New Travel supplier-network authorisation** basis and public-disclosure verification date/evidence. General advertising permission itself is already confirmed. To record confirmation, select **Confirmed permission**, enter the date and describe the actual permitted offers/assets/conditions and evidence. Confirm the save deliberately. This is a record of a real decision, not permission inferred from a supplier's name or logo. An inactive, declined or pending supplier cannot expose offers, even if an offer's status says published. Approval withdrawal immediately affects fresh public reads. The standalone supplier editor also lets you change or remove its approved library logo and description. No example supplier is assumed authorised.

When entering an offer, choose **+ Add new supplier** from its selector. The same compact supplier form appears inline. Saving selects the new supplier; cancelling or a failed save leaves the unsaved offer, images and metadata in place. The offer itself still needs saving. A supplier's registry details are reused, so you do not repeatedly enter its name, permissions or contact information.

## Enter an offer quickly

Open `/admin/holiday-offers` → **Create offer**. Drafts can be partial. The editor uses:

- **A. Holiday:** title/slug, supplier, explicit holiday-style associations, country, resort/region, accommodation/ship and descriptions. Descriptions are plain text with preserved paragraphs, not another article database.
- **B. Travel:** arrangement, departure, dates, nights, room/cabin, occupancy and verified inclusions/exclusions. Cruise-only asks for a port, not an airport. Hotel-only has no required departure point and implies no flights. Inclusions must describe what the actual supplier product includes, with exclusions/supplements explicit; “None” is appropriate only when checked.
- **C. Price:** full advertised amount, GBP/EUR/USD, per-person or total-party basis and the number of people behind it. Enter unavoidable charges/taxes already included and clearly optional extras separately. Never enter a deposit as the holiday price. State age/occupancy assumptions precisely. A per-person amount is not a total party quote. All checking timestamps use UTC.
- **D. Photos:** shared media library, described featured photograph and up to eight described gallery images. Gallery entries can be removed; replace/reselect to change a description. Supplier logos are managed on the supplier record.
- **E. Publishing:** expiry, existing tags, homepage featuring and explicit offer review. Holiday-guide matching uses the selected holiday types, not keywords or article tags. Tags are optional reusable editorial labels.
- **F. Private supplier information:** source URL, source/agent reference, original supplier price/details and private notes. None appears in public previews, cards, search, metadata, sitemap or enquiry snapshots.

**Save draft** keeps the record private. Save regularly: there is no autosave. Leaving with unsaved work triggers the browser's normal warning; mobile operating systems can still terminate tabs. Failed saves retain your work. A revision conflict means copy your changes before reloading. Saved preview opens in another tab and requires admin access; it does not publish or send an enquiry. Never upload private documents into the shared media bucket.

The dashboard lists real records and real counts, with search, supplier/destination/status, expiring-soon and verification filters and 20-row pages. Edit opens publication/pause/expire/archive controls. There is no destructive delete action. Old slugs stay reserved to their original record and are not silently reused for a different product; a renamed offer's old URL may 404.

## Duplicate, update and verify

Use **Duplicate Offer** in the list or editor to prefill a new unsaved draft. Its UUID/reference are new on first save; slug, check times, publication/promotion expiry, featuring and review approval are reset. The original is unchanged. Supplier, descriptions, price, arrangements, images and private source notes are retained for efficient editing, not treated as reverified.

For a price update, check the supplier again, enter the full revised amount and recheck availability, inclusions, occupancy and booking arrangements. Changing price/currency/basis/people or supplier clears the old check times; editing offer fields clears the per-offer review. Use **Record checks just completed now** only after doing both checks, or enter their accurate UTC times separately. Saving alone never renews verification or expiry.

Publication needs both checks within seven days, a future expiry no later than seven days after the price check, complete supplier/price/travel information, described imagery and explicit review. This conservative seven-day review window is an initial operational rule in both schema validation and SQL; changing it requires a reviewed code/migration change, not an environment shortcut. Choose an earlier expiry where a supplier promotion ends sooner. A past departure, earlier promotion expiry, stale checking date or publication expiry hides the offer automatically through RLS and application checks. No scheduler is needed for this protection. Open browser pages also hide prices at their deadline and recheck when restored.

Use **Pause**, **Expire** or **Archive** to remove an offer deliberately. To republish, complete fresh checks, update expiry and review it again. Revoking supplier permission or closing the owner gate hides all affected offers without deleting their history. “Published” counts mean currently public under the gates; a stored published row can become private automatically. Verification counts highlight missing/stale checks.

## Photographs and permissions

Use only permitted operator materials or photographs you have the right to use for that offer. Record asset conditions/evidence in supplier usage notes and offer notes; obtain approved supplier artwork rather than scraping websites. The existing JPEG/PNG/WebP upload processing and UUID.webp image boundary are reused. The existing bucket is public: draft metadata being private does **not** make uploaded image bytes private or retract copies already downloaded. Obtain permission before uploading, and never use it for agent documents or passenger information. Featured and gallery alt text describes visible content, without unsupported accessibility or availability claims.

## Public browsing

After separate launch approval, `/holiday-offers` supports shareable destination-country, holiday-type, supplier, departure, travel-month, price and board/fare filters, with 12 offers per page. Price-range controls compare the displayed GBP amount and do not convert currencies or equate per-person with party totals. Clear labels on each card/detail page remain essential. Public reads use a fresh anonymous client with no-store fetches, explicit active filters and restrictive RLS. They never use the signed-in admin's broader preview access.

Details attribute the supplier, show the full basis, checking date, travel/occupancy/inclusions/exclusions, booking information and an enquiry link. They do not offer an external booking button. Price/availability must be reconfirmed before progressing. No Product/Offer availability structured data is fabricated. Draft/expired/unapproved detail URLs return 404 and do not enter the public sitemap. The sitemap currently caps offer entries at 1,000; review pagination before exceeding that catalogue size.

At most three featured current offers appear on the homepage. At most three explicitly associated current offers appear on each existing holiday-type guide, in a separate section from articles. Empty selections are hidden. **View Holiday Offers** links to the actual relevant filtered listing. No unrelated or fake offers fill empty space. Publication/pause updates invalidate the relevant routes; expiry is still checked on every request and does not depend on invalidation.

## Offer-specific enquiries

**Ask Jay about this holiday** opens `/plan-my-holiday?offer=PBJO-XXXXXXXX`. The page validates the reference and resolves current public data on the server. The customer sees an optional reference/title/price and may untick it without losing their answers. Questions, stages and customer validation remain unchanged; live submissions remain disabled unless separately approved/configured.

The browser submits only a validated reference and the displayed record's update-version timestamp alongside the usual brief. It cannot submit a trusted price/supplier snapshot. The service-only receiver locks and resolves the current permitted offer and version in the same transaction as durable enquiry creation. A change/expiry before submission is refused rather than silently recording a different quote; the customer can reload the offer or untick it and make a general enquiry.

The database freezes allowed offer details and price in `holiday_enquiries.offer_context` and appends the same information to the **new** notification snapshot. Supplier portals/private notes never enter either. Existing enquiry records, old pending messages and old snapshots are not rebuilt. Duplicate receipts keep the original friendly enquiry reference and snapshot even after the offer changes/expires. Ordinary briefs continue through the unchanged existing receiver. Quotas, retry leases, provider idempotency and durable-storage-on-notification-failure remain intact. Provider acceptance still does not mean confirmed inbox delivery. The existing safe erasure process deletes the whole enquiry row, including this context; permanent enquiry-reference reservations remain.

## Friday review and release

1. Review expiry/verification counts and pause anything uncertain.
2. Check selected supplier promotions in the authorised systems; record source/reference privately.
3. Duplicate comparable offers, then update date, occupancy, total price, checks and an appropriate short expiry.
4. Review assets, attribution, exclusions and the public preview. Save before opening preview.
5. Publish only where the launch/supplier/offer approvals permit it; keep other work as drafts.
6. Check filtered public listings, holiday-guide matches and the homepage as a signed-out visitor. Confirm pausing, expiring and supplier withdrawal remove the offer. Use only authorised synthetic customer details for any separately approved delivery test.

After installation, normal supplier/offer edits need no redeployment or migration. Changing the model, allowed currencies/types, expiry rule or permissions requires a reviewed migration/code release. No hosted migration, approval, deployment, supplier import, live enquiry, reservation or payment has been performed by this work. Remaining launch dependencies are the owner's actual New Travel marketing/asset/booking approvals and the existing separate enquiry/privacy/indexing requirements.

## Local validation and limits

All 64 tests passed, including existing article/enquiry/notification regressions, actual new migrations in a disposable PostgreSQL fixture, supplier uniqueness/permissions, private-field separation, partial drafts, pricing, duplicate reset, expiry, version-checked enquiry snapshots and old receipt/snapshot preservation. Lint, TypeScript and production build passed. A separate labelled browser fixture exercised the real offer editor, inline supplier form, three-card public listing and detail component at 375/390/440/768/1280px without horizontal overflow. Mobile/desktop screenshots were inspected; inline creation retained title/price, with verification deliberately cleared for the changed supplier. A restored/elapsed validity component is also covered by tests. Synthetic offers were never published to the website.

Local production HTTP checks confirmed closed/unconfigured offer listing/detail routes 404, no offer section on homepage/guides, and normal Holiday Brief rendering for an unavailable reference. Signed-out admin responses used Next's streamed login redirect (HTTP 200 with redirect metadata), with no private offer editor, dashboard data or supplier form rendered. Existing ordinary enquiries were not submitted. Jay confirms the original two Phase 8 migrations are installed; the new Phase 8.1 migration remains manual and unapplied by Codex; approved hosted publication, price checks and real offer-specific notification delivery remain owner release checks, not claims made by local fixtures. Before installation, a fixed `holiday_offers_unavailable` diagnostic is expected on optional integrations; it does not activate or fabricate offers. Temporary fixtures/servers were removed/stopped and browser sizing reset.

## Phase 8.1 disclosures

Follow [SUPPLIER-OFFER-COMPLIANCE.md](SUPPLIER-OFFER-COMPLIANCE.md) for the Friday checklist, authoritative sources and the separate supplied vCRM Title/save/generate/check instructions. Public supplier legal/trading name, business/service address, business email/contact, official website and verified applicable ATOL information are edited once in the registry. Agent contact/account references and evidence stay private.

Offers now need supported flights/ATOL classification, matching adult/child counts, full-price confirmation, promotion and booking/cancellation conditions. Genuinely uncalculable mandatory charges need a reason and usable calculation method. Per-person prices apply uniformly to the stated party; use total-party basis for mixed rates. Cards show party price/occupancy, main inclusions/exclusions, material conditions and legal/contact/protection information alongside the price. Details provide complete information and Booking Information. Partial drafts still save.

Supplier changes invalidate linked offer versions/revisions: copy unsaved work and reload an already-open editor. A stale customer offer context must be reloaded before submission. New enquiries capture safe public supplier disclosures; old stored snapshots/emails remain immutable. General enquiry questions, retry/rate-limit/idempotency mechanisms and activation gates remain unchanged.

### Phase 8.1 validation and remaining visual check

The full 65-test suite, lint, TypeScript and production build passed locally using synthetic fixtures. Tests execute the actual new SQL migration and cover preserved old offers/enquiries/snapshots, no automatic supplier approval, public/private projections, direct-write safeguards, ATOL classification, party pricing, stale supplier-version rejection, immutable notifications and existing CMS/enquiry behaviour. No hosted record was modified.

Fresh 375/390/440px visual checks could not be completed: the browser tool returned no available browser. A temporary localhost synthetic preview was built, then stopped and removed. Existing responsive styles and UI tests were checked, but they are not a substitute for browser layout verification. Before release, preview a real authorised draft's cards, details and supplier/offer editor at those widths and desktop; check wrapping, artwork, focus and buttons. The earlier Phase 8 browser results above apply to that earlier version, not the newly expanded disclosure content.
