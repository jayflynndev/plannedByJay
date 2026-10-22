# Jay's launch checklist

## Phase 6: article discovery

- [x] Added bounded indexed server-side search, URL-based type/category/tag filters, Reset, pagination and distinct failure/empty states within the existing Travel Advice design.
- [x] Added reusable normalised tags and separate Featured on Homepage / Pinned in Travel Advice controls. Article URLs, categories, media, editorial privacy, publishing/revision guards and invalidation retained.
- [x] Prepared non-destructive `20261023_article_discovery.sql` with indexes, RLS and guarded admin writes. No hosted execution, content publishing, enquiry change or policy-flag change.
- [x] 47 tests, lint, TypeScript and production build passed; local responsive fixtures and filtered-page metadata/error handling checked. Hosted discovery remains a post-migration/release verification.
- [ ] Jay/authorised administrator: review/apply that migration once **before** releasing the application, following [ADMIN-PORTAL-GUIDE.md](ADMIN-PORTAL-GUIDE.md), then verify saved settings and signed-out published/draft behaviour. This is separate from the earlier enquiry-erasure migration and existing launch approvals.

This phase adds no offers, destination pages, external search service or tracking.

## Current policy completion — 22 October 2026

- [x] Recorded the confirmed New Travel GDPR agreement for website-collected customer information; registrations remain closed facts. Operational enquiry/privacy contact is Jay, coordinating with New Travel.
- [x] Finalised supported Privacy/Cookie wording, including later secure passenger collection, no automatic VHUB transfer, provider processing and audited cookie details. Booking Information stays approved in source; Privacy/Cookies stay guarded and unapproved.
- [x] Adopted Jay’s monthly review / normal deletion rule for inactive unsuccessful enquiries at 12 months after last meaningful customer contact in [ENQUIRY-DATA-RETENTION.md](ENQUIRY-DATA-RETENTION.md). No data deleted or snapshots modified.
- [ ] Complete the precise publication requirements in [POLICY-APPROVAL-CHECKLIST.md](POLICY-APPROVAL-CHECKLIST.md): activity allocation/bases/LIA, actual account transfer safeguards, manual safe-erasure migration approval/provider retention, unavailable production-storage evidence and administrator-persistence assessment, then separate final-text approval. Optional unused integrations are not additional blockers.

## Final infrastructure handover

- [x] Sitemap serves real stable routes during a logged CMS outage; published-only article metadata is added when available. Local degraded sitemap now 200; current deployed sitemap also 200. No production pause diagnosed.
- [x] Record-specific safe erasure and outstanding-worker tracking implemented/tested in `20261022_safe_enquiry_erasure.sql`. Existing records/snapshots unchanged; permanent references retained. **Not applied** to hosted Supabase; no customer erased.
- [x] 42 tests, lint, TypeScript and production build passed; publication guards retained.
- [ ] Follow [LAUNCH-HANDOVER.md](LAUNCH-HANDOVER.md) before public operation: resolve Vercel Hobby commercial eligibility, policy/account approvals, manual migration and protected retry/monitoring/recovery arrangements. Supabase Free inactivity pausing is an availability risk, not a diagnosis or automatic demand for an upgrade. No paid service or artificial keep-alive configured.

This section supersedes earlier references below to merely proposed retention or an unconfirmed GDPR agreement. No deployment, indexing approval or public-enquiry activation is authorised by policy completion.

Phase 4 prepares the existing site for owner review. No deployment, live-enquiry activation, secret change, hosted migration or holiday-offers integration is authorised/performed by this checklist. Known working enquiries/CMS reported by Jay are preserved; local checks are not evidence of current provider uptime or legal approval.

## A. Things Codex has completed

- [x] Retained the headline and six-purpose homepage structure, forest/cream/sage/terracotta identity. Public setup messages/sample article cards replaced or hidden: `src/content/home.ts`, `src/components/home/`, `src/app/page.tsx`.
- [x] Added centrally editable `/why-jay`, including supplied background, whole-holiday priorities, five-stage customer journey and enquiry CTA: `src/content/why-jay.ts`, `src/app/why-jay/page.tsx`.
- [x] Navigation now links to Why Jay and Travel Advice. Explore Holidays explicitly stays the homepage style section: `src/content/navigation.ts`.
- [x] Added supplied trading/contact/company/VAT/head-office information, without independent licensing/protection claims: `src/content/site.ts`, `src/components/layout/TrustInformation.tsx`, `Footer.tsx`.
- [x] Homepage retrieves up to three published articles through the existing anonymous CMS access boundary, with narrow field projection and missing-image/empty/error fallbacks: `src/lib/cms/previews.ts`, `data.ts`, `TravelInspiration.tsx`. Publishing invalidates `/` as well as existing article routes/sitemap. No redeployment needed for CMS article edits.
- [x] Prepared real portrait/approved-logo slots and safe image-failure handling: `public/images/jay/README.md`, `public/images/brand/README.md`, `src/components/ui/SiteImage.tsx`.
- [x] Prepared unpublished policy routes/layout/config, guarded by approval and actual text: `src/content/policies.ts`, `src/components/layout/PolicyPage.tsx`, `/privacy`, `/cookies`, `/booking-information`. Unapproved documents remain 404/unlinked and out of sitemap. Existing enquiry warnings remain.
- [x] Updated website/design instructions; added [privacy inventory](PRIVACY-READINESS.md). No new dependency, migration or environment variable required. Existing deployment-ID fix remains intact.

