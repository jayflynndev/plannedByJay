# Holiday Types CMS

## Manual setup and release

The existing Articles Supabase configuration and confirmed administrator account are reused. No new environment variables, keys, login, storage bucket or paid service is required.

Before deploying this release, copy **`supabase/migrations/20261026_holiday_types_cms.sql`** into the existing Supabase project's SQL Editor and run it as database owner. The Articles migration must already have been applied. Run only the new Holiday Types migration; do not re-run the original Articles setup. Nothing has been applied to hosted Supabase automatically.

The new migration creates one `holiday_types` table, its index, trigger and RLS policies, then imports the six original pages in their existing order. It can be run again safely: matching seed IDs are left alone, including any subsequent edits and publication status. It does not change Articles, authentication or storage objects. A conflicting slug on another ID stops the transaction rather than overwriting content.

The original names, headings, card introductions, all non-FAQ page copy, local photograph references, image descriptions/crops and closing invitations are retained. The previous hero description is included at the start of the editable body; the short introduction is shared by cards, page headers and metadata. Existing image files remain in place. FAQ material is excluded. The six original IDs cannot be deleted, and their slugs stay permanent; they can be unpublished.

The database becomes the only source of Holiday Type records. There is no hard-coded public fallback. Apply the migration before deploying so the six routes remain populated. On database failure, the landing page reports unavailability and the homepage remains usable; individual pages do not fall back to potentially unpublished copy.

## Everyday editing

Open **Admin → Holiday Types**. Select **Edit**, or **Add Holiday Type** to create a draft. Enter the name, short introduction and content. The heading defaults to the name, and a short URL is suggested automatically (for example, All-Inclusive → `all-inclusive`, Solo Holidays → `solo`). A new URL can be edited before first publication. Published URLs remain fixed, even after unpublishing.

Use the existing visual editor and photograph selector. Word/ChatGPT paste retains supported formatting; the server removes unsafe HTML. Original local photographs remain selected until replaced. New photographs use the same public `article-images` library and upload limits as Articles. Closing invitation text can be changed in its optional expandable section; its button always leads to `/plan-my-holiday`.

**Save Draft** keeps new work private. **Preview** shows current text privately without saving. **Publish** makes the type public; **Save Changes** updates an already-published type without unpublishing it. **Unpublish** asks for confirmation and returns it to drafts. The list also permits confirmed deletion of new types. Original types show a protection explanation instead of Delete.

Progress and persistent results appear beside the action buttons and are announced accessibly. Publication supplies View Holiday Type and Copy Link. Failed saves retain the editor content. Editing is temporarily locked during requests; version checks prevent one tab from silently overwriting another. Save regularly: there is no background autosave or browser recovery store.

Published records automatically supply `/holidays`, `/holidays/[slug]`, homepage holiday cards, descriptions, canonical/social metadata and sitemap entries. The original six stay in order; new types follow by creation date. Drafts and unpublished types return 404 publicly and are omitted from public cards and the sitemap. No manual SEO entry is needed. The existing site-wide noindex setting remains unchanged.

The existing Holiday Brief now has its own enquiry setup and activation procedure; see [BESPOKE-ENQUIRIES.md](BESPOKE-ENQUIRIES.md). The template has no FAQ section or empty offers section. Published eligible offers now reference stable Holiday Type IDs through the Holiday Offers module and appear on each selected type's page; the section is omitted when there are no matches. See HOLIDAY-OFFERS.md. The separately authorised private supplier directory is documented in SUPPLIERS.md.

## Validation and remaining owner checks

Automated checks apply both real migrations to isolated in-memory PostgreSQL and cover seed preservation, re-runs after edits, RLS, protected URLs/deletion, publishing/unpublishing, formatted paste, media selection, failed-save preservation, private previews, metadata, sitemap and the Articles regression suite. No hosted test records are created.

After the owner applies the migration and deploys, verify the existing login and the six pages against the real project. Local fixture tests do not establish hosted sign-in, upload or publication success. Browser visual checks could not be completed: the computer-use safety check could not determine Chrome's current URL confidently and ended the browser session.

Final local results: all 25 automated tests, ESLint, TypeScript validation and the production build passed. Tests used a temporary WebSocket preload because the installed shell runtime is Node 20; this adds no project dependency and was removed after testing. Use the already-declared Node 22.13+ runtime for normal project commands. Temporary preview routes and the local development server were removed/stopped.
