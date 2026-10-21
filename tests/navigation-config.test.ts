import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import nextConfig from '../next.config';
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

test('project configuration leaves deployment identity and asset hashing to the framework', () => {
  for (const option of ['deploymentId', 'outputHashSalt', 'generateBuildId']) {
    assert.equal(Object.hasOwn(nextConfig, option), false);
  }
});

test('native Next configuration accepts a fresh platform ID for each redeploy of identical source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pbj-native-version-'));
  try {
    const loader = require.resolve('next/dist/server/config');
    // Separate processes avoid Next's config cache and never load the real .env.local.
    // Only platform-provided IDs differ; project config and source are identical.
    const code = `
      const loadConfig = require(process.argv[1]).default;
      loadConfig('phase-production-build', process.argv[2], {
        customConfig: JSON.parse(process.argv[3]), silent: true
      }).then(config => console.log(JSON.stringify({
        id: config.deploymentId, salt: config.outputHashSalt,
        runtime: config.experimental.runtimeServerDeploymentId
      }))).catch(error => { console.error(error.message); process.exitCode = 1; });
    `;
    for (const id of ['dpl_test_first', 'dpl_test_redeploy_same_commit']) {
      const result = spawnSync(process.execPath, ['-e', code, loader, root, JSON.stringify(nextConfig)], {
        encoding: 'utf8',
        env: {...process.env, VERCEL: '1', NOW_BUILDER: '1', NEXT_DEPLOYMENT_ID: id, NEXT_HASH_SALT: 'platform-test-salt'},
      });
      assert.equal(result.status, 0, result.stderr);
      const loaded = JSON.parse(result.stdout.trim());
      assert.equal(loaded.id, id);
      assert.equal(loaded.salt, 'platform-test-salt');
      assert.equal(loaded.runtime, true);
    }
  } finally {
    assert.equal(dirname(root), tmpdir());
    await rm(root, { recursive: true });
  }
});
