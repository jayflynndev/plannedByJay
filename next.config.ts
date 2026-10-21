import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_SERVER } from 'next/constants';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applicationVersion } from './scripts/application-version';

const nextConfig = (phase: string): NextConfig => {
  // Production start must use the identity baked into its build, even if source was
  // subsequently edited. Dev/build derive an identity from public application source.
  const version =
    phase === PHASE_PRODUCTION_SERVER
      ? (
          JSON.parse(
            readFileSync(
              join(process.cwd(), '.next/required-server-files.json'),
              'utf8',
            ),
          ) as { config: { deploymentId: string } }
        ).config.deploymentId
      : applicationVersion(process.cwd());
  return {
    images: {
      remotePatterns: process.env.SUPABASE_URL
        ? [{ protocol: 'https', hostname: new URL(process.env.SUPABASE_URL).hostname, pathname: '/storage/v1/object/public/editorial-images/**', search: '' }]
        : [],
    },
    deploymentId: version,
    outputHashSalt: version,
    // Avoid restoring dev compiler state across restarts while investigating version skew.
    experimental: { turbopackFileSystemCacheForDev: false },
  };
};
export default nextConfig;
