# Navigation hydration investigation

This documents the earlier navbar-only investigation. It did not resolve the later application-wide stale form/state failure. See [APPLICATION-VERSION.md](APPLICATION-VERSION.md) for the current investigation and safeguards.

## Evidence and cause

The affected development server's browser log showed an old client value (`/#plan`) while its server HTML used `/plan-my-holiday`. Before changing code, the same running server's HTML and freshly fetched browser chunk both contained the current `/plan-my-holiday` value; the browser chunk had `Cache-Control: no-cache, must-revalidate`. Only one Next.js listener was present on port 3000 and none on 3001.

`Navbar` previously imported the navigation configuration directly as a client component. That file was compiled separately into the server and browser module graphs. The confirmed failure is version skew in the browser's running navigation configuration, not duplicate source definitions or a conditional render: no application source still defined the old CTA. The current source used neither dates, randomness nor browser-dependent branching to choose the href. RootLayout rendered Navbar normally; its effect only controlled menu behaviour.

The affected browser is not connected to the available browser-control tools, so the exact mechanism retaining the old runtime (for example, an old loaded module or browser interception) could not be inspected. This is not evidence sufficient to name a particular Turbopack cache bug. There is no application service-worker registration or worker asset in the source/public files. No browser service workers, profiles or caches were changed. The earlier cache-only remedy did not establish or remove this client/server configuration boundary.

## Fix

- `src/app/layout.tsx` resolves navigation and branding on the server and passes one serialised snapshot to Navbar.
- `src/components/layout/Navbar.tsx` reads `links`, `primaryAction` and `brand` from props. It no longer imports marketing configuration into the browser module graph. Rendering and menu behaviour remain the same.
- `src/content/navigation.ts` is marked `server-only`, so importing it into a client component is a build error. Its primary action remains `/plan-my-holiday`.
- `tests/navigation-config.test.ts`, `tests/enquiry-form.test.tsx` and the test script cover the configuration boundary, SSR/hydration identity, attribute warnings and menu interactions.
- Only `.next/dev` generated output was cleared after confirming no preview was listening. No second development server was started. No source, environment, enquiry, Supabase or Resend data was cleared or changed.

No hydration-warning suppression, client-only rendering workaround or console hiding is used. The test temporarily captures console errors to assert that hydration emits none; application logging is unchanged.

## Validation and browser verification

All 16 tests, lint, TypeScript and production build pass. Production HTML and the RSC payload agree on `/plan-my-holiday`, and production browser chunks contain no `/#plan` value. The DOM hydration regression preserves the original anchor and checks both recoverable errors and attribute-only console warnings. Actual browser confirmation remains with the owner because no browser is connected.

1. Run one `npm run dev` server from `D:\plannedByJay` on port 3000.
2. Hard-refresh `http://localhost:3000/` once to load the new Navbar code. Do the same for `/plan-my-holiday` (or close/reopen an old mobile tab).
3. Clear previously recorded console messages, reload, and check for newly emitted hydration errors. This distinguishes historical logs from an ongoing issue.
4. Inspect `.nav-cta`: its href must be `/plan-my-holiday`. Open/close the mobile menu and follow the link; it must retain that destination.
5. If a fresh browser context still reports a mismatch, preserve the new diff and the failed script URL/response in DevTools Network. Those will distinguish an obsolete loaded bundle or browser interception from a new rendering fault; do not simply suppress the warning.
