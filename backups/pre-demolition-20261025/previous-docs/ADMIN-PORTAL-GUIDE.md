# Planned by Jay content portal

## Suppliers and holiday offers

Use **Suppliers** to search, add, edit or archive a record. Enter business details once; existing incomplete preferred records remain available. Use **Holiday Offers > Add Offer**, enter the holiday, price, dates, photo and categories, then save a draft, preview and publish. There is no supplier approval questionnaire, lookup integration or seven-day publication limit. Only actual supplier deadlines expire promotions. Existing articles, enquiries and the separate site launch setting are unchanged.

See [HOLIDAY-OFFERS-GUIDE.md](HOLIDAY-OFFERS-GUIDE.md) for the short everyday workflow and the one consolidated manual **20261030** migration. Do not rerun historical imports or older supplier/offer migrations. Current shared customer wording is in `src/content/offers.ts`.

## Phase 6: discovery setup

Before releasing this version, Jay or the authorised Supabase administrator must manually apply **only** `supabase/migrations/20261023_article_discovery.sql` in the existing project's SQL Editor. Confirm the original `20261014_editorial_cms.sql` and storage setup are installed, review the complete new file and backup arrangements, then run it once as database owner. Do not rerun initial migrations, reset tables or select a different project. The separate enquiry-erasure migration is independent, not a prerequisite. Codex has not applied anything to hosted Supabase.

The transaction adds `content_tags`, `content_article_tags`, two placement booleans, an indexed search vector, RLS and guarded functions. It backfills search vectors without changing existing wording, statuses, revisions, categories, media, private notes or slug history. Both flags default to false; no tags are seeded. The original guarded save becomes an internal core; the extended wrapper retains revision/media/slug checks and saves tags/placement in the same transaction. No new credentials or environment variables are needed. If installation fails, it rolls back; investigate instead of deleting tables or repeatedly running setup SQL.

Verify installation with these read-only checks:

```sql
select to_regclass('public.content_tags'), to_regclass('public.content_article_tags');
select column_name from information_schema.columns
where table_schema='public' and table_name='content_articles'
  and column_name in ('homepage_featured','advice_pinned','search_document');
select indexname from pg_indexes where schemaname='public'
  and indexname in ('content_articles_search','content_articles_featured','content_articles_placement');
```

Then separately authorise the application release and refresh the editor. The earlier application can save through the compatible database wrapper. Releasing new code **before** the migration leaves discovery unavailable and prevents the new editor loading tags; homepage previews use their existing safe error fallback. Never bypass RLS to fix that ordering mistake.

## Tag, feature and pin without code

In **Create/Edit article → Discovery & Placement**:

1. Tick existing tags, or enter **New tag name → Create & select tag**. Case and extra spacing reuse the same tag. Destination/region names can be ordinary tags. Limits: **eight per article**, **40 characters per name**, **100 reusable tags** overall. No default taxonomy was created.
2. Untick and save to remove an association. The tag and article remain intact. Creation saves the reusable label immediately; attachment to the article needs **Save draft** or **Save published changes**. Failures are shown and preserve selections/text.
3. **Featured on Homepage** controls the existing homepage preview, separately from the featured photograph. If any published articles are featured, show only those, up to three: latest original publication, then latest edit, then UUID for ties. With none featured, use the latest published fallback. Drafts/archives never appear.
4. **Pinned in Travel Advice** places a matching published article above ordinary results. It never bypasses search/type/category/tag filters. Multiple pins sort by search relevance when searching, then latest publication and UUID. Without search, publication date and UUID break ties. Pinning does not feature an article on the homepage.
5. Save/publish explicitly as before. Draft settings have no public effect until publication. Published tag/placement edits and unpublishing invalidate homepage/index/article/sitemap paths without redeployment. Revision conflicts, unsaved warnings, image controls and private editorial notes remain protected.

