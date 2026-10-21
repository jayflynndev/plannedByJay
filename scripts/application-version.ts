import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Stable source fingerprint for Next's asset/version-skew protection. Never reads .env files. */
export function applicationVersion(root: string): string {
  const hash = createHash('sha256');
  const files = [
    'next.config.ts',
    'package.json',
    'package-lock.json',
    'scripts/application-version.ts',
  ];
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile())
        files.push(relative(root, path).replaceAll('\\', '/'));
    }
  }
  walk(join(root, 'src'));
  for (const file of files.sort())
    hash
      .update(file)
      .update('\0')
      .update(readFileSync(join(root, file)))
      .update('\0');
  return `pbj-${hash.digest('hex').slice(0, 20)}`;
}
