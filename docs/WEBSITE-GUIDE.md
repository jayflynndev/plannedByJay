# Planned by Jay website guide

The working project is now a public frontend only. The old backend/admin/APIs and active database migrations have been removed. Nothing new replaces them. See [BACKEND-REMOVAL.md](BACKEND-REMOVAL.md) for backups and the separate manual reset.

## Edit the existing website

- `src/content/home.ts`: homepage wording, imagery and portrait cropping.
- `src/content/why-jay.ts`: personal introduction, portrait path/alt/object-position.
- `src/content/site.ts`: verified business/contact details, approved logos, footer and social links.
- `src/content/navigation.ts`: public navigation and canonical Holiday Brief action; RootLayout passes one snapshot to the client navbar.
- `src/content/holiday-types.ts`: the six existing inspirational guides and their images/copy. No offers database or related-article query remains.
- `src/content/articles.ts` and `src/content/offers.ts`: public listing labels/empty-state copy. There are no articles or offers loaded from a backend. Do not insert fictional or expired offers to fill the layout.
- `src/content/enquiry.ts`: disabled Holiday Brief labels. All answer fields are disabled, stage navigation is a presentation only, and no submission or personal-data collection exists. Do not activate it in this task.
- `src/content/policies.ts`: preserved policy copy/approval guards. Privacy/Cookies remain guarded if unapproved; Booking Information retains its existing approval. Backend removal does not newly approve legal text. All historical text is also recoverable from the archive.

Public images remain in `public/images/`; the portrait is reused, not duplicated. Brand/layout styles remain in `src/app/globals.css`, public article/offer styles in `src/app/content.css`, and the form layout in `src/app/enquiry.css`. Keep the current responsive design and British English. The public article and offer detail presentation components remain reusable but old individual URLs return 404 until a separately specified replacement exists.

## Pages and checks

Home, Why Jay, Explore Holidays and six guides, Travel Advice, Holiday Offers, the disabled Holiday Brief and approved policy routes remain. Travel Advice and Holiday Offers display empty states; empty homepage article/offer sections stay hidden. The static sitemap contains only existing public/static routes and approved policies. Search indexing remains disabled in RootLayout.

Use Node 22.13+ (Node 24 used here). `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. `npm run dev` is for the owner to start; no second development server is required. Only optional public `SITE_URL` is used; `.env.local` and hosted credentials were not changed.

Source/configuration edits require an owner-authorised deployment. No automatic push, deployment, database reset or future backend design is part of this work. Until deployed, production remains the previous release.
