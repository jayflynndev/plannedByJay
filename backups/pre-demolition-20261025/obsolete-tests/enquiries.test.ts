import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import {
  contactSchema,
  detailsSchema,
  enquirySchema,
  holidaySchema,
  initialDraft,
  submissionSchema,
} from '../src/lib/enquiries/schema';
import { buildNotification } from '../src/lib/enquiries/email';
import { processNotification } from '../src/lib/enquiries/notifications';
import {
  getEnquiryConfig,
  type EnquiryConfig,
} from '../src/lib/enquiries/config';
import {
  newSession,
  readSession,
  secureEqual,
  verifyTurnstile,
} from '../src/lib/enquiries/security';
import type { StoredEnquiry } from '../src/lib/enquiries/store';
import { parseSubmission } from '../src/lib/enquiries/request';
import { policies } from '../src/content/policies';

const draft = {
  ...initialDraft,
  destinationChoice: 'open',
  holidayType: 'family',
  dateChoice: 'flexible',
  duration: 'seven',
  budget: 'guidance',
  name: 'Test Traveller',
  email: 'test@example.com',
  intention: 'future',
};
const config: EnquiryConfig = {
  origin: 'http://localhost:3000',
  databaseUrl: 'https://example.supabase.co',
  databaseKey: 'test-key-not-a-real-credential',
  resendKey: 'test-key-not-real',
  from: 'Jay <jay@example.com>',
  to: 'business@example.com',
  secret: 'a'.repeat(40),
  retrySecret: 'b'.repeat(40),
};

