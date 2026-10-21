import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import {
  generateEnquiryReference,
  receiveWithFriendlyReference,
} from '../src/lib/enquiries/references';
import { buildNotification } from '../src/lib/enquiries/email';
import { enquirySchema, initialDraft } from '../src/lib/enquiries/schema';

const brief = enquirySchema.parse({
  ...initialDraft,
  destinationChoice: 'open',
  holidayType: 'family',
  dateChoice: 'flexible',
  duration: 'seven',
  budget: 'guidance',
  name: 'Test Traveller',
  email: 'test@example.com',
  intention: 'future',
});

test('successive secure random references always have six digits beyond 99999', () => {
  for (let i = 0; i < 300; i++) {
    const reference = generateEnquiryReference();
    assert.match(reference, /^PBJ-[1-9]\d{5}$/);
    assert.ok(
      Number(reference.slice(4)) >= 100000 &&
        Number(reference.slice(4)) <= 999999,
    );
  }
});

test('collision retry is bounded, preserves duplicate references and never retries unrelated failures', async () => {
  const candidates = ['PBJ-100000', 'PBJ-999999'];
  let attempts = 0;
  let next = 0;
  const result = await receiveWithFriendlyReference(
    async (reference) => {
      attempts++;
      return reference === 'PBJ-100000'
        ? { outcome: 'reference_collision' }
        : { outcome: 'received', reference };
    },
    () => candidates[next++],
  );
  assert.equal(result.reference, 'PBJ-999999');
  assert.equal(attempts, 2);
  let calls = 0;
  const duplicate = await receiveWithFriendlyReference(
    async () => {
      calls++;
      return { outcome: 'duplicate', reference: 'PBJ-583742' };
    },
    () => 'PBJ-100001',
  );
  assert.equal(duplicate.reference, 'PBJ-583742');
  assert.equal(calls, 1);
  await assert.rejects(
    receiveWithFriendlyReference(
      async () => ({ outcome: 'reference_collision' }),
      () => 'PBJ-100000',
    ),
    /reference_allocation_unavailable/,
  );
  await assert.rejects(
    receiveWithFriendlyReference(async () => {
      throw new Error('database unavailable');
    }),
    /database unavailable/,
  );
});

