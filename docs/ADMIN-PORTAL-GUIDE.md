# Planned by Jay content portal

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
2. Paste prepared Markdown into **Article body**. Headings, emphasis, lists, quotes, links and GitHub-style tables retain formatting in **Preview article**. Raw HTML/scripts are ignored. Body `#` headings render as H2, because the article title is already H1; keep further headings in logical order.
3. **Choose or upload image** → select a phone/PC photograph → **Upload photograph** → **Use image**. Add a meaningful featured-image description for this article. JPEG/PNG/WebP up to 5 MB are decoded, rotated, resized to at most 2,400px and re-encoded without EXIF/GPS. SVG, animated images, corrupt files and inputs exceeding 40 million pixels are refused. Identical processed files are deduplicated.
4. For inline images, copy a library image link and paste `![Descriptive alt text](COPIED_IMAGE_URL)` into Markdown. Only this project's dedicated editorial bucket UUID.webp URLs render; external trackers and arbitrary images are excluded. Check images in preview. The bucket is public, including unused/draft photographs: do not upload confidential material.
5. SEO title/description use title/excerpt when blank. Check the search preview. Usually leave canonical URL blank; use an HTTPS original URL only when genuinely appropriate.
6. Add research, fact-check and next-review dates as useful. Sources and editorial notes are **private**, stored in the separately protected `content_editorial` table. They never enter public article queries, previews, metadata or sitemap.
7. **Save draft** stores private content. Preview desktop/mobile in the editor. **Open saved preview** requires sign-in and shows saved data; live preview includes unsaved changes.
8. Choose **Publish article** and confirm. Title, valid unique slug, body, excerpt, author and selected-image alt text are required. Visit `/travel-advice/YOUR-SLUG`. No redeployment is required.

Failed saves retain text and show an error, never a false success. Validation errors link to fields. The browser warns before leaving with unsaved edits. There is no autosave: save regularly, especially on mobile where the operating system can terminate a tab without warning.

## Everyday management

- **Articles** searches titles, filters category/status, sorts latest/oldest updates and pages through records. Edit, preview, publish, unpublish and archive are available.
- **Save published changes** updates live content. **Unpublish & save draft** removes it from public pages/listings/site sitemap. External search engines may retain previously crawled copies.
- **Archive** retains content and private notes. Open it later to edit or publish again.
- Changing a slug keeps permanent redirects from previously published URLs while the article is published. Unpublishing hides old redirects too. All assigned slugs remain reserved; choose a new one for conflicts, rather than removing URL history.
- Revision checks prevent overwriting another tab/editor's changes. On conflict, copy unsaved work, reload and reconcile.
- `/admin/categories` adds and renames categories, retaining article assignments. Categories are not deleted through the portal. Content types/editor copy live in `src/content/cms.ts`; changing available types also requires a matching database CHECK migration. Renderer configuration is in `src/components/cms/Markdown.tsx`; keep sanitisation enabled.
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

Every protected page/operation verifies a server session and allowlist membership; database/storage policies provide a second boundary. Mutations verify Origin. The refresh Proxy is scoped to admin/CMS routes. Session cookies are HttpOnly, SameSite=Lax and Secure over HTTPS. Private responses are no-store and noindex. There is no public signup, enquiry dashboard or offers integration.

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` with Node 22.13+. Disposable PGlite tests apply migrations and exercise anon/non-admin/admin policies, drafts/notes, publication, old URLs, conflicts, Storage restrictions and enquiry isolation. Component tests cover Markdown safety, hydration, save failures, unsaved work and preview. These do not prove hosted Auth/SMTP/Storage setup or real email delivery.

After manual setup, use signed-in and signed-out browsers: create a draft and confirm its public URL/sitemap entry are absent; publish; check body and metadata; rename and check redirect; edit; unpublish and check both URLs; attempt used-photo deletion; try an unallowlisted account; test recovery and sign-out. Review 375/390/440px, tablet and desktop before launch. No live configuration or deployment has been performed.

See [CMS-VALIDATION.md](CMS-VALIDATION.md) for the executed local checks, real browser layout review and precise limits of the hosted-service verification.
