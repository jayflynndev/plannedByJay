# Planned by Jay

The existing customer-facing Next.js website, with local editable content and public assets. The Articles CMS is the only backend module: Supabase Auth for Jay, article drafts/publishing, categories, tags and photographs. Other application backends remain removed. See [Articles setup and publishing](docs/ARTICLES.md).

## Run locally

Use Node 22.13+ (Node 24 used for validation):

```sh
npm ci
npm run dev
```

Use an existing development server rather than starting a second one. Articles also use `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; see `.env.example`. Existing private environment files and hosted settings are untouched.

## What exists

Home, Why Jay, Explore Holidays and six holiday guides, Travel Advice, Holiday Offers, public policy layouts, shared navigation/footer, responsive styling, photographs and metadata. Articles list automatically when published and unexpired; draft/expired/deleted URLs return 404. Holiday Offers remains empty. The Holiday Brief is a disabled, read-only three-stage presentation and cannot collect or transmit answers. Existing policy approval guards and root noindex are unchanged.

- `src/app/`: public routes, protected article administration, article APIs and styles.
- `src/components/`: public presentation and the article editor.
- `src/content/`: editable website wording, images and navigation.
- `src/lib/`, `src/types/`: small presentation/metadata helpers and display types.
- `public/`: existing images and static assets.
- `tests/`: frontend regression checks.
- `docs/`: [website editing](docs/WEBSITE-GUIDE.md), [design](docs/DESIGN-SYSTEM.md), [image register](docs/IMAGE-ASSETS.md).

## Verify

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

There is one manual Articles migration and no reset/maintenance scripts. Historical recovery is available on `backup/pre-demolition-20261025` at `447a777`; existing local recovery archives are untracked, ignored and excluded from compilation/lint. Do not put archives, database exports or secrets in `public/` or commit them. No history is rewritten.

No automatic push, deployment or hosted configuration changes are part of repository cleanup.
