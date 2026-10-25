# Phase 4 validation — 21 October 2026

## Automated/local checks

- **38 tests passed:** 25 server/database tests and 13 DOM/component tests, including every existing enquiry, reference, retry, CMS-security and deployment-versioning regression.
- ESLint passed without warnings; TypeScript and the Next.js 16.4 Turbopack production build passed using Node 24. No dependencies were added.
- New tests exercise the latest-three published query, ordering/limit/projection, exclusion of drafts/private fields, missing media, empty/error responses, genuine article URLs, image-failure recovery and policy approval boundaries. Existing save/cache tests now also assert homepage invalidation.
- The homepage is dynamic and uses the established anonymous no-store CMS client. It never uses an administrator session to populate public previews. Query failures hide previews and emit a generic server warning rather than showing fake articles or breaking the rest of the homepage.

## Real CMS read

A read-only anonymous request through the new preview loader reached the configured Supabase `content_articles` endpoint and returned **HTTP 200 with zero published previews**. No article/enquiry record was created, modified or published, and no private/editorial table was requested. The empty homepage state was therefore tested against the actual configured CMS. Non-empty title/image/card rendering and draft filtering were tested with controlled fixtures through the real SDK transport and DOM tests; a genuine first published article is still needed for a full hosted article/image publish/edit/unpublish review.

The first local check failed when an old temporary certificate-file path no longer existed. Retrying with supported Node `--use-system-ca` succeeded. Certificate validation was not disabled, and no project/environment credential file or global trust setting was changed. This was a local trust configuration issue, not evidence of a Supabase outage.

## Browser review

A temporary loopback production server on `127.0.0.1:3100` was used, with enquiry submissions disabled **only in that process**. It used the existing configured CMS anonymously. No extra development server, live test enquiry, recovery email or provider write was started.

Actual homepage and Why Jay screenshots/DOM measurements were reviewed at **375, 390, 440, 768 and 1280px**. Neither page had horizontal page overflow. The existing design/hero headline were preserved; the genuine-portrait slot displayed its branded fallback, not a stock person or setup notice. Footer business details/email wrapped, and sample/development/contact/social placeholder copy was absent from the public homepage.

Keyboard checks opened the mobile menu with Enter, followed Why Jay, and confirmed Escape closes the menu and restores the menu-button focus. The review caught that the original skip link scrolled without focusing its target. Public main landmarks were made focusable with `tabIndex=-1`; a rebuilt production review confirmed **MAIN#main-content** receives focus on both homepage and Why Jay. Footer navigation targets measured at least **44px** after refinement. Both pages had one H1; Why Jay had all five ordered journey steps. Browser warning/error logs were empty in the reviewed sessions. This is a scoped visual/keyboard review, not a full assistive-technology audit or claimed Lighthouse score.

## Production-build HTTP checks

| Local route | Result |
| --- | --- |
| `/` | 200; no sample/setup messages; empty CMS preview section hidden |
| `/why-jay` | 200; metadata/title present |
| `/travel-advice` | 200 |
| `/privacy` | 404 intentionally, unapproved |
| `/cookies` | 404 intentionally, unapproved |
| `/booking-information` | 404 intentionally, unapproved |
| `/sitemap.xml` | 200; includes Why Jay, excludes unapproved policies |

Local canonical URLs reflected the existing local SITE_URL/APP_ORIGIN (`http://localhost:3000`), as expected for this environment. Confirm the separately configured Vercel production origin is `https://plannedbyjay.com`; local verification does not establish production DNS or configuration. Root noindex and enquiry/CMS approval gates were not changed.

## Still with the owner

- Approved original portrait/logo files and artwork display conditions; precise legal entity/mandatory regulatory wording; reviewed privacy/cookie/booking documents and operational retention arrangements.
- Non-empty real CMS publishing/photo/preview update check when Jay supplies researched content. An empty library is not itself a launch failure; it is safely hidden.
- Current production enquiry/storage/inbox/retry-scheduler/monitoring, admin authentication/security, backups, domain/HTTPS and indexing approval checks. Existing working functionality was regression-tested locally; no new Resend inbox test or hosted migration was performed.

See [JAY-LAUNCH-CHECKLIST.md](JAY-LAUNCH-CHECKLIST.md), [PRIVACY-READINESS.md](PRIVACY-READINESS.md) and the updated WEBSITE-GUIDE/DESIGN-SYSTEM. No deployment, secrets edit, public submission activation or offers platform was performed. The temporary review server was stopped after verification.
