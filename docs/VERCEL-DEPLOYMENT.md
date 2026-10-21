# Vercel deployment ID collision — 21 October 2026

## Confirmed cause

The earlier hydration investigation added a source fingerprint in `scripts/application-version.ts`. `next.config.ts` assigned it to both `deploymentId` and `outputHashSalt`. Unchanged source/configuration/dependencies produced exactly the same `pbj-…` value on every build, including repeated deployments of one Git commit. Vercel requires a user-configured deployment ID to be unique per project and rejects an ID already assigned to a deployment. The reported `pbj-872d6c9b17ce1ba36127` error matches that failure path. A source version identifies content, not a unique deployment event.

The build script was already the standard `next build`; it did not generate a new deployment ID. There is no need to change application pages or provider configuration to fix this collision.

## Fix

- Removed the custom `deploymentId`, custom `outputHashSalt`, build-manifest reader and source-fingerprinting utility.
- Let the installed Next.js/Vercel integration resolve the native deployment identity and any platform-supplied asset hash salt. No Git SHA, source fingerprint, timestamp or random identifier is assigned by project code.
- Kept Next's content-addressed JavaScript/CSS output, the server-owned Navbar snapshot, the enquiry form's Fast Refresh reset, and the existing disabled persistent development compiler cache. No hydration suppression or random React rendering was introduced.
- Local `next build` now uses Next's ordinary generated build identity; `next start` uses the built output. On Vercel, native deployment identity and Skew Protection handle framework-managed asset/navigation versioning. These are related but distinct identities: local BUILD_ID is not a Vercel deployment ID.

This removes the repeated-source collision without requiring a different commit for each redeployment. Next's deployment ID/header/query handling remains platform-controlled; arbitrary client `fetch()` calls are not automatically pinned by Vercel Skew Protection. No CMS or enquiry request protocol has been changed.

## Vercel settings to check manually

No remote settings were inspected or changed, and no deployment was performed.

1. Use the **Next.js** framework preset, the normal `npm run build` command and the default Next.js output settings. Use Node 22.13+ (Node 24 is suitable for this project's dependencies).
2. Under project settings, keep **Enable access to System Environment Variables** enabled. Under **Settings → Advanced → Skew Protection**, verify Skew Protection is enabled if available for your team's plan. Vercel documents availability for Pro/Enterprise; the current account/plan and switch were not inspected. Native Next asset hashing remains in use regardless, but do not claim platform request pinning is active unless the setting is available and enabled.
3. If you manually added fixed `NEXT_DEPLOYMENT_ID`, `VERCEL_DEPLOYMENT_ID` or `NEXT_HASH_SALT` overrides in Vercel/CI during debugging, remove only those user-created versioning overrides. Let the platform populate its own values. Do not change Supabase/Resend keys or `.env.local`. No new versioning environment variable is required by this fix.
4. When ready, deploy the updated code yourself using the normal Vercel build flow, then redeploy the same commit. Both should receive separate native deployment IDs, without the duplicate custom-ID error. No existing deployment needs deleting, and a build-cache purge is not required for the source-hash collision.

These instructions assume Vercel runs the build. Uploading the same prebuilt `.vercel/output` repeatedly is a separate workflow: Vercel documents additional unique build-time ID requirements for prebuilt deployments. No prebuilt upload/deployment automation is added here. Do not upload an older prebuilt output that still embeds `pbj-…`; rebuild the changed configuration first.

## Verification

The regression suite loads the installed Next.js configuration resolver in isolated child processes with identical project configuration and two different simulated platform IDs. It confirms each provided identity is accepted, platform hash salt is preserved and the native Vercel runtime-deployment integration is enabled. The temporary fixture has no real `.env.local` and makes no Vercel API requests. Existing DOM tests continue checking navbar/enquiry hydration and the full form journey.

For local repeated-build verification, run two production builds with unchanged source and compare `.next/BUILD_ID` after each; they should differ without a project-supplied deployment ID. Run tests, lint and TypeScript too. Hosted redeployment acceptance and routing can only be confirmed after the owner deploys.

Executed on 21 October 2026 using Node 24: all **33 tests**, ESLint and TypeScript passed. Two consecutive `npm run build` runs passed with unchanged application source. Their native build IDs were `yHKzX40vO7x4g5Ujq2amQ` and `eeJHlZLGNRlkbJMNv90i_`. The final production manifest has no custom deployment ID or output hash salt. No local application server was started and no Vercel deployment was attempted.

After deployment, open the site in one tab, redeploy, then navigate from that old tab. Check the network's framework-managed assets/navigation for the platform's deployment query/header and check for new hydration warnings. Keep an unfinished enquiry out of any deliberate reload test; a full refresh discards unsaved answers. The primary CTA must still point to `/plan-my-holiday`, and blank optional departures must remain strings.

References: [Vercel Skew Protection, custom ID uniqueness and native framework support](https://vercel.com/docs/skew-protection), [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables), [Next.js deployment ID behaviour](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId). The installed Next 16.4 configuration resolver was also inspected directly; no dependency upgrade was needed.
