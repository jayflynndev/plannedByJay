# Application version and form-state investigation

## What was observed and what is confirmed

The owner reproduced an obsolete airport checklist and a Stage 3 error because `departurePreferences` was undefined. Earlier server browser logs also show old client markup against new HTML. Previous cache clearing and a navbar-only snapshot fix did not resolve the application-wide issue.

At this investigation's start, no Next.js application listener existed on ports 3000–3010. The remaining Node processes were not Next CLI/server instances. No obsolete airport interface, old draft initializer or `/#plan` CTA was found in current application source or generated JavaScript/source maps. Historical mismatch messages existed in the generated development log. There is no application service-worker registration or worker file in source/public.

One concrete state-lifecycle failure is reproducible: `useState(initialDraft)` does not replace its state when the initializer changes. Next.js Fast Refresh normally preserves useState/useRef between edits. The regression test mounts the old draft shape, updates the initializer to the current shape and reproduces the missing-string validation error. Remounting initializes the current `departurePreferences: ''` correctly. This establishes the stale-state failure path; it does not prove that every reported old-interface refresh was caused by Fast Refresh.

An obsolete visible checklist also requires an old client UI module, not just old state. The affected browser is not available through the connected tools, so its cache, active workers and exact asset-retention mechanism could not be inspected. No claim is made that a particular browser cache entry or a Turbopack defect was conclusively identified. In the earlier investigation, fresh server HTML and fetched JavaScript were current while the browser reported old runtime code. Source/server validation is not being weakened to accommodate that skew.

Official behaviour: [Fast Refresh preserves hook state and supports @refresh reset](https://nextjs.org/docs/architecture/fast-refresh); [deploymentId adds asset versioning and version-skew detection](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId).

## Changes

- `src/components/enquiry/EnquiryForm.tsx` includes the supported `// @refresh reset` directive. Code edits remount the development form rather than retaining an incompatible draft. This can clear an unfinished brief when a developer edits the component. Back/Continue/Edit retain answers normally; production interactions are unaffected.
- `scripts/application-version.ts` creates a stable fingerprint from application source, configuration and dependency manifests. It does not read `.env` files or customer records. Identical source gives identical identity; source changes give a new identity.
- `next.config.ts` supplies that identity to Next's `deploymentId` and `outputHashSalt`. Assets have versioned URLs and the framework advertises its identity for client navigation. Production start reads the identity saved with its build rather than assigning a different identity to already-built assets after source edits. Build before starting production when code changes.
- Persistent Turbopack **development** filesystem caching is disabled as a precaution against restoring compiler state across restarts; the investigation did not find old UI in the examined output. Production caching remains unchanged.
- The existing server-owned Navbar configuration remains in place. No hydration-warning suppression, client-only rendering workaround, obsolete-field defaults or conversion logic is introduced.
- Only the verified generated `.next` directory was removed for the clean build, with no application listeners present. No development server was launched on port 3000. The temporary production server used loopback port 3100 and was stopped after checks.

Supabase records, immutable email snapshots, provider credentials, schema validation, retry processing, rate limits and spam controls are unchanged.

## Verification completed

- All 19 tests, lint, TypeScript and a clean production build pass.
- The state-lifecycle regression reproduces the missing departure field under retained state and validates fresh initialization after remount.
- The SSR → hydration → full three-stage journey passes with blank departures. The submitted payload contains `departurePreferences: ''` and passes the unchanged strict submission schema. Hydration recoverable errors and attribute warnings are checked. Submission/provider responses are mocked: no test email was sent and no customer enquiry was persisted.
- Production HTTP checks on port 3100 obtained eight consistent HTML responses across the homepage and enquiry route. All nine referenced JavaScript assets used the matching deployment identity. Served chunks contained the current empty-string departure initializer, no old airport checklist and no old primary CTA. RSC navigation responses advertised the matching deployment identity.
- The issue was not reproduced in these clean-build HTTP and DOM hydration checks. A real browser executing the production bundles was unavailable; these checks do not establish that the owner's browser cache/worker condition is resolved.

## Verify in the owner's browser

1. Start one development server with `npm run dev`; no agent-owned dev server is running. Use its printed URL consistently.
2. Load the new code once with a hard refresh. Then use ordinary refresh repeatedly on `/` and `/plan-my-holiday`.
3. In DevTools, check `document.documentElement.dataset.dplId` and the `dpl=` query on script requests. They should identify the same application version. After changing source and restarting, a different version is expected.
4. Complete Stage 1 and continue to Stage 2. There must be one optional “Where would you prefer to travel from?” text field and no airport checklist. Leave it blank, finish the brief and submit a controlled test only if your existing backend/privacy settings permit it. Inspect the POST payload: `brief.departurePreferences` must be the empty string, not absent or undefined. Check the real record/email separately for a genuine provider test.
5. Confirm that normal refreshes and menu interactions emit no new hydration warnings. If the old interface still returns, inspect DevTools Application → Service Workers for this exact origin and Network for the script URL/response providing old code. Preserve those findings: they are needed to identify browser interception or a different application origin. No browser registrations were removed speculatively.

For isolated production review, stop the dev server, run `npm run build`, then `npm run start -- --port 3100 --hostname 127.0.0.1` and visit that URL. Do not submit customer data from an origin different from APP_ORIGIN; the origin gate intentionally rejects it. Stop the temporary production process with Ctrl+C afterwards.