## B. Things Jay needs to provide

| Item | What / recommended format | Where and how to add it | Redeployment? |
| --- | --- | --- | --- |
| Genuine personal photograph | Provided: the existing real portrait is shared by the homepage and Why Jay page. Keep replacements approved and remove EXIF/GPS. | Replace `public/images/jay/jay-portrait.jpg` or update paths in both content files. Homepage: `home.why.portrait`, `portraitAlt`, `portraitPosition` in `src/content/home.ts`. Why Jay: `portrait.src`, `portrait.alt`, `portrait.objectPosition` in `src/content/why-jay.ts`. Review desktop/mobile crops. | Yes: local asset/config edit, no JSX change. |
| Official company/partnership logos | Original authorised SVG or transparent PNG/WebP (raster about 600px+ wide), approved usage/clear space/colours/background/minimum-size/link requirements. | `public/images/brand/new-travel.svg`, `advantage-travel-partnership.svg`; put paths in `site.logos` and set each `approvedForDisplay` only after review. Check displayed sizing against supplied rules. | Yes. |
| Regulatory artwork/wording | Approved original ABTA artwork **and** confirmed entitlement/display conditions, membership artwork usage conditions. ABTA P8763 and the supplied New Travel registration wording are already confirmed; ATOL details only if explicitly verified and relevant. | Reserved `public/images/brand/abta.svg`; configure only after approval. Add approved mandatory wording centrally in `site.business`/trust component as needed. No logo currently shown. | Yes; any additional required disclosure format may need a small component change. |
| Precise legal entity / mandatory disclosures | Exact entity name associated with 16135195, approved agency/trading/protection wording. Supplied facts were reconfirmed; no legal suffix or registered-office claim has been guessed. | Review `site.business` in `src/content/site.ts`; `legalEntityName` is now verified as New Travel Holidays Limited; the New Travel trading/registration wording is confirmed; website-specific controller responsibilities still need review. Head office remains labelled head office. | Yes. |
| Policy/booking documents | Complete factually reviewed text, dates and applicable agency terms, not another consultant's copied wording. Confirm all questions in PRIVACY-READINESS.md. | Add `sections`/`updatedAt` in `src/content/policies.ts`; set `approved` only for reviewed documents. Resolve `reviewRequired` tasks before approval. Footer/sitemap and the Stage 3 privacy link follow automatically; live-enquiry gates need separate approval. | Yes. |
| Contact updates | `jay@plannedbyjay.com` is supplied and implemented. Provide a phone number only if wanted and confirmed. | `site.contact` in `src/content/site.ts`; leave phone null to hide it. Public email edits do not change private notification recipient settings. | Yes. |
| Social profiles | Actual approved HTTPS profile URLs and readable platform labels. Optional; absence is not a blocker. | Add `{label,href}` entries to `site.social`; empty list is hidden. | Yes. |
| Research articles | Title, excerpt, Markdown, featured photo/alt, SEO fields, real author, research/fact-check/review dates and private sources/notes. | `/admin/articles/new`: paste, upload/select photo, save draft, check desktop/mobile preview, explicitly publish. Available formats already include destination guide/comparison/blog/advice/Wish You Were Here/inspiration; categories managed at `/admin/categories`. | **No**: CMS save/publish. |
| Biography corrections | Real experience/audience information Jay is comfortable making public; no invented travel-industry tenure or testimonials. | `src/content/why-jay.ts` for full page; `home.why` for homepage summary. | Yes. |
| Photography rights/final choices | Confirm licences and suitability of existing illustrative destination images; replacements should describe their visible content accurately. | `docs/IMAGE-ASSETS.md`, `public/images/home/`, `public/images/destinations/`; update paths/alt in `home.ts`. Images are not specific bookable offers or proof of accessibility. | Yes for local assets; no for CMS article photos. |

## C. Technical launch blockers / verification required