Visitors use `/travel-advice`: enter words, choose type/category/tag dropdowns and press **Search & filter**. PostgreSQL English full-text matching covers title, excerpt, body and tags (whole words/stems, not arbitrary substrings). URL parameters preserve choices for bookmarks/sharing. **Reset filters** clears them and returns to page one. Results are **12 per page**, up to page 1000; only that page's public summaries/images load. Unused/draft-only tags are not public choices. A failed read shows “temporarily unavailable”, distinct from an empty library/no matches.

Filtered/paginated URLs are noindex and canonical to the main index. No tag/destination routes or extra sitemap entries are created; existing indexing approval is unchanged. No external search provider, dependency, tracking or persistent browser storage was added.

## Phase 6 verification and release check

Local SQL fixtures cover preservation, RLS/permissions, tag reuse/limits, title/excerpt/body/tag search, combined filters, matching-only pins, pagination, atomic revisions/tags and slug history. Transport/UI tests cover narrow projections, featuring/fallback, saved controls, errors and URL/reset. Browser mobile checks use local synthetic presentation fixtures, not a production admin login. No hosted content was edited or published.

Final local validation: **47 tests passed**, plus lint, TypeScript and production build. Existing CMS media/slug/RLS regressions also run with the new migration installed in the local fixture database. Search/filter and editor presentation fixtures had no horizontal overflow at 375/390/440px window widths (360/375/425px document widths with scrollbars), and desktop 1280px. Public inputs/selects were at least 48px high; checkbox labels at least 44px. The fixture GET form retained selections in the URL and Reset cleared them. Local production HTTP confirmed noindex/canonical metadata, retained search text and a clear unavailable notice during the current CMS transport failure. This does not verify hosted search before the manual migration/release.

After the approved migration/release, use Jay's own draft/test article to check save/reopen, selected tags and both toggles, then publish/unpublish updates when authorised. Check signed-out discovery excludes drafts/private notes, homepage placement, filtered results, old slug redirects and `/sitemap.xml`. Check pagination when enough genuine articles exist; do not publish synthetic fixtures merely to fill the library.

Phase 3 publishes travel articles from Supabase without VS Code, commits or redeployment. Markdown is the portable source format. Enquiries, notification snapshots, references, Resend and customer permissions remain separate and unchanged. Nothing has been applied to hosted Supabase or deployed by Codex.

## One-time manual setup

Use **Node 22.13 or newer** (Node 24 supported): the current Supabase SDK requires Node 22+. Install locked dependencies with `npm ci`.

1. In your existing Supabase project, open **SQL Editor → New query**. Paste the complete `supabase/migrations/20261014_editorial_cms.sql` and run once. It adds CMS tables, functions, RLS and a private user-ID allowlist. It does not alter enquiry tables. Do not reset the database or rerun the earlier enquiry migrations.
2. Run the complete `supabase/migrations/20261014_editorial_storage.sql` separately, after the CMS migration. In **Storage → editorial-images**, verify public read, 5 MB maximum and `image/webp` allowed. If this bucket already existed, its settings are deliberately left unchanged: verify them manually. Never place private documents or customer files here.
3. In **Authentication**, disable public new-user sign-up. Use **Users → Add user** to create the owner's real account with a strong password. Copy its actual user UUID. No normal Supabase account automatically gets CMS access.
4. Replace the placeholder below with that actual UUID and run in SQL Editor:

```sql
insert into cms_private.administrators(user_id)
values ('REPLACE_WITH_ACTUAL_AUTH_USER_UUID'::uuid)
on conflict (user_id) do nothing;
```

Only accounts in this private table are administrators. Revoke access by removing that account's allowlist row: subsequent server/database checks refuse it. Do not expose `cms_private` as an API schema or grant CMS accounts enquiry access. The default exposed `public` schema is sufficient.

