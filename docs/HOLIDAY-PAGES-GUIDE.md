# Explore Holidays: owner's guide

`/holidays` introduces six styles, with pages at `/holidays/family`, `/holidays/cruises`, `/holidays/couples`, `/holidays/city-breaks`, `/holidays/something-different` and `/holidays/accessible`. These are planning guides, not offers or a booking engine. No database migration, new dependency or external service is needed.

## Change words and photographs

Edit `src/content/holiday-types.ts`. `holidayDiscovery` holds the landing wording and shared section/button labels. Each typed `holidayTypes` entry holds:

| Field | Changes |
| --- | --- |
| `slug` | URL segment; retain published slugs to avoid broken links |
| `title`, `headline`, `description`, `summary` | Page name, H1, introduction/SEO description and landing-card summary |
| `image.src`, `image.alt`, `image.position` | Local file, visible-content description and crop focal point |
| `introduction`, `considerations`, `ideas`, `questions` | Explanation, planning points, styles and expandable questions |
| `related.tags`, `related.categories`, `related.contentTypes` | Exact taxonomy names selecting related published reading |
| `alsoExplore` | Slugs of related holiday pages |
| `cta` | One final invitation and Holiday Brief link |

The shared template is `src/components/holidays/HolidayPages.tsx`; CSS is scoped to `.holiday-page` in `src/app/globals.css`. Routine wording and crop changes need no JSX edits. Source/asset changes need owner-authorised redeployment.

Existing files in `public/images/destinations/` are reused without copies: `family.jpg`, `cruise.jpg`, `couples.jpg`, `city.jpg`, `different.jpg`, `accessible.jpg`. No new photography is required. Confirm/retain image rights during the existing owner image review. These are illustrative settings: the sea is not a specific ship, the villa is not a bookable product, and the accessible-page photograph is not proof of access facilities.

For replacements, use landscape JPG/WebP around 1,600 × 1,200px (4:3), with room for cropping. Landing cards and mobile heroes use 4:3; desktop heroes fill a taller panel. `image.position: '50% 50%'` centres the cover crop; change the percentages to move its focus. Check phone and desktop. Describe the visible image accurately in `alt`. Missing images have a labelled neutral fallback. Replacing a shared file also changes the homepage; add a new filename and change only this config for a page-specific replacement.

## Connect articles through the existing CMS

In the article editor, create/select the appropriate tag or category, save and explicitly publish. No redeployment is needed for article changes. Examples: Family matches `Family Holidays`, `All-inclusive`, `School Holidays`; Cruises matches `Cruises`, `First-time Cruisers`, `Cruise Planning`; Accessible Travel matches `Accessibility`, `Accessible Travel`. See each entry's `related` for the complete names.

Matching ignores case and repeated spaces but is not fuzzy: `Cruise` does not match `Cruises` unless configured. Tags, categories and configured types are alternatives (OR). Leave `contentTypes` empty unless a type is sufficiently specific; broad `Travel advice` would bring unrelated articles. Use the existing inline creation controls, not a separate mapping system.

The loader uses the existing anonymous CMS client, published-only queries and RLS. It requests narrow previews, never bodies/private notes/sources. It selects up to three candidates per matching criterion, merges them, deduplicates article IDs and displays at most three, newest publication first with ID tie-breaks. Taxonomy lookup is bounded to 100 names, consistent with existing discovery filters/tag limits; extend that boundary deliberately if the category registry grows beyond it.

No matching reading means no related section. A CMS failure also hides that section, records only a fixed error code and leaves the guide usable. No sample articles are substituted. A Travel Advice library link remains available. Missing article images use the existing text fallback.

Detail pages are dynamic, and the public client's reads are `no-store`. Save/publish/unpublish changes appear on the next request, including for administrators browsing publicly. Existing article cache invalidation is unchanged. No second CMS, database table or permission change is added.

## Add another style

1. Add a complete entry in `holidayTypes` with a unique lower-case hyphenated slug, distinct text, photograph, relevant taxonomy and valid `alsoExplore` slugs. Keep its final action at `/plan-my-holiday`.
2. Landing cards, dynamic route, metadata and sitemap derive from this array. Unknown slugs return 404. Review title/description/crop and cross-links.
3. The homepage deliberately retains six cards. Edit `src/content/home.ts` separately if changing that selection; navigation is in server-owned `src/content/navigation.ts`.
4. Update tests that deliberately assert the six launch styles, run tests/lint/typecheck/build, inspect phone/desktop and authorise a release. Config changes require redeployment; CMS article/tag changes do not.

## Boundaries and release review

The Holiday Brief questions, records, validation and activation gates are unchanged. No preselection is implemented. `cta.action.href` is an extension point for a separately designed future preselection flow, not permission to bypass validation.

Complex bookings need the appropriate authorised New Travel structure, with organiser/responsibilities identified. Accessibility remains individual and supplier-confirmed: no blanket guarantees, inspection claims or requests for detailed medical information. Metadata is ordinary page/Open Graph information, with no invented ratings/offers or FAQ schema. Root indexing restrictions remain unchanged.

Phase 8 now supplies a separate `OfferSection` before the final CTA, distinct from editorial cards. It appears only for current, permitted offers explicitly associated with the guide's holiday type. Otherwise it is omitted. Its **View Holiday Offers** button opens the actual type-filtered `/holiday-offers` listing. There is no automatic supplier feed or empty promotional section. The offers system has its own manual migrations and independent owner/supplier approval gates; see [HOLIDAY-OFFERS-GUIDE.md](HOLIDAY-OFFERS-GUIDE.md). Installing the Phase 7 guides alone does not activate offers.

Before release, review copy/photography rights, card destinations, mobile crops and actual hosted related-reading publication/unpublication. Local fixtures do not prove hosted CMS availability. No deployment or live activation is performed by this guide.

## Phase 7 validation

All 57 tests, lint, TypeScript and production build passed. Production HTTP checks returned 200 for the landing page and six guides, with a single H1, canonical and description on each; an unknown slug returned 404. All seven rendered pages were measured at 375/390/440/768/1280px without horizontal overflow. Desktop/mobile screenshots were inspected, and a keyboard-operated question opened with its focus clear of the sticky header. A separately labelled synthetic three-article layout also passed those five widths, including 44px reading labels and missing-image fallbacks. This fixture was removed afterwards; no sample articles were published.

Anonymous reads against the existing configured CMS succeeded for all six pages, and the published-tag relational query returned HTTP 200. There were zero currently matching articles. Actual hosted publication/unpublication of a matching article was not performed: verify this during the owner release review. An initial local certificate-trust failure was resolved for verification by starting the temporary Node process with its system CA store; no website, credential or provider setting was changed for that. Temporary servers/tabs were closed and viewport overrides reset. The existing development server was not replaced.
