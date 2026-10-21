import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applicationVersion } from '../scripts/application-version';
import { navigation, primaryNavigation } from '../src/content/navigation';

test('server-owned navigation config has the canonical enquiry CTA and stays outside the client module graph', async () => {
  assert.equal(primaryNavigation.href, '/plan-my-holiday');
  assert.deepEqual(
    JSON.parse(JSON.stringify({ navigation, primaryNavigation })),
    { navigation, primaryNavigation },
  );
  const navbar = await readFile('src/components/layout/Navbar.tsx', 'utf8');
  assert.equal(/import\s.*from\s+['"]@\/content\//.test(navbar), false);
  const config = await readFile('src/content/navigation.ts', 'utf8');
  assert.match(config, /import ['"]server-only['"]/);
});

test('application identity changes with source but never includes environment secrets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pbj-version-'));
  try {
    await mkdir(join(root, 'src'));
    await mkdir(join(root, 'scripts'));
    for (const file of [
      'next.config.ts',
      'package.json',
      'package-lock.json',
      'scripts/application-version.ts',
      'src/form.tsx',
    ])
      await writeFile(join(root, file), 'fixture');
    const first = applicationVersion(root);
    assert.equal(applicationVersion(root), first);
    await writeFile(join(root, '.env.local'), 'DO_NOT_INCLUDE_TEST_SECRET=one');
    assert.equal(applicationVersion(root), first);
    await writeFile(join(root, '.env.local'), 'DO_NOT_INCLUDE_TEST_SECRET=two');
    assert.equal(applicationVersion(root), first);
    await writeFile(join(root, 'src/form.tsx'), 'changed fixture');
    assert.notEqual(applicationVersion(root), first);
  } finally {
    await rm(root, { recursive: true });
  }
});
