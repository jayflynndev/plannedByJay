# Production cookie and browser-storage audit

Audit date: 22 October 2026. Site: https://plannedbyjay.com. Investigation only: no application, policy flag, environment, provider setting or customer record changed. No live authentication, recovery email or enquiry submission attempted.

## Evidence and limits

- **B — Live browser:** visited the routes below in a new tab in the existing browser. Inspected rendered pages, script URLs, frames and the browser tool’s observed asset inventory. This was not a fresh isolated browser profile. No storage was cleared.
- **H — Live HTTP:** separate anonymous GET requests, without credentials or a retained cookie session, inspected response status and `Set-Cookie` names/attributes. No cookie values recorded.
- **S — Source:** current application, policies and installed Supabase libraries. Local source is not proof that the same release or provider configuration is deployed.
- **F — Safe fixture:** in-memory Supabase client with all authentication requests mocked; verified cookie writes for sign-in, refresh, sign-out and recovery initiation. No real account, provider request or recovery email used; no token/cookie values output.

**Important limitation:** the browser tool does not expose its cookie jar, localStorage or sessionStorage. Those stores were not directly inspected. Its asset inventory is not a complete network/beacon capture. No empty-storage claim follows from these observations. IndexedDB, service-worker registrations and Cache Storage were also not directly inspected.

## Live anonymous journeys

| Route | HTTP result | Browser observation |
| --- | --- | --- |
| `/` | 200; no Set-Cookie | Homepage rendered. |
| `/why-jay` | 200; no Set-Cookie | Why book with Jay? rendered. |
| `/travel-advice` | 200; no Set-Cookie | Waited for loaded content: empty article library. No published article available to inspect. |
| `/plan-my-holiday` | 200; no Set-Cookie | Holiday Brief rendered with submissions-disabled notice. No submission attempted. |
| `/booking-information` | 404; no Set-Cookie | Production 404 page; policy content unavailable here. |

Across these five browser visits, external-script elements pointed to same-origin Next.js/Turbopack chunks, observed asset origins were only `https://plannedbyjay.com`, and no iframe was present. No Turnstile, analytics or advertising script URL was observed. Inline Next.js/React streaming scripts were present; this was not an exhaustive analysis of every inline script. Same-origin URLs alone cannot exclude proxied tracking or server-side processing.

Anonymous GETs of `/admin/login` and `/admin/reset-password` also returned 200 without Set-Cookie. This does not establish authenticated behaviour or prove an empty browser cookie jar.

## Technology inventory

Durations below are source/fixture values unless explicitly observed live. “Not observed” does not mean conclusively absent.

| Technology | Provider | Purpose | Duration | Active or conditional | Consent assessment | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Next.js/React scripts, HTTP asset caching; in-page form state | Website / Vercel | Render pages and retain answers during the current form journey | Page lifetime for form state; cache lifetime varies by response/browser | Scripts active; form state in memory | Core delivery/functionality is a potential exemption; cache presence alone is not a tracking finding | B; S: `EnquiryForm.tsx`, layout/config |
| `pbj-enquiry-session` | Website | Signed session for enquiry abuse protection | 86,400 seconds; server also rejects older signatures | Conditional: enabled, valid submission journey requests session endpoint; not observed on disabled form | Potentially necessary to secure the requested enquiry service; assess proportionality/purpose rather than assuming exemption | S: enquiry security, session route and form; existing tests |
| `sb-<project-ref>-auth-token`, optionally numbered chunks such as `.0`, `.1` | Supabase Auth, first-party cookie | Administrator authentication | Maximum 34,560,000 seconds (400 days) from each library write; actual session validity can end sooner | Administrator sign-in only; live authenticated state unverified | Authentication can qualify; necessity of persistent 400-day storage needs review | S; F: sign-in/refresh/sign-out |
| `sb-<project-ref>-auth-token-code-verifier`; `…-auth-token-flow-<flowId>-code-verifier`; `…-auth-token-flows-code-verifier` (and chunks if needed) | Supabase Auth | PKCE recovery verification and flow index | Same 400-day write maximum; library has removal paths during exchange/error processing | Recovery initiation only; live recovery untested | Requested secure recovery can qualify; lifetime and residual entries need necessity review | Installed libraries; F confirmed initiation names/attributes, not completed recovery |
| localStorage / sessionStorage; IndexedDB / service-worker storage | No application implementation found | No application purpose identified | Unknown live | No explicit application storage/registration use found; browser stores unavailable to tool | Cannot assess unknown entries; do not list them as confirmed absent | S scan; B limitation |
| Turnstile script and browser/device access | Cloudflare | Automated-abuse detection | Request/token/device processing; exact device-storage duration unverified | Optional final-stage integration, only when form enabled and site key configured; not observed live | Assess actual storage/access and purposes. A security label alone does not establish exemption | S: Turnstile component/config; provider guidance |
| `cf_clearance` | Cloudflare | Optional pre-clearance | Account Challenge Passage setting; unknown here | Conditional provider feature; not observed or verified enabled | Assess actual deployed clearance purpose and necessity | Cloudflare documentation; no account inspection |
| `__vdpl` | Vercel | Optional deployment pinning for Skew Protection | Unknown for this project | Provider-supported possibility; no application setter found; not observed/verified active | Delivery consistency may support necessity if actually used; do not assert exemption without deployment facts | Vercel documentation; S |
| Analytics, advertising pixels, tracking iframes | None identified | None identified | Not applicable to identified implementation | No relevant implementation/dependency found or script/frame observed in sampled journeys | No identified non-exempt technology currently requiring a banner; observation limits remain | B; S |

