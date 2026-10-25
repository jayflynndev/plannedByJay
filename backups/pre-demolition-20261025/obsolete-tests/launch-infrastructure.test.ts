import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { PGlite } from '@electric-sql/pglite';
import { buildPublicSitemap, loadSitemapArticles } from '../src/lib/cms/sitemap';
import { approvedPolicies, policies } from '../src/content/policies';

test('sitemap selects only public metadata, includes published URLs, handles empty and degraded reads explicitly', async () => {
  let mode = 'published'; const requests: URL[] = []; const logs: string[] = [];
  const client = createClient('https://fixture.supabase.co', 'sb_publishable_fixture', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      requests.push(new URL(String(input)));
      if (mode === 'outage') return Response.json({message:'private upstream details'}, {status:503});
      if (mode === 'draft') return Response.json([{slug:'secret-draft',updated_at:'2026-10-22T12:00:00Z',status:'draft'}]);
      return Response.json(mode === 'empty' ? [] : [{slug:'published-guide',updated_at:'2026-10-22T12:00:00Z',status:'published'}]);
    } },
  });
  const run=()=>buildPublicSitemap('https://plannedbyjay.com', approvedPolicies(),()=>loadSitemapArticles(client),code=>logs.push(code));
  const normal=await run();
  assert.ok(normal.some(row=>row.url.endsWith('/travel-advice/published-guide')));
  assert.ok(!normal.some(row=>row.url.endsWith('/privacy')||row.url.endsWith('/cookies')));
  assert.ok(normal.some(row=>row.url.endsWith('/booking-information')));
  assert.equal(requests[0].searchParams.get('select'),'slug,updated_at,status');
  assert.equal(requests[0].searchParams.get('status'),'eq.published');
  mode='empty'; const empty=await run(); assert.equal(empty.length,11); assert.equal(logs.length,0);
  mode='outage'; assert.deepEqual(await run(),empty); assert.equal(logs.pop(),'sitemap_stable_only:cms_query_failed');
  mode='draft'; assert.deepEqual(await run(),empty); assert.equal(logs.pop(),'sitemap_stable_only:cms_unavailable');
  await buildPublicSitemap('https://plannedbyjay.com',[],()=>loadSitemapArticles(null),code=>logs.push(code));
  assert.equal(logs.pop(),'sitemap_stable_only:cms_unconfigured');
  assert.equal(policies.privacy.approved,false); assert.equal(policies.cookies.approved,false);
});

test('erasure migration preserves legacy rows, denies public roles and refuses outstanding and ambiguous notifications', async () => {
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    for(const file of ['20261012_holiday_enquiries.sql','20261013_friendly_enquiry_references.sql'])
      await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'));
    let nextReference=200000;
    const receive=async()=>{
      const id=randomUUID(), reference=`PBJ-${nextReference++}`;
      await db.query('select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7)',
        [id,reference,{fixture:'brief'},{fixture:'immutable snapshot'},id,`session-${id}`,`email-${id}`]);
      return {id,reference};
    };
    const legacy=await receive();
    const before=(await db.query('select * from public.holiday_enquiries')).rows;
    await db.exec(await readFile('supabase/migrations/20261022_safe_enquiry_erasure.sql','utf8'));
    assert.deepEqual((await db.query('select * from public.holiday_enquiries')).rows,before);
    const erase=async(row:{id:string;reference:string},authorised=true)=>
      (await db.query<{result:string}>('select public.erase_holiday_enquiry($1,$2,$3) as result',[row.id,row.reference,authorised])).rows[0].result;
    const claim=async(id:string)=>(await db.query<{lease_token:string}>('select * from public.claim_holiday_notification($1)',[id])).rows[0];
    const finish=async(id:string,token:string,accepted=true)=>(await db.query<{result:boolean}>(
      'select public.finish_holiday_notification($1,$2,$3,$4,$5) as result',[id,token,accepted,accepted?'provider-fixture':null,accepted?null:'provider_network_or_timeout'])).rows[0].result;
    await db.exec('set role service_role');
    assert.equal(await erase(legacy),'notification_unresolved','legacy workers require explicit reconciliation');
    const pending=await receive(); const unrelated=await receive();
    assert.equal(await erase(pending,false),'authorisation_required');
    assert.equal(await erase({...pending,reference:unrelated.reference}),'reference_mismatch');
    assert.equal(await erase(pending),'erased','erase wins before claim');
    assert.equal(await claim(pending.id),undefined);
    assert.equal(await erase(pending),'not_found');
    assert.equal((await db.query('select reference from public.holiday_enquiry_reference_reservations where reference=$1',[pending.reference])).rows.length,1);
    const reuse=await db.query<{result:{outcome:string}}>('select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7) as result',
      [randomUUID(),pending.reference,{fixture:'other brief'},{fixture:'other email'},randomUUID(),randomUUID(),randomUUID()]);
    assert.equal(reuse.rows[0].result.outcome,'reference_collision','erasure never recycles issued reference');
    await assert.rejects(db.query('delete from public.holiday_enquiries where id=$1',[unrelated.id]),/permission denied/);
    const sending=await receive();const first=await claim(sending.id);
    assert.equal(await erase(sending),'notification_unresolved','claim wins before erase');
    await db.query("update public.holiday_enquiries set lease_until=now()-interval '1 second' where id=$1",[sending.id]);
    const second=await claim(sending.id);
    assert.notEqual(first.lease_token,second.lease_token);
    assert.equal(await finish(sending.id,second.lease_token),true);
    assert.equal(await erase(sending),'notification_unresolved','accepted newer worker cannot erase older outstanding attempt');
    assert.equal(await finish(sending.id,randomUUID()),false);
    assert.equal(await erase(sending),'notification_unresolved','forged/stale token cannot release another blocker');
    assert.equal(await finish(sending.id,first.lease_token),false,'stale completion leaves current accepted state intact');
    assert.equal(await erase(sending),'erased');
    const failed=await receive();const failedLease=await claim(failed.id);
    await finish(failed.id,failedLease.lease_token,false);
    assert.equal(await erase(failed),'notification_unresolved','timeout is not a confirmed safe outcome');
    await db.query("update public.holiday_enquiries set notification_next_attempt_at=now()-interval '1 second' where id=$1",[failed.id]);
    const retry=await claim(failed.id); assert.equal(await finish(failed.id,retry.lease_token),true);
    assert.equal(await erase(failed),'erased','existing retry then acceptance still works');
    assert.equal((await db.query('select id from public.holiday_enquiries where id=$1',[unrelated.id])).rows.length,1);
    for(const role of ['anon','authenticated']) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(erase(unrelated),/permission denied/);
      await assert.rejects(db.query('select * from public.holiday_notification_erasure_blockers'),/permission denied/);
    }
  } finally { await db.close(); }
});