5. In **Authentication → URL Configuration**, set your correct Site URL and add exact callback URLs: `http://localhost:3000/admin/auth/callback` locally and `https://YOUR_CONFIRMED_HOST/admin/auth/callback` for your eventual approved HTTPS host. Avoid broad wildcard redirects. Keep the provider's supported Recovery email confirmation link (default template); recovery uses PKCE, so request and open it in the **same browser**.
6. Configure Supabase Auth email delivery/SMTP and sender verification through the provider. This is separate from enquiry Resend configuration. Test real password recovery; provider acceptance does not prove inbox delivery. Account invitation flows also require the provider's supported email configuration.
7. Add these values **yourself** to local/hosting configuration; Codex has not changed `.env.local`:

```dotenv
CMS_ENABLED=true
SUPABASE_PUBLISHABLE_KEY=YOUR_PROJECT_SB_PUBLISHABLE_KEY
SITE_URL=http://localhost:3000
CMS_PUBLIC_INDEXING=false
```

Keep the existing correct `SUPABASE_URL`. `APP_ORIGIN` must exactly match the browser origin, including the local port. Use only a modern `sb_publishable_...` key for CMS, never the enquiry secret/service key. SITE_URL controls canonical/sitemap URLs; set the confirmed HTTPS public origin on approved launch. Keep indexing false until approval. CMS gates do not activate enquiry submissions.

8. Restart your **single** development server after configuration changes. Open `/admin/login` and sign in. Sign out through the portal navigation. **Forgot your password?** sends recovery through Supabase Auth; password changes require administrator membership too.

## Publish your first article

1. Open `/admin` → **Create new article**. Enter the title; the slug is suggested until manually edited. Choose a content type/category, excerpt and real author display name.
2. Write in the visual **Article body**, or paste formatted text from Word/ChatGPT. Use the toolbar for paragraphs, H2/H3 headings, bold, italic, links, lists and quotations. Unsafe pasted markup is removed; review any conversion notice. Plain text stays literal. For prepared Markdown, use **Paste Markdown** and confirm replacement of the existing body.
3. **Choose or upload image** → select a phone/PC photograph → **Upload photograph** → **Use image**. Add a meaningful featured-image description for this article. JPEG/PNG/WebP up to 5 MB are decoded, rotated, resized to at most 2,400px and re-encoded without EXIF/GPS. SVG, animated images, corrupt files and inputs exceeding 40 million pixels are refused. Identical processed files are deduplicated.
4. For inline images, choose **Photograph**, select/upload through the existing library and enter a meaningful description before insertion. Only this project's dedicated editorial bucket UUID.webp URLs render; external trackers and arbitrary images are excluded. Check images in preview. The bucket is public, including unused/draft photographs: do not upload confidential material.
5. SEO title/description use title/excerpt when blank. Check the search preview. Usually leave canonical URL blank; use an HTTPS original URL only when genuinely appropriate.
6. Add research, fact-check and next-review dates as useful. Sources and editorial notes are **private**, stored in the separately protected `content_editorial` table. They never enter public article queries, previews, metadata or sitemap.
7. **Save draft** stores private content. Preview desktop/mobile in the editor. **Open saved preview** requires sign-in and shows saved data; live preview includes unsaved changes.
8. Choose **Publish article** and confirm. Title, valid unique slug, body, excerpt, author and selected-image alt text are required. Visit `/travel-advice/YOUR-SLUG`. No redeployment is required.

Failed saves retain text and show an error, never a false success. Validation errors link to fields. The browser warns before leaving with unsaved edits. There is no autosave: save regularly, especially on mobile where the operating system can terminate a tab without warning.

### Visual editor and portable Markdown

The editor uses pinned Tiptap 3.32.0 open-source packages (MIT), not a paid service. No additional account, subscription, hosted setup or database migration is needed. The owner confirms the earlier Phase 6 discovery migration is already applied; do not repeat it for this editor.

Markdown remains the stored format and the public sanitised renderer is unchanged. Opening an existing article does not rewrite its body. **Markdown source** remains available. Unsupported source (such as raw HTML, footnotes or task lists) opens in source mode intact. Tiptap's Markdown support is beta, so conversion is checked before saving: unsupported visual structures block save/preview and offer a reviewable conversion rather than silently discarding content. Cancelling an unsupported rich paste preserves the article; alternatively insert its words as plain text.

