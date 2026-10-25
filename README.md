# Planned by Jay

Public Next.js frontend only. The old administration, authentication, APIs, enquiry processing and database implementation have been removed. No replacement backend exists. The Holiday Brief is a disabled, read-only three-stage layout and cannot collect or transmit answers.

Run `npm ci`, then `npm run dev` and visit http://localhost:3000.

Start with [the owner's guide](docs/WEBSITE-GUIDE.md), [demolition handover](docs/BACKEND-REMOVAL.md) and [design system](docs/DESIGN-SYSTEM.md). Use Node 22.13+ (Node 24 used for validation). Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`. Only the optional public `SITE_URL` setting is used; existing private environment files and hosted settings have not been modified.

Travel Advice and Holiday Offers show empty states; old individual content URLs return 404. Static pages, six holiday guides, portrait/assets, branding, public navigation, SEO helpers and reusable presentation components remain. Existing policy approval guards are preserved; historical draft text is not newly approved by this cleanup.

The scoped [manual reset SQL](maintenance/RESET-PLANNED-BY-JAY.sql) has **not** been executed. Hosted backup completion is outstanding; read [the reset instructions](maintenance/README.md) before any irreversible action. Do not push or deploy automatically.