These are outstanding confirmations, **not newly diagnosed outages**. Reuse successful production evidence where it is current and record what has been checked.

An empty article library or missing optional social profile is not itself a technical launch blocker: those sections stay hidden. The real CMS read in this phase succeeded with no published articles. See [PHASE-4-VALIDATION.md](PHASE-4-VALIDATION.md) for exact checks and limits.

- [ ] **Privacy/agency approval before enquiries:** complete factual/legal review, retention/request/deletion procedures, approved privacy URL and applicable booking disclosures. Retain the separate submission/indexing gates until explicit owner approval. No public activation in Phase 4.
- [ ] **Production enquiry reliability:** controlled authorised enquiry confirms actual record, friendly reference, immutable snapshot, Resend result and received inbox message. Owner previously verified this; recheck the final production release with synthetic details and consent before public enablement.
- [ ] **Retries and monitoring:** confirm a protected scheduler invokes the existing retry endpoint using a secret Authorization header (not a query string); check failures/manual-review queue and delivery/bounce monitoring. Do not infer that the scheduler exists because the endpoint exists. Follow ENQUIRY-SETUP.md; do not edit stored pending notifications.
- [ ] **Supabase and account security:** confirm applied migration versions, least-privilege enquiry/CMS roles, production stability/backup/restore, admin allowlist, disabled public signup and real recovery/revocation. Test an unallowlisted account and signed-out access. No hosted tables are altered here.
- [ ] **Published content integration:** publish a genuine researched article yourself, confirm it appears on homepage and public index, edit/unpublish and confirm both update without deployment; verify drafts/private notes stay inaccessible. Local fixtures/mock tests alone do not prove hosted CMS access.
- [ ] **Vercel/domain:** verify `https://plannedbyjay.com`, HTTPS, canonical SITE_URL/APP_ORIGIN values, apex/www behaviour, protected admin routes and current supported Node runtime. Confirm native deployment IDs/Skew Protection settings per VERCEL-DEPLOYMENT.md. No DNS or Vercel setting is changed automatically.
- [ ] **Final release review:** keyboard/mobile/desktop checks, portrait/logo rules, image rights/alt, no unsupported claims, completed policy links, actual cookies and enabled integrations. Approve search indexing separately: root noindex and CMS gates are unchanged by this work.

## D. Optional improvements after launch

- Social profile links and a fuller biography if useful.
- Additional researched articles/photography, occasional accessibility/performance review and editorial review-date maintenance.
- A future dedicated Explore Holidays page if it helps customers; do not confuse styles with bookable offers.
- Decide separately whether an offers database, supplier feed or LateCards is appropriate. None is implemented now; it is not a launch dependency.
- Analytics or additional media formats only after a deliberate purpose/privacy review; no tracking added simply to fill a checklist.

For daily editing see [WEBSITE-GUIDE.md](WEBSITE-GUIDE.md); for Markdown/photo publishing see [ADMIN-PORTAL-GUIDE.md](ADMIN-PORTAL-GUIDE.md). Local/source configuration changes need owner-authorised redeployment; CMS article operations do not.

## Phase 5: personal copy review

- [x] Used Jay’s agreed Why Jay wording, including Jay’s Virtual Pub Quiz background, whole-holiday comparisons and the five planning stages. Kept the real portrait and editable cropping.
- [x] Clarified direct contact with Jay on the homepage/footer; preserved the headline and existing design. Inspiration browsing remains distinct from the Holiday Brief.
- [x] Reviewed enquiry wording, next steps and article-to-enquiry links; retained all questions, budget/intention options, validation, integrations and submission/privacy/indexing gates.
- [ ] Owner review of final desktop/mobile copy before an authorised release. Existing privacy/booking disclosures, approved artwork, production reliability/security and indexing confirmations in section C remain outstanding; this copy phase does not resolve or activate them.

Edit homepage wording in `src/content/home.ts`, full Why Jay wording/portrait in `src/content/why-jay.ts`, shared footer in `src/content/site.ts`, enquiry wording in `src/content/enquiry.ts`, and public article introduction/CTA in `src/content/cms.ts`. Article bodies remain managed through the existing CMS. No deployment or hosted data change is authorised by this checklist.

Phase 5 validation: lint, TypeScript, all 38 existing tests and production build passed. Local production browser review covered homepage, Why Jay, Travel Advice and Holiday Brief at desktop/mobile sizes; Why Jay was checked at 375/390/440/768/1280px, with no horizontal overflow. The real portrait rendered and no browser warnings/errors were reported. The anonymous article library returned no published articles, so a real published article-to-enquiry journey remains to be checked after Jay publishes an article; existing article rendering/CMS regression tests passed. No enquiries were sent, CMS records changed or live integrations activated during this review.

