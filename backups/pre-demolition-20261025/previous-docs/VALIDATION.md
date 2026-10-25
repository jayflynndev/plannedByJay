# Phase 1 validation — 12 October 2026

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed; homepage statically prerendered.
- Homepage HTTP response: 200 at http://localhost:3000; all 21 internal anchor links have existing targets. The optimised hero image endpoint also returns 200.
- Local photography downloaded and decoded; all ten configured image files are present.
- `npm audit --omit=dev`: zero vulnerabilities reported.
- Full audit: five high findings in the lint-only dependency chain, rooted in the braces stack-exhaustion advisory GHSA-vfj7-8cjw-p6xm. npm proposes downgrading eslint-config-next to 14.2.35; that was not applied to a Next.js 16 project. Recheck for a compatible upstream patch before release.
- Node 20.11.1 passed these checks, but the lint dependency eslint-visitor-keys declares a newer Node requirement. Use current Node LTS, at least 22.13, for ongoing development.
- Browser visual, keyboard-interaction and Lighthouse verification could not be completed: the available browser-control inventory contains no browsers. Review desktop, mobile, menu Escape/focus, anchor links and image crops in your browser before launch. No Lighthouse scores claimed.

The site remains development-only: noindex metadata, no live enquiry form, explicit contact/legal/policy/portrait placeholders, sample editorial previews, no deployment or external service integrations.

## Phase 2 — holiday enquiry foundation

The Phase 1 notes above are historical. Phase 2 now adds `/plan-my-holiday` and server handlers; submissions remain disabled until configured.

- `npm test`: 12 tests passed (10 validation/security/email/PostgreSQL tests and 2 DOM interaction tests).
- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed, including tests.
- `npm run build`: passed; homepage stays statically rendered and enquiry/API routes are dynamic.
- HTTP checks: homepage and enquiry page return 200; homepage CTAs use the new route; disabled submission/session/retry endpoints return 503 with safe responses.
- Local PostgreSQL migration tests verify anonymous/authenticated denial, duplicate UUID/content handling, email/session quotas, notification leases, stale-worker recovery, backoff, provider acceptance and manual review after the safe retry window. These use PGlite, not a configured Supabase project, and do not establish cross-instance deployment behaviour.
- DOM tests verify all stages, conditional child ages/dates/departure questions, retained answers, stage/error/confirmation focus, keyboard radio activation, telephone requirements, submission loading lock, duplicate clicks, safe failure and same-UUID retries.
- Notification tests use mocked provider success/failure/timeout responses. They verify complete plain-text/escaped HTML summaries and stable provider idempotency payloads. No actual provider acceptance, inbox delivery or email-client visual rendering is claimed.
- A browser inventory was checked and contains no browsers. Real desktop/tablet/mobile visual, complete keyboard-navigation and Turnstile widget checks remain outstanding.
- `npm audit --omit=dev`: zero production dependency vulnerabilities reported after Phase 2 additions. Existing full audit findings are development-only (lint dependency chain).
- The new foundation has no configured external credentials, scheduler or public enquiry enablement. Verify providers, recovery, monitoring, privacy and live approval before launch.

## Phase 2 mobile form refinements

- All 13 tests, lint, TypeScript and the production build pass.
- Updated tests cover optional free-text departure preferences, multiple airports/ports/no preference, trimming and the 300-character limit, stored JSON shape, email text/HTML, previous notification snapshots, delayed validation, live error correction without focus loss and retained Edit answers.
- Departure data now uses `brief.departurePreferences`. No Supabase migration is needed; the JSONB column and RPC arguments are unchanged. Older records and immutable queued email snapshots are preserved.
- The development notice remains conditional on the existing enabled prop; launch configuration and submission gates were not changed or activated.
- Mobile CSS was reviewed for the 375px, 390px and 440px target range; wrapping, input minimum widths, action wrapping and sticky-header focus handling were adjusted. Actual rendered overflow/readability checks at those widths remain unverified: the available browser inventory is empty. DOM tests do not measure layout.

## Application-version safeguards

All 19 tests, lint, TypeScript and a clean production build pass. A retained-state reproducer demonstrates the missing departure string, and the hydrated three-stage journey passes with `departurePreferences: ''` through strict validation and no hydration warnings. Email/submission responses in that journey are mocked; integrations and records are untouched.

A temporary loopback production server on port 3100 served eight consistent HTML responses and nine matching versioned JS assets, with current departure initialization and no obsolete airport UI. It was stopped after checks; no development server was launched on port 3000. The owner's browser cache/service-worker retention mechanism remains unverified because no browser is connected. See [APPLICATION-VERSION.md](APPLICATION-VERSION.md) for the distinction between reproduced state failure, implemented safeguards and remaining browser verification.

## Friendly reference refinement — 13 October 2026

All 22 tests, lint, TypeScript and the production build pass. The additive migration was executed only against disposable local PGlite fixtures, not the live Supabase project. Tests cover repeated random generation, six-digit bounds, forced collisions and bounded failure, overlapping allocations, stable duplicate references, untouched pre-migration rows/email snapshots/provider IDs, rollback of collision quota changes, permanent reservation after fixture deletion, denied reservation deletion/truncation, original UUID retry processing, confirmation text and copy success/failure. PGlite serialises its PostgreSQL connection; deployed concurrency is protected by the database unique constraints and existing transaction lock.

The owner separately reported a successful pre-refinement end-to-end Supabase/Resend/inbox test. No genuine external email test, live migration, deployment, additional server or environment-secret edit was performed for this refinement. Apply the new migration manually and follow [ENQUIRY-REFERENCES.md](ENQUIRY-REFERENCES.md) to verify a new friendly receipt against its saved business email and actual inbox.
