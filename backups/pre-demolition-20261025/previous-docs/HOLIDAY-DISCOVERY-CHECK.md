# Holiday discovery investigation

Read-only live checks: 25 October 2026. No hosted writes, publication, gate changes, credentials changes or deployment performed.

| Check | Confirmed result |
| --- | --- |
| Configured Supabase project, anonymous `holiday_offers_enabled()` | HTTP 200, **false** |
| Same project's anonymous `holiday_offers` read | HTTP 200, empty array under RLS |
| Production `https://plannedbyjay.com/holiday-offers` | HTTP 404 |
| Production `/holidays` | HTTP 200; no link to `/holiday-offers` in returned HTML |
| Existing localhost port 3000 | Connection refused; no server started |

The configured project's disabled global gate conclusively hides all its offers under the existing public-read policy, regardless of categories. Production 404 is consistent with that gate. Vercel environment/project identity was not inspected, so the local configuration is not proof of which Supabase project Vercel uses. The specific published offer's reference was not supplied during investigation; its saved status and private supplier/hold state cannot be established through an anonymous read that hides all rows. No administrator session or privileged key was used. This report does not claim to have inspected that private row or proven there are no additional blockers.

Initial network requests failed certificate validation; retrying with Node's supported system certificate store succeeded, with TLS validation retained. No browser inspection is claimed.

## Source findings and corrections

- The main catalogue already queries published rows without a category predicate. Category predicates apply only when explicitly filtering. Homepage uses Featured; category pages use their matching style. All use `loadOffers` and RLS.
- Non-empty categories were nevertheless required by application publication validation and two database guards. New migration **20261101_optional_offer_categories.sql** removes that requirement only, after 20261031. It does not reclassify, publish, or rewrite existing offers.
- Historical seven-day `expires_at` and old permission dates are not filters in the current application/20261030+ public guards. Actual travel dates, supplier deadlines, archive/restriction and applicable checked protection facts still matter. An old deployment/migration must be reconciled before attributing its behaviour to current source.
- Public fetches use `cache: no-store`; catalogue, category, detail and homepage routes are dynamic. Save invalidates catalogue, homepage, category/detail patterns, discovery and sitemap. No source evidence of a stale seven-day cache was found. Live cache/revalidation behaviour cannot be proven for an invisible offer or an unverified deployed release.
- Added the prominent catalogue action to Explore Holidays and a navigation/footer link. Six inspirational guides and existing All-inclusive filtering remain.
- Admin dashboard displays the global gate. Saved editor/publication feedback checks gate, factual blockers, database guard and an actual anonymous catalogue read. Failed verification warns explicitly, while preserving the successful save. Private diagnostics remain admin-only; no new RPC/table/system was introduced.

## Owner actions

1. Review/apply migration **20261101** manually after **20261031**, then authorise deployment of the matching code when ready. No existing record needs a category added or removed.
2. Check the intended production project and whether its public-offers gate is deliberately closed. If so, separately approve/perform the existing launch procedure. This task does **not** authorise opening it; enquiry launch gates remain separate.
3. Open the saved offer editor to see the visibility notice, confirm its published status and follow any actual supplier/deadline/review-hold explanation. Preserve unsaved edits before reloading. Do not republish solely to bypass a deliberately closed gate.
4. After the authorised release/gate decision, visit `/holidays` > **View All Holiday Offers** > the holiday > **Ask Jay about this holiday**. Check the unfiltered catalogue, optional category and All-inclusive filters, direct detail URL and Featured homepage placement. No enquiry submission is required for discovery verification.

Validation: all 70 tests (38 server, 32 UI/route fixtures), lint, TypeScript and production build passed. Database fixtures cover uncategorised packages, family/cruise placements, drafts, elapsed deadlines, disabled gate and unchanged records. Route fixtures exercise catalogue/All-inclusive/category/detail/homepage reads and fresh results after content changes; save invalidation targets remain covered. Admin UI fixtures ensure a hidden publication cannot display the unqualified publication-success message. These do not certify a live offer's saved state or enable public availability.