test('open destination, solo adult and flexible dates need no exact destination or airport', () => {
  const result = enquirySchema.parse(draft);
  assert.equal(result.adults, 1);
  assert.equal(result.children, 0);
  assert.equal(result.startDate, '');
  assert.equal(result.departurePreferences, '');
  assert.equal(result.budget, 'guidance');
});
test('required choices, conditional destination, child counts and each age are validated', () => {
  assert.equal(holidaySchema.safeParse(initialDraft).success, false);
  assert.equal(
    holidaySchema.safeParse({
      ...draft,
      destinationChoice: 'known',
      destinationIdeas: '',
    }).success,
    false,
  );
  assert.equal(
    holidaySchema.safeParse({ ...draft, children: '2', childrenAges: ['4'] })
      .success,
    false,
  );
  assert.equal(
    holidaySchema.safeParse({ ...draft, children: '1', childrenAges: ['18'] })
      .success,
    false,
  );
  assert.equal(
    holidaySchema.safeParse({ ...draft, adults: '0' }).success,
    false,
  );
  const family = enquirySchema.parse({
    ...draft,
    destinationChoice: 'ideas',
    destinationIdeas: 'Italy or Spain',
    adults: '5',
    children: '2',
    childrenAges: ['0', '17'],
  });
  assert.deepEqual(family.childrenAges, [0, 17]);
});
test('dates, optional free-text departures and total budget rules', () => {
  assert.equal(
    detailsSchema.safeParse({
      ...draft,
      dateChoice: 'approximate',
      travelPeriod: '',
    }).success,
    false,
  );
  assert.equal(
    detailsSchema.safeParse({
      ...draft,
      dateChoice: 'specific',
      startDate: '2020-01-01',
      endDate: '2020-01-07',
    }).success,
    false,
  );
  assert.equal(
    detailsSchema.safeParse({
      ...draft,
      dateChoice: 'specific',
      startDate: '2099-02-31',
      endDate: '2099-03-07',
    }).success,
    false,
  );
  assert.equal(
    detailsSchema.safeParse({
      ...draft,
      dateChoice: 'specific',
      startDate: '2099-08-14',
      endDate: '2099-08-07',
    }).success,
    false,
  );
  assert.equal(
    detailsSchema.safeParse({
      ...draft,
      dateChoice: 'specific',
      startDate: '2099-08-07',
      endDate: '2099-08-14',
    }).success,
    true,
  );
  for (const departurePreferences of [
    '',
    'Manchester, Liverpool or flexible',
    'Dover cruise port; flights not required',
    'No preference',
  ]) {
    assert.equal(
      detailsSchema.safeParse({ ...draft, departurePreferences }).success,
      true,
    );
  }
  assert.equal(
    detailsSchema.safeParse({ ...draft, departurePreferences: 'x'.repeat(301) })
      .success,
    false,
  );
  assert.equal(
    enquirySchema.parse({
      ...draft,
      departurePreferences: '  Manchester, Liverpool  ',
    }).departurePreferences,
    'Manchester, Liverpool',
  );
  const parsed = enquirySchema.parse({
    ...draft,
    destinationIdeas: 'Hidden old answer',
    startDate: '2099-01-01',
    endDate: '2099-01-08',
  });
  assert.equal(parsed.destinationIdeas, '');
  assert.equal(parsed.startDate, '');
});
test('telephone is required only for telephone preference; email, length limits and strict payloads', () => {
  assert.equal(
    contactSchema.safeParse({ ...draft, contactMethod: 'telephone', phone: '' })
      .success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...draft, phone: 'abc' }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({
      ...draft,
      contactMethod: 'telephone',
      phone: '+44 (0) 7700 900123',
    }).success,
    true,
  );
  assert.equal(
    contactSchema.safeParse({ ...draft, email: 'not-email' }).success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...draft, preferences: 'x'.repeat(2001) })
      .success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...draft, unrecognised: 'extra' }).success,
    false,
  );
  assert.equal(
    submissionSchema.safeParse({
      submissionId: randomUUID(),
      brief: draft,
      website: '',
      turnstileToken: '',
    }).success,
    true,
  );
});
test('email includes a complete readable summary, escaped HTML and safe subject / Reply-To', () => {
  const brief = enquirySchema.parse({
    ...draft,
    name: '<Test & Traveller>',
    children: '1',
    childrenAges: ['7'],
    preferences: '<script>alert(1)</script>',
    departurePreferences: 'Manchester, Liverpool or Dover cruise port',
    dateChoice: 'approximate',
    travelPeriod: 'August 2099\nInjected: header',
    requirementsDiscussion: true,
  });
  const mail = buildNotification(
    brief,
    'PBJ-TEST',
    '2026-10-12T12:00:00Z',
    config.from,
    config.to,
  );
  assert.equal(mail.from, config.from);
  assert.equal(mail.reply_to, draft.email);
  assert.deepEqual(mail.to, [config.to]);
  assert.ok(!mail.subject.includes('\n'));
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(mail.html.includes('&lt;script&gt;'));
  assert.ok(
    mail.text.includes(
      'Departure preferences: Manchester, Liverpool or Dover cruise port',
    ),
  );
  assert.ok(mail.html.includes('Manchester, Liverpool or Dover cruise port'));
  for (const label of [
    'Enquiry reference',
    'Received (UTC)',
    'Customer name',
    'Email',
    'Telephone',
    'Preferred contact',
    'Destination ideas',
    'Holiday type',
    'Adults',
    'Children',
    'Children’s ages at travel',
    'Travel dates / period',
    'Duration',
    'Departure preferences',
    'Total party budget',
    'Important preferences',
    'Further private requirements discussion',
    'Planning intention',
  ])
    assert.ok(mail.text.includes(label), label);
});
test('request boundary rejects honeypots, invalid JSON, oversized bodies and server-invalid answers', async () => {
  const request = (body: unknown) =>
    new Request('http://localhost:3000/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  const valid = { submissionId: randomUUID(), brief: draft, website: '' };
  assert.equal((await parseSubmission(request(valid))).ok, true);
  const spam = await parseSubmission(
    request({ ...valid, website: 'bot website' }),
  );
  assert.equal(spam.ok, false);
  if (!spam.ok) assert.equal(spam.status, 403);
  const invalid = await parseSubmission(request('{not-json'));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.status, 400);
  const huge = await parseSubmission(request('x'.repeat(24001)));
  assert.equal(huge.ok, false);
  if (!huge.ok) assert.equal(huge.status, 413);
  const badBrief = await parseSubmission(
    request({ ...valid, brief: { ...draft, email: 'invalid' } }),
  );
  assert.equal(badBrief.ok, false);
  if (!badBrief.ok) assert.equal(badBrief.status, 422);
});
test('signed sessions cannot be forged; disabled or unapproved public environments fail closed', () => {
  const session = newSession(config.secret);
  assert.ok(readSession(session, config.secret));
  assert.equal(readSession(session + 'tampered', config.secret), null);
  assert.equal(readSession(session, 'other-secret'), null);
  assert.equal(secureEqual('short', 'longer'), false);
  const old = { ...process.env };
  const originalPrivacy = policies.privacy;
  try {
    process.env.ENQUIRIES_ENABLED = 'false';
    assert.equal(getEnquiryConfig(), null);
    Object.assign(process.env, {
      ENQUIRIES_ENABLED: 'true',
      APP_ORIGIN: config.origin,
      SUPABASE_URL: config.databaseUrl,
      SUPABASE_SECRET_KEY: config.databaseKey,
      RESEND_API_KEY: config.resendKey,
      ENQUIRY_EMAIL_FROM: config.from,
      ENQUIRY_EMAIL_TO: config.to,
      ENQUIRY_SECURITY_SECRET: config.secret,
      ENQUIRY_RETRY_SECRET: config.retrySecret,
    });
    assert.ok(getEnquiryConfig());
    process.env.APP_ORIGIN = 'https://public.example.com';
    process.env.ENQUIRIES_LIVE_APPROVED = 'false';
    assert.equal(getEnquiryConfig(), null);
    process.env.ENQUIRIES_LIVE_APPROVED = 'true';
    process.env.ENQUIRY_PRIVACY_APPROVED = 'true';
    assert.equal(getEnquiryConfig(), null); // Completed draft is still unapproved.
    policies.privacy = {...originalPrivacy, approved: true};
    assert.equal(getEnquiryConfig(), null); // Unresolved review cannot enable public enquiries.
    policies.privacy = {...originalPrivacy, approved: true, reviewRequired: []};
    assert.ok(getEnquiryConfig());
    process.env.ENQUIRIES_LIVE_APPROVED = 'false';
    assert.equal(getEnquiryConfig(), null); // Publishing is not launch approval.
  } finally {
    policies.privacy = originalPrivacy;
    for (const key of Object.keys(process.env))
      if (!(key in old)) delete process.env[key];
    Object.assign(process.env, old);
  }
});
test('notification acceptance, failure, ambiguous timeout and stale lease handling use immutable idempotent requests', async () => {
  const record = {
    id: randomUUID(),
    reference: 'PBJ-TEST',
    notification_email: buildNotification(
      enquirySchema.parse(draft),
      'PBJ-TEST',
      '2026-10-12T12:00:00Z',
      config.from,
      config.to,
    ),
    lease_token: randomUUID(),
  } as StoredEnquiry;
  const originalFetch = global.fetch;
  const updates: unknown[][] = [];
  const requests: RequestInit[] = [];
  const store = {
    claim: async () => [record],
    finish: async (
      ...args: [string, string, boolean, string | null, string | null]
    ) => {
      updates.push(args);
      return true;
    },
  };
  try {
    global.fetch = async (_url, init) => {
      requests.push(init!);
      return Response.json({ id: 'provider-message-id' });
    };
    assert.equal(
      await processNotification(store, config, record.id),
      'accepted',
    );
    assert.equal(updates[0][2], true);
    global.fetch = async (_url, init) => {
      requests.push(init!);
      return Response.json(
        { message: 'Technical secret must never be surfaced' },
        { status: 503 },
      );
    };
    assert.equal(await processNotification(store, config, record.id), 'failed');
    assert.equal(updates[1][4], 'provider_http_503');
    assert.equal(requests[0].body, requests[1].body);
    assert.deepEqual(requests[0].headers, requests[1].headers);
    const legacy = {
      ...record,
      brief: { departures: ['manchester'], departureOther: 'Dover port' },
      notification_email: {
        ...record.notification_email,
        text: 'Original departure options: Manchester; Dover port',
      },
    } as unknown as StoredEnquiry;
    await processNotification(
      { ...store, claim: async () => [legacy] },
      config,
      legacy.id,
    );
    assert.equal(
      JSON.parse(String(requests[2].body)).text,
      legacy.notification_email.text,
    );
    global.fetch = async () => {
      throw new Error('timeout');
    };
    assert.equal(await processNotification(store, config, record.id), 'failed');
    assert.equal(updates[3][4], 'provider_network_or_timeout');
    await assert.rejects(
      processNotification(
        { ...store, finish: async () => false },
        config,
        record.id,
      ),
      /notification_state_not_saved/,
    );
    assert.equal(
      await processNotification(
        { ...store, claim: async () => [] },
        config,
        null,
      ),
      'idle',
    );
  } finally {
    global.fetch = originalFetch;
  }
});
test('optional Turnstile rejects missing, mismatched and failed verification', async () => {
  const originalFetch = global.fetch;
  const secured = {
    ...config,
    origin: 'https://example.com',
    turnstileSecret: 'test-secret',
  };
  try {
    assert.equal(await verifyTurnstile('', secured), false);
    global.fetch = async () =>
      Response.json({
        success: true,
        hostname: 'wrong.example.com',
        action: 'holiday-enquiry',
      });
    assert.equal(await verifyTurnstile('token', secured), false);
    global.fetch = async () =>
      Response.json({
        success: true,
        hostname: 'example.com',
        action: 'holiday-enquiry',
      });
    assert.equal(await verifyTurnstile('token', secured), true);
    global.fetch = async () => {
      throw new Error('offline');
    };
    assert.equal(await verifyTurnstile('token', secured), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('actual migration: protected records, atomic duplicates/rates, notification leases, backoff and manual recovery', async () => {
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
    const receive = async (
      id: string = randomUUID(),
      fingerprint = 'same-brief',
      session = 'session-a',
      email = 'email-a',
    ) => {
      const result = await db.query<{
        result: { outcome: string; id: string; reference: string };
      }>(
        'select public.receive_holiday_enquiry($1,$2,now(),$3,$4,$5,$6,$7) as result',
        [
          id,
          `PBJ-${id}`,
          JSON.stringify(enquirySchema.parse(draft)),
          '{}',
          fingerprint,
          session,
          email,
        ],
      );
      return result.rows[0].result;
    };
    await db.exec('set role service_role');
    const first = await receive();
    assert.equal(first.outcome, 'received');
    const saved = await db.query<{ brief: Record<string, unknown> }>(
      'select brief from public.holiday_enquiries where id=$1',
      [first.id],
    );
    assert.equal(saved.rows[0].brief.departurePreferences, '');
    assert.equal('departures' in saved.rows[0].brief, false);
    assert.equal('departureOther' in saved.rows[0].brief, false);
    assert.equal((await receive(first.id)).outcome, 'duplicate');
    assert.equal((await receive(first.id, 'edited-brief')).outcome, 'conflict');
    assert.equal((await receive(randomUUID())).id, first.id);
    const count = await db.query<{ count: number }>(
      'select count(*)::integer as count from public.holiday_enquiries',
    );
    assert.equal(count.rows[0].count, 1);
    const claim = await db.query<StoredEnquiry>(
      'select * from public.claim_holiday_notification($1)',
      [first.id],
    );
    const leased = claim.rows[0];
    assert.equal(leased.notification_status, 'sending');
    assert.equal(leased.notification_attempts, 1);
    assert.equal(
      (
        await db.query('select * from public.claim_holiday_notification($1)', [
          first.id,
        ])
      ).rows.length,
      0,
    );
    const wrongLease = await db.query<{ result: boolean }>(
      'select public.finish_holiday_notification($1,$2,true,$3,null) as result',
      [first.id, randomUUID(), 'provider-id'],
    );
    assert.equal(wrongLease.rows[0].result, false);
    await db.query(
      'select public.finish_holiday_notification($1,$2,false,null,$3)',
      [first.id, leased.lease_token, 'provider_http_503'],
    );
    assert.equal(
      (
        await db.query('select * from public.claim_holiday_notification($1)', [
          first.id,
        ])
      ).rows.length,
      0,
      'backoff stops immediate retry',
    );
    await db.query(
      "update public.holiday_enquiries set notification_next_attempt_at = now() - interval '1 second' where id=$1",
      [first.id],
    );
    const retry = await db.query<StoredEnquiry>(
      'select * from public.claim_holiday_notification($1)',
      [first.id],
    );
    assert.equal(retry.rows[0].notification_attempts, 2);
    await db.query(
      'select public.finish_holiday_notification($1,$2,true,$3,null)',
      [first.id, retry.rows[0].lease_token, 'provider-id'],
    );
    assert.equal(
      (
        await db.query('select * from public.claim_holiday_notification($1)', [
          first.id,
        ])
      ).rows.length,
      0,
      'accepted is never sent again',
    );
    await receive(randomUUID(), 'brief-2');
    await receive(randomUUID(), 'brief-3');
    assert.equal(
      (await receive(randomUUID(), 'brief-4')).outcome,
      'rate_limited',
      'email limit',
    );
    // One shared network never enters the rate-limit key; separate sessions/emails remain eligible.
    assert.equal(
      (
        await receive(
          randomUUID(),
          'different-customer',
          'session-b',
          'email-b',
        )
      ).outcome,
      'received',
    );
    for (let i = 0; i < 2; i++)
      assert.equal(
        (
          await receive(
            randomUUID(),
            `session-test-${i}`,
            'session-a',
            `email-${i}`,
          )
        ).outcome,
        'received',
      );
    assert.equal(
      (
        await receive(
          randomUUID(),
          'session-test-extra',
          'session-a',
          'email-new',
        )
      ).outcome,
      'rate_limited',
      'session limit',
    );
    const lostLease = await receive(
      randomUUID(),
      'lost-lease',
      'session-c',
      'email-c',
    );
    await db.query('select * from public.claim_holiday_notification($1)', [
      lostLease.id,
    ]);
    await db.query(
      "update public.holiday_enquiries set lease_until=now()-interval '1 second' where id=$1",
      [lostLease.id],
    );
    assert.equal(
      (
        await db.query<StoredEnquiry>(
          'select * from public.claim_holiday_notification($1)',
          [lostLease.id],
        )
      ).rows[0].notification_attempts,
      2,
    );
    await db.query(
      "update public.holiday_enquiries set lease_until=now()-interval '1 second',notification_first_attempt_at=now()-interval '24 hours' where id=$1",
      [lostLease.id],
    );
    assert.equal(
      (
        await db.query('select * from public.claim_holiday_notification($1)', [
          lostLease.id,
        ])
      ).rows.length,
      0,
    );
    const manual = await db.query<{ notification_status: string }>(
      'select notification_status from public.holiday_enquiries where id=$1',
      [lostLease.id],
    );
    assert.equal(manual.rows[0].notification_status, 'manual_review');
    await db.exec('reset role; set role anon');
    await assert.rejects(
      db.query('select * from public.holiday_enquiries'),
      /permission denied/,
    );
    await assert.rejects(
      db.query('select * from public.claim_holiday_notification(null)'),
      /permission denied/,
    );
    await db.exec('reset role; set role authenticated');
    await assert.rejects(
      db.query('select * from public.holiday_enquiries'),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        'select public.finish_holiday_notification($1,$2,true,$3,null)',
        [first.id, randomUUID(), 'bad'],
      ),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