test('non-destructive migration, overlapping allocations, collisions, permanent reservations and existing retries', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      'create role anon; create role authenticated; create role service_role bypassrls;',
    );
    await db.exec(
      await readFile(
        'supabase/migrations/20261012_holiday_enquiries.sql',
        'utf8',
      ),
    );
    const oldId = randomUUID();
    const oldReference = `PBJ-${randomUUID().toUpperCase()}`;
    const oldEmail = buildNotification(
      brief,
      oldReference,
      '2026-10-12T12:00:00Z',
      'sender@example.com',
      'business@example.com',
    );
    await db.query(
      'select public.receive_holiday_enquiry($1,$2,now(),$3,$4,$5,$6,$7)',
      [
        oldId,
        oldReference,
        JSON.stringify(brief),
        JSON.stringify(oldEmail),
        'old-fingerprint',
        'old-session',
        'old-email',
      ],
    );
    await db.query(
      'update public.holiday_enquiries set notification_provider_id=$2 where id=$1',
      [oldId, 'original-provider-id'],
    );
    const original = (
      await db.query('select * from public.holiday_enquiries where id=$1', [
        oldId,
      ])
    ).rows[0];
    await db.exec(
      await readFile(
        'supabase/migrations/20261013_friendly_enquiry_references.sql',
        'utf8',
      ),
    );
    assert.deepEqual(
      (
        await db.query('select * from public.holiday_enquiries where id=$1', [
          oldId,
        ])
      ).rows[0],
      original,
    );
    await db.exec('set role service_role');
    const receive = async (id: string, reference: string, identity = id) => {
      const email = buildNotification(
        brief,
        reference,
        '2026-10-13T12:00:00Z',
        'sender@example.com',
        'business@example.com',
      );
      const result = await db.query<{
        result: {
          outcome: 'received' | 'duplicate' | 'reference_collision';
          id: string;
          reference: string;
        };
      }>(
        'select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7) as result',
        [
          id,
          reference,
          JSON.stringify(brief),
          JSON.stringify(email),
          identity,
          `session-${identity}`,
          `email-${identity}`,
        ],
      );
      return result.rows[0].result;
    };
    const id = randomUUID();
    const first = await receive(id, 'PBJ-100000');
    assert.equal(first.outcome, 'received');
    const duplicate = await receive(id, 'PBJ-999999');
    assert.equal(duplicate.reference, first.reference);
    const contentDuplicate = await receive(randomUUID(), 'PBJ-999999', id);
    assert.equal(contentDuplicate.reference, first.reference);
    const stored = (
      await db.query<{ notification_email: typeof oldEmail }>(
        'select notification_email from public.holiday_enquiries where id=$1',
        [id],
      )
    ).rows[0];
    assert.ok(
      stored.notification_email.text.includes(
        `Enquiry reference: ${first.reference}`,
      ),
    );
    assert.ok(!stored.notification_email.text.includes(id));
    const overlaps = await Promise.all(
      Array.from({ length: 8 }, (_, index) => {
        let attempt = 0;
        const overlapId = randomUUID();
        return receiveWithFriendlyReference(
          (reference) => receive(overlapId, reference),
          () => (attempt++ === 0 ? 'PBJ-100000' : `PBJ-${200000 + index}`),
        );
      }),
    );
    assert.equal(new Set(overlaps.map((row) => row.reference)).size, 8);
    assert.ok(overlaps.every((row) => row.outcome === 'received'));
    const quota = await db.query<{ count: number }>(
      'select count from public.holiday_enquiry_limits where actor_hash=$1',
      [`session-${overlaps[0].id}`],
    );
    assert.equal(
      quota.rows[0].count,
      1,
      'collisions must roll back quota increments',
    );
    await assert.rejects(
      db.query('update public.holiday_enquiries set reference=$2 where id=$1', [
        id,
        'PBJ-888888',
      ]),
      /cannot change/,
    );
    await db.query('delete from public.holiday_enquiries where id=$1', [id]);
    assert.equal(
      (await receive(randomUUID(), 'PBJ-100000')).outcome,
      'reference_collision',
    );
    await assert.rejects(
      db.query('delete from public.holiday_enquiry_reference_reservations'),
      /permission denied/,
    );
    await assert.rejects(
      db.query('truncate public.holiday_enquiry_reference_reservations'),
      /permission denied/,
    );
    await assert.rejects(
      receive(randomUUID(), 'PBJ-099999'),
      /Invalid friendly/,
    );
    const legacyDuplicate = await db.query<{ result: { reference: string } }>(
      'select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7) as result',
      [
        oldId,
        'PBJ-416835',
        JSON.stringify(brief),
        JSON.stringify(oldEmail),
        'old-fingerprint',
        'old-session',
        'old-email',
      ],
    );
    assert.equal(legacyDuplicate.rows[0].result.reference, oldReference);
    const claimed = (
      await db.query<{
        notification_email: typeof oldEmail;
        id: string;
        lease_token: string;
      }>('select * from public.claim_holiday_notification($1)', [oldId])
    ).rows[0];
    assert.deepEqual(claimed.notification_email, oldEmail);
    await db.query(
      'select public.finish_holiday_notification($1,$2,true,$3,null)',
      [oldId, claimed.lease_token, 'new-provider-id'],
    );
    assert.equal(
      (
        await db.query('select * from public.claim_holiday_notification($1)', [
          oldId,
        ])
      ).rows.length,
      0,
    );
    await db.exec('reset role; set role anon');
    await assert.rejects(
      db.query('select * from public.holiday_enquiry_reference_reservations'),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        'select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7)',
        [randomUUID(), 'PBJ-416835', '{}', '{}', 'x', 'y', 'z'],
      ),
      /permission denied/,
    );
    await db.exec('reset role');
    await assert.rejects(
      db.query('delete from public.holiday_enquiry_reference_reservations'),
      /permanent/,
    );
    await assert.rejects(
      db.query('truncate public.holiday_enquiry_reference_reservations'),
      /permanent/,
    );
  } finally {
    await db.close();
  }
});