## Legal, privacy and booking drafts — 22 October 2026

- [x] Prepared original application-specific Privacy Policy, Cookie Policy and Booking Information in `src/content/policies.ts`, including enquiry/storage/email/authentication facts, cookie names and established code lifetimes, rights/ICO contact and booking boundaries. All remain unapproved and unpublished.
- [x] Verified New Travel Holidays Limited’s name against Companies House 16135195; head office remains correctly labelled. Recorded Jay’s confirmation through Dale and Paul/New Travel of the approved reference wording and company, ABTA P8763 and ICO ZB868696 details, attributed to New Travel Holidays Limited. Logos remain unapproved; no universal ABTA/ATOL protection claim was copied.
- [x] Unified route/footer/sitemap/Holiday Brief publication checks. Stage 3 notice is informational, with an automatic privacy link only after reviewed approval. No marketing checkbox or new consent banner.
- [ ] Complete the exact factual and operational review in [POLICY-APPROVAL-CHECKLIST.md](POLICY-APPROVAL-CHECKLIST.md): controller/legal contacts, lawful bases, adopted retention/request process, actual processor locations/transfers, production cookies/Turnstile/hosting, administrator duration. The applicable-conditions process and booking model are now supplied and settled. Company, ABTA and ICO details are already confirmed through New Travel and are not outstanding number-verification tasks.
- [ ] Replace review-only draft paragraphs, record evidence, approve each final document individually and authorise its release. Policy approval does not authorise enquiry activation or indexing. Existing section C production/security checks remain.

No migration, deployment, secret change or live submission activation is part of this work. The website’s current integrations and durable records are preserved.

Policy validation: all 40 tests, lint, TypeScript and production build passed. Production-preview policies return 404 while unapproved, with no footer/sitemap links; draft layouts checked separately at 375/390/440/1280px without publishing. Stage 3 notice and disabled submit verified in the actual local form; no enquiry sent. Anonymous deployed-page inspection was limited to visible scripts/frames and the disabled form, not a full cookie/account audit. Exact evidence and limits: POLICY-APPROVAL-CHECKLIST.md.

Registration/booking-stage clarification: Dale and Paul/New Travel have confirmed the approved reference wording and company, ABTA P8763 and ICO ZB868696 details; the policy drafts attribute registrations to New Travel Holidays Limited. These are resolved details, not repeat-confirmation tasks. The initial Holiday Brief is unchanged. Later booking collection may need legal names, dates of birth, passport information and other necessary passenger details through an approved secure New Travel workflow, including VHUB where appropriate. No customer passport/document/payment collection or VHUB integration has been built here.

## Final policy refinement — current status, 22 October 2026

- [x] Preserved the confirmed New Travel company/trading/Advantage/ABTA/ICO details; no repeat number-confirmation task or independent PBJ membership claim.
- [x] Refined customer-facing policy wording; internal compliance instructions now stay in review metadata/documentation. Booking Information explains existing operator packages, applicable agency terms and approval/organiser responsibilities for newly assembled arrangements. No universal conditions URL or protection guarantee invented.
- [x] Adopted monthly review/normal deletion for inactive unsuccessful enquiries 12 months after last meaningful customer contact. Safe erasure now has a separately approved manual migration and exact-record procedure; no hosted migration, automatic deletion or customer cleanup performed.
- [ ] Privacy: settle controller/legal contacts, actual lawful bases, account/provider locations/transfers and adopt the operational retention/request procedure. Insert the facts before removing review IDs.
- [ ] Cookies: verify actual deployed security/admin/recovery technologies and account settings against the documented inventory. No analytics/advertising or decorative consent banner introduced.
- [ ] Booking Information: factual booking model supplied and settled; `reviewRequired` is empty, but `approved` remains false pending Jay’s final text approval. No generic supplier-URL blocker remains.
- [ ] Approve each final document individually using POLICY-APPROVAL-CHECKLIST.md; separately authorise any release. Existing enquiry approval flags and indexing gates are unchanged. All three pages remain unpublished today.

## Booking Information approved — 22 October 2026

Jay has explicitly approved `/booking-information` with the requested New Travel ABTA sentence. Its flag is now true and review list empty, enabling the existing route/footer/sitemap on the next owner-authorised deployment. Privacy/Cookies remain unapproved and public-enquiry flags unchanged. No deployment or data modification has occurred. The concise remaining decisions, recommended lawful bases/responsibility allocation, manual retention process and provider/account evidence are in [PRIVACY-FINAL-ACTIONS.md](PRIVACY-FINAL-ACTIONS.md); confirmed New Travel registrations are not reopened.