### Cookie attributes and creation

**Enquiry:** `src/app/api/enquiries/session/route.ts` sets `HttpOnly`, `SameSite=Strict`, `Path=/api/enquiries`, `Max-Age=86400`, no Domain (host-only), and Secure when the configured origin is HTTPS. An existing valid session is not renewed by this endpoint. Disabled/unconfigured operation returns without issuing it. `EnquiryForm.tsx` stops before requesting the endpoint when submissions are disabled; on an enabled, validated submission it requests the session before posting the enquiry. No additional application anti-spam cookie was found. Rate limiting and server Turnstile verification do not themselves prove browser-cookie use.

**Administrator:** `src/lib/cms/client.ts` and `src/proxy.ts` configure `HttpOnly`, `SameSite=Lax`, `Path=/`, host-only, and Secure for HTTPS. Installed `@supabase/ssr` 0.12.7 writes a 400-day maximum, confirmed by the mocked fixture; sign-out writes expiry (`Max-Age=0`). Auth-token refresh renews the cookie maximum. These are not guarantees of 400-day login or recovery-link validity.

Refresh is request-driven through the admin/CMS proxy and server client (`getClaims()`/session loading), not a browser background-refresh client. Public CMS reads use an anonymous client with persistence and automatic refresh disabled. Recovery uses server-side PKCE cookies; no application localStorage/sessionStorage recovery mechanism was found. Library source removes verifier entries during exchange/error paths, but completed recovery and residual-flow cleanup were not tested live or in the fixture.

## ICO comparison and policy recommendations

Current [ICO storage/access guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/) covers technologies beyond cookies. Its [exceptions guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/) requires necessity for the user-requested service and appropriate purpose/duration; not every security technology is automatically exempt. Authentication and proportionate fraud prevention are potential examples. Advertising requires consent. Some statistical/appearance uses now have conditional exceptions, so “all analytics always require consent” would also be too broad. No such analytics use was identified here. This is an evidence assessment, not a final legal determination.

Recommended changes to `src/content/policies.ts` **only after remaining checks**:

1. Retain the enquiry cookie’s name, 24-hour duration and enabled-submission timing. Add its scope and attributes from the inventory if helpful; do not imply ordinary visits to the disabled form create it.
2. Expand recovery names to the three patterns above. Describe 400 days as the maximum from a write/refresh, separately from token/link validity. Qualify cleanup wording so it does not promise every abandoned recovery entry disappears immediately.
3. Record and justify administrator-cookie persistence, including abandoned recovery flows. Do not silently shorten attributes as part of this audit.
4. Keep the no-built-in-analytics statement and in-memory form description as source findings. Avoid turning them into an unqualified claim that production browsers hold no storage.
5. Keep Turnstile and clearance explicitly conditional. Confirm settings and duration before stating either is active. [Cloudflare pre-clearance documentation](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/pre-clearance/) distinguishes the additional clearance feature. Its [privacy information](https://www.cloudflare.com/turnstile-privacy-policy/) describes browser/device signals and separate processing roles; do not blanket-exempt all processing merely because the integration prevents spam.
6. List `__vdpl` only if actual project/browser evidence confirms it, with its real duration. [Vercel documents it for Skew Protection](https://vercel.com/docs/skew-protection); platform availability is not evidence of use here. Do not invent hosting-protection cookie names.

**Banner:** no evidence presently establishes a need for a consent banner. Do not add one merely for identified core functions. This is not a complete no-consent certification: any non-exempt storage/access must be addressed before use, following [ICO compliance guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-comply-with-the-pecr-rules/).

## Remaining evidence and publication blockers

- Obtain a names/attributes-only inventory through authorised browser DevTools for anonymous journeys: Cookies, localStorage, sessionStorage, IndexedDB, service workers and Cache Storage, plus relevant network requests/response headers. Do not share values or tokens. This closes the tool limitation, not a newly diagnosed tracking problem.
- An authorised account owner should separately verify authenticated sign-in, refresh, sign-out and recovery cleanup/expiry without sharing credentials or session values. No live admin behaviour was inspected here.
- Confirm conditional Cloudflare/Vercel protection settings and actual durations if used. No dashboard settings were accessed. Justify administrator persistence before finalising that policy section.
- Reconcile the intended release with production: `/booking-information` currently returns 404. No policy approval or deployment was performed. An unavailable published article is a coverage gap, not itself a cookie blocker.
- Do not mark the production-technology audit fully complete until the unavailable storage evidence is reviewed. These are specific evidence gaps; this audit does not reopen already confirmed business registrations or request a wider compliance project.

## Validation

40 relevant existing tests passed: enquiry security/validation/references, navigation, CMS, public pages, enquiry form and editor/UI fixtures. They used local/synthetic fixtures, not hosted customer records. No build or development server was started for this read-only investigation. Application and test source were checked for changes; this report is the sole file created by the audit.
