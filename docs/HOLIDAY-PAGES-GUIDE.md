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

## Current content availability

The six guides remain static public pages with their existing images/copy. Backend related-reading and offer queries have been removed. Their optional presentation sections remain hidden when empty. Travel Advice and All Holiday Offers have honest empty states; old individual article/offer URLs return 404. Do not invent offers or reconnect archived data. Use src/content/holiday-types.ts for existing guide edits. See BACKEND-REMOVAL.md for recovery and reset status.
