# Planned by Jay project rules

Build one page at a time; the homepage and Phase 2 holiday enquiry page are authorised. Keep editable content in src/content, reuse established components, preserve working functionality and avoid unnecessary dependencies. Document significant features and update docs/WEBSITE-GUIDE.md when editing instructions change. Use British English. Never invent business credentials, prices, reviews, personal travel experience, protection claims or legal wording. Do not deploy, connect external services or enable public enquiry submissions without explicit approval. Run tests, lint, typecheck and production build after substantial enquiry changes. Keep customer enquiry records and provider credentials server-side. Provider acceptance must never be labelled as confirmed inbox delivery. Preserve durable enquiry records when notifications fail.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