**Insert table** creates a simple header table. Add/remove rows or columns using the contextual controls. Keep one paragraph per cell, without merged cells, embedded images or line breaks; use separate rows for additional entries. Check the public preview. Complex Word tables may need simplification. Undo/redo and familiar bold/italic keyboard shortcuts work in visual mode; toolbar buttons support keyboard navigation. On narrow screens the toolbar wraps and wide tables scroll within the editor.

Local verification covered 375/390/440px layouts, visual formatting, table controls, library-image insertion and a synthetic draft save. Clipboard sanitisation/conversion is covered with Word/ChatGPT-style fixtures; this is not a claim of testing every native Word version or mobile clipboard.

Editor validation: all 53 existing/new tests, lint, TypeScript and the production build passed. No hosted article or provider setting was changed during these checks.

## Everyday management

- **Articles** searches titles, filters category/status, sorts latest/oldest updates and pages through records. Edit, preview, publish, unpublish and archive are available.
- **Save published changes** updates live content. **Unpublish & save draft** removes it from public pages/listings/site sitemap. External search engines may retain previously crawled copies.
- **Archive** retains content and private notes. Open it later to edit or publish again.
- Changing a slug keeps permanent redirects from previously published URLs while the article is published. Unpublishing hides old redirects too. All assigned slugs remain reserved; choose a new one for conflicts, rather than removing URL history.
- Revision checks prevent overwriting another tab/editor's changes. On conflict, copy unsaved work, reload and reconcile.
- While editing, choose **+ Create new category** or **+ Create new content type**, enter a name and select **Create and select**. The choice is saved and selected without leaving the page. Names differing only in case or repeated spacing reuse the existing choice. Category maintenance remains available at `/admin/categories`. Categories are not deleted through the portal.
- Under **Discovery & Placement**, enter **New tag name** and choose **Create & select tag**. Classification creation does not save/publish the article: body, photographs, metadata and private notes remain in the current draft. Failures leave your work in place; retry or cancel. Save the article to persist its selections.
- The editor groups fields into **Article**, **Discovery & Placement**, **SEO** and **Editorial**. Required author details remain visible; SEO defaults can stay blank. Public preview/publishing remain explicit actions.
- Content types now come from `public.content_types`; client/server input checks bound names, the save service checks registry membership, and the database enforces it with a foreign key. Public filters read that registry and article labels accept its names. SEO remains generic Article metadata, with no fixed content-type mapping to update. `src/content/cms.ts` retains initial fixture formats and editable interface copy, not the live registry. Renderer configuration is in `src/components/cms/Markdown.tsx`; keep sanitisation enabled.

### Manual migration for inline classification

Before releasing this editor update, open the correct Supabase project's SQL Editor and run the complete `supabase/migrations/20261024_inline_classification.sql` file once, after the already-applied `20261023_article_discovery.sql`. Review the project and take your normal backup first. This migration has not been applied automatically.

It creates/seeds the content-type registry, replaces the six-value CHECK with a restrictive foreign key, and adds guarded classification creation plus category duplicate protection. It does not rewrite articles, rename categories, remove legacy duplicates, or touch enquiries. Existing type names remain valid. Existing duplicate categories, if any, remain assigned; new equivalent names reuse an existing row. Renaming to an already-used category name is refused. There is a 100-type registry limit and names are limited to 80 characters. Only allowlisted administrators can create classifications; public/authenticated read access does not grant writes. SQL is transactional: on failure roll back and investigate, rather than removing constraints or rerunning fragments.

Apply this migration before deploying the matching application, then create a draft, add a category/type/tag, save, preview and explicitly publish when ready. Check the new type in `/travel-advice` filters. Classification changes need no further redeployment once this release/migration is installed. Never drop the registry to roll back while articles reference it.

