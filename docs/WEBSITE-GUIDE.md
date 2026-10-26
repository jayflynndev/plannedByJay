# Planned by Jay website guide

The project contains the existing public website, Articles CMS, Holiday Types CMS and a private supplier directory. Shared website copy remains local; records are edited in Admin. See [ARTICLES.md](ARTICLES.md) for Articles/Auth, [HOLIDAY-TYPES.md](HOLIDAY-TYPES.md) for Holiday Types and [SUPPLIERS.md](SUPPLIERS.md) for the directory and its limited public-page lookup. Enquiry processing and offers/booking administration remain absent.

## Edit the existing website

- `src/content/home.ts`: homepage wording, hero imagery and portrait cropping. Holiday cards come from published Holiday Types.
- `src/content/why-jay.ts`: personal introduction, portrait path/alt/object-position.
- `src/content/site.ts`: verified business/contact details, approved logos, footer and social links.
- `src/content/navigation.ts`: public navigation and canonical Holiday Brief action; RootLayout passes one snapshot to the client navbar.
- `src/content/holiday-types.ts`: shared Holiday Types listing labels only. Edit page names, introductions, headings, formatted content, photographs and closing invitations at `/admin/holiday-types`. The database is the sole source of page records; the original six are imported by the manual migration, with their URLs and deletion protected. FAQ material is removed.
- `src/content/articles.ts` and `src/content/offers.ts`: public listing labels/empty-state copy. Articles are managed at `/admin/articles`; offers remain empty. Do not insert fictional or expired offers to fill the layout.
- `src/content/enquiry.ts`: disabled Holiday Brief labels. All answer fields are disabled, stage navigation is a presentation only, and no submission or personal-data collection exists. It does not accept enquiries.
- `src/content/policies.ts`: public policy copy and local approval guards. Privacy/Cookies retain unpublished empty shells; obsolete backend-processing drafts are removed. Booking Information retains its existing text and approval. Cleanup does not newly approve legal text.
- `/admin/suppliers`: search existing private supplier records instantly, add/edit details and archive/restore with confirmation. Only the name is required. Draft permits incomplete records; Approved means Jay has reviewed the information. Lookup suggestions need acceptance and do not save or approve records. No public supplier pages or offer system is introduced.

Public images remain in `public/images/`; the portrait is reused, not duplicated. Brand/layout styles remain in `src/app/globals.css`, public article/offer styles in `src/app/content.css`, and the form layout in `src/app/enquiry.css`. Keep the current responsive design and British English. The public article and offer detail presentation components remain reusable but old individual URLs return 404; no archived records are served.

## Pages and checks

Home, Why Jay, Holiday Types (`/holidays`), Travel Advice, Holiday Offers, the disabled Holiday Brief and approved policy routes remain. Published Holiday Types automatically appear on the landing page and homepage, with one shared `/holidays/[slug]` template and generated metadata. The original six stay in order; new types follow them. Draft/unpublished types return 404 publicly. Travel Advice and homepage article cards display published, unexpired articles automatically. The sitemap reads published CMS routes and approved policies. Search indexing remains disabled in RootLayout.

Use Node 22.13+. `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Both CMS sections reuse the publishable Supabase configuration in `.env.example`; no new environment variables are needed. `.env.local` and hosted credentials were not changed. Before releasing Holiday Types, manually run `supabase/migrations/20261026_holiday_types_cms.sql` in SQL Editor against the existing Articles project. Do not re-run the original Articles migration. The new seed is re-runnable and does not overwrite later edits.

Source/configuration edits require an owner-authorised deployment. No automatic push, deployment, database reset or future backend design is part of this work. Until deployed, production remains the previous release.

Before releasing Suppliers, manually run `supabase/migrations/20261026_suppliers_directory.sql` in the existing Supabase project's SQL Editor. No extra credentials, services or environment variables are needed. The directory starts empty; it does not import preferred suppliers. Find Supplier Details supports Jet2holidays by name, or structured details from a supplied official HTTPS website for other suppliers. It is a partial lookup, not general internet search or a current CAA/register check. See SUPPLIERS.md for exact source handling, limits and the local certificate-verification limitation.


Article editor polish: choose Paragraph, Heading or Subheading from the text-style dropdown; the compact formatting buttons have tooltips and accessible labels. Existing paste and keyboard shortcuts are retained. Beneath the title, **Short preview / introduction (optional)** accepts up to 200 characters (aim for 150-200). It supplies public article cards and SEO/social descriptions; leaving it blank generates a body-text preview without headings, preferring complete sentences. Existing stored previews remain available. No SQL migration is required: the existing excerpt column is reused.

Save Draft, Publish and Unpublish temporarily disable editing and show progress beside the controls. Results remain there until the next edit/action. Successful publication provides View Article and Copy Link using the saved slug; expired articles instead explain why they are not public. Failed saves keep the current editor content. Unpublish saves the current article as a private draft. No deployment or hosted database changes are performed by this update.

Polish validation: 21 automated tests passed (the public-route fixture used a temporary WebSocket shim for the installed Node 20 runtime). ESLint, TypeScript and production build passed. The project requires Node 22.13+; obtaining Node 22 locally was blocked by registry certificate verification. No browser connection was available for visual checks, and no hosted writes were tested.
