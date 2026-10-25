import type { NextConfig } from 'next';

// Let Next.js and Vercel supply build/deployment identities and asset hashing.
// A source hash repeats on redeploy and cannot be used as a unique Vercel deployment ID.
const nextConfig: NextConfig = {
  // Keep the existing safeguard against restoring development compiler state.
  experimental: { turbopackFileSystemCacheForDev: false },
};
export default nextConfig;