Local classification validation: all 54 tests passed, including the actual migration in disposable PostgreSQL fixtures, admin/non-admin permissions, duplicate reuse, unchanged existing article records, custom-type publishing/search, public filter options and retained drafts after failures. Lint, TypeScript and production build passed. A synthetic browser fixture at 375/390/440px showed no horizontal overflow; inline creation selected the category while retaining the article body. No hosted migration or real article write was performed.
- `/admin/media` uploads, previews and removes unused photographs. The latest 200 images appear in the library; older selected featured images load separately. Used images cannot be deleted, including draft/archived/inline uses. Remove or replace all uses and save first. Replacements create new objects rather than overwriting shared images.
- Dashboard figures are real database counts and recent updates. Due reviews cover drafts/published articles with dates today or earlier. No reminders or scheduled publisher exist; `scheduled_at` is an unused future extension point.

## Troubleshooting

**Awaiting setup / access denied:** check gates, publishable key, exact origin, migrations, user status and allowlist UUID. Restart the single server after config changes. Never put secret/service keys in CMS config or browser screenshots.

**Recovery fails:** check provider redirects, default recovery template, Auth SMTP/rate limits; request a fresh link and open it in the same browser. Enquiry email settings do not configure Auth delivery.

**Save fails:** check fields and slug conflicts. Text remains in the editor. A revision conflict needs reconciliation; a connection failure can be retried. Article data, private notes and image usage commit in one transaction.

**Upload fails:** verify file format, size, dimensions, bucket and policies. Export iPhone HEIC as JPEG first. Restart after SUPABASE_URL changes so Next's image allowlist updates. Visually similar but differently processed files may not deduplicate.

**Cleanup fails:** registry deletion happens under foreign-key protection before Storage removal. If Storage then fails, the portal reports an unused orphan object. In Supabase Storage remove only the unused UUID.webp object named in the failed operation, after checking there is no registry row/article use. Failed upload registration also attempts cleanup. Never remove objects referenced by `content_media`.

**Old published content:** public fetches use anonymous `no-store` requests. Saves invalidate the index, full article route pattern and sitemap. Refresh; verify one application instance and rebuild if running production from changed source. The existing application-version mechanism remains intact.

## Routes and verification

Admin: `/admin/login`, `/admin/reset-password`, `/admin/auth/callback`, `/admin`, `/admin/articles`, `/admin/articles/new`, `/admin/articles/[id]/edit`, `/admin/articles/[id]/preview`, `/admin/media`, `/admin/categories`. Public: `/travel-advice`, `/travel-advice/[slug]`, `/sitemap.xml`. APIs: `/api/cms/auth`, `/api/cms/articles`, `/api/cms/articles/status`, `/api/cms/categories`, `/api/cms/media`.

Every protected page/operation verifies a server session and allowlist membership; database/storage policies provide a second boundary. Mutations verify Origin. The refresh Proxy is scoped to admin/CMS routes. Session cookies are HttpOnly, SameSite=Lax and Secure over HTTPS. Private responses are no-store and noindex. There is no public signup or enquiry dashboard; offer management uses the existing protected CMS boundary.

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` with Node 22.13+. Disposable PGlite tests apply migrations and exercise anon/non-admin/admin policies, drafts/notes, publication, old URLs, conflicts, Storage restrictions and enquiry isolation. Component tests cover Markdown safety, hydration, save failures, unsaved work and preview. These do not prove hosted Auth/SMTP/Storage setup or real email delivery.

After manual setup, use signed-in and signed-out browsers: create a draft and confirm its public URL/sitemap entry are absent; publish; check body and metadata; rename and check redirect; edit; unpublish and check both URLs; attempt used-photo deletion; try an unallowlisted account; test recovery and sign-out. Review 375/390/440px, tablet and desktop before launch. No live configuration or deployment has been performed.

See [CMS-VALIDATION.md](CMS-VALIDATION.md) for the executed local checks, real browser layout review and precise limits of the hosted-service verification.
