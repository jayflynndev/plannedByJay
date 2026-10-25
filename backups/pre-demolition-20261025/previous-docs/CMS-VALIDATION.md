# Phase 3 verification — 13 October 2026

## Executed locally

- All 32 automated tests passed (21 server/database tests and 11 DOM/component tests), including the complete existing enquiry suite. A real Supabase SDK transport test also checks the CMS transaction's explicit JSON response format without contacting a hosted service.
- ESLint, TypeScript and the Next.js 16.4.0 Turbopack production build passed, using the bundled Node 24.19 runtime. Use Node 22.13+ for everyday development; the machine's older default Node 20 is not supported by the new Supabase SDK.
- Both new SQL migrations were applied only inside a disposable local PGlite test database. Tests exercised anonymous, authenticated non-admin and allowlisted admin roles; article creation/editing/publication/unpublication/archive; protected drafts and notes; slug conflicts/history; stale-revision failures; Storage access restrictions; inline media deletion protection; and continued enquiry access denial for CMS users.
- Image tests decoded real generated JPEG data, verified WebP output and EXIF removal, refused mismatched MIME/content, SVG, corrupt and oversized input, and checked deterministic content hashing.
- Component tests checked Markdown headings/emphasis/lists/quotes/tables, blocked HTML/scripts/unsafe links/external image tracking, tested hydration after browser HTML parsing, and exercised unsaved-work warnings, retained text on failed saves, explicit publishing and preview.
- Publishing-service tests confirmed failed database operations do not report success or invalidate caches, while successful saves invalidate public index, sitemap, current article and all article URL variants.

## Browser review

A temporary production server was bound to loopback port 3000 only after confirming there was no existing application listener. CMS remained disabled in that process. No live account, article, migration, upload, password recovery or enquiry submission was created.

Browser screenshots and DOM measurements were inspected at **375, 390, 440, 768 and 1280px** for the actual editor, public ArticleView/Markdown, MediaLibrary and AuthForm markup/styles, rendered with clearly labelled local test content. These isolated static fixtures were used because hosted Auth/CMS configuration was intentionally not applied. They were removed after review; they were never a substitute for the working database-backed portal.

No horizontal page overflow was measured. The editor stacked at mobile/tablet widths and used two columns on desktop. Inputs used 16px text; publication/upload actions remained usable. At 390px, the focused Markdown input's top was about 229px while the sticky header ended at 81px. At 440px, the focused publication control was also below the header. At 375px, a three-column article table scrolled within its 316px container rather than widening the page. Featured image loading was confirmed, and the article CTA was visually reviewed. The production `/travel-advice` empty state and `/admin/login` configuration boundary loaded without browser warning/error logs.

## Still requires manual verification

Hosted Supabase Auth/cookie refresh/revocation, real recovery SMTP/inbox delivery, hosted PostgreSQL/PostgREST and Storage uploads/deletions, real article publishing/redirects/metadata/sitemap after setup, and the authenticated dashboard/list/category screens have not been reviewed end to end against the live project. PGlite validates PostgreSQL logic and RLS, not hosted provider configuration or real overlapping transactions on a live PostgreSQL server. Run the signed-in/signed-out checklist in ADMIN-PORTAL-GUIDE.md after manual setup, including a real phone photo upload and an unallowlisted-account attempt.

Nothing was deployed. No enquiry source, enquiry migration, Resend integration, immutable email snapshot or `.env.local` was changed. The temporary production server was stopped after review. Phase 4 was not started.
