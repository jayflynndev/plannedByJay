# Planned by Jay website guide

The project contains the existing public website and the Articles CMS. Static content remains local. The Articles CMS is now the sole backend module; see [ARTICLES.md](ARTICLES.md) for its one manual migration, Auth setup and everyday publishing. Enquiry processing, offers/suppliers administration and other backend services remain absent.

## Edit the existing website

- `src/content/home.ts`: homepage wording, imagery and portrait cropping.
- `src/content/why-jay.ts`: personal introduction, portrait path/alt/object-position.
- `src/content/site.ts`: verified business/contact details, approved logos, footer and social links.
- `src/content/navigation.ts`: public navigation and canonical Holiday Brief action; RootLayout passes one snapshot to the client navbar.
- `src/content/holiday-types.ts`: the six existing inspirational guides and their images/copy. No offers database or related-article query remains.
- `src/content/articles.ts` and `src/content/offers.ts`: public listing labels/empty-state copy. Articles are managed at `/admin/articles`; offers remain empty. Do not insert fictional or expired offers to fill the layout.
- `src/content/enquiry.ts`: disabled Holiday Brief labels. All answer fields are disabled, stage navigation is a presentation only, and no submission or personal-data collection exists. It does not accept enquiries.
- `src/content/policies.ts`: public policy copy and local approval guards. Privacy/Cookies retain unpublished empty shells; obsolete backend-processing drafts are removed. Booking Information retains its existing text and approval. Cleanup does not newly approve legal text.

Public images remain in `public/images/`; the portrait is reused, not duplicated. Brand/layout styles remain in `src/app/globals.css`, public article/offer styles in `src/app/content.css`, and the form layout in `src/app/enquiry.css`. Keep the current responsive design and British English. The public article and offer detail presentation components remain reusable but old individual URLs return 404; no archived records are served.

## Pages and checks

Home, Why Jay, Explore Holidays and six guides, Travel Advice, Holiday Offers, the disabled Holiday Brief and approved policy routes remain. Travel Advice and homepage cards display published, unexpired articles automatically. Empty libraries and Holiday Offers retain empty states. The static sitemap contains only existing public/static routes and approved policies. Search indexing remains disabled in RootLayout.

Use Node 22.13+ (Node 24 used here). `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. `npm run dev` is for the owner to start; no second development server is required. Articles require the publishable Supabase configuration in `.env.example`; `.env.local` and hosted credentials were not changed.

Source/configuration edits require an owner-authorised deployment. No automatic push, deployment, database reset or future backend design is part of this work. Until deployed, production remains the previous release.


Article editor polish: choose Paragraph, Heading or Subheading from the text-style dropdown; the compact formatting buttons have tooltips and accessible labels. Existing paste and keyboard shortcuts are retained. Beneath the title, **Short preview / introduction (optional)** accepts up to 200 characters (aim for 150-200). It supplies public article cards and SEO/social descriptions; leaving it blank generates a body-text preview without headings, preferring complete sentences. Existing stored previews remain available. No SQL migration is required: the existing excerpt column is reused.

Save Draft, Publish and Unpublish temporarily disable editing and show progress beside the controls. Results remain there until the next edit/action. Successful publication provides View Article and Copy Link using the saved slug; expired articles instead explain why they are not public. Failed saves keep the current editor content. Unpublish saves the current article as a private draft. No deployment or hosted database changes are performed by this update.

Polish validation: 21 automated tests passed (the public-route fixture used a temporary WebSocket shim for the installed Node 20 runtime). ESLint, TypeScript and production build passed. The project requires Node 22.13+; obtaining Node 22 locally was blocked by registry certificate verification. No browser connection was available for visual checks, and no hosted writes were tested.
