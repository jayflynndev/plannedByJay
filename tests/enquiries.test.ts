import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {offerFixture} from './helpers/offer-fixture';
import {emptyBrief,briefSchema,briefErrors,briefSnapshot,isBespokeReference,isLegacyBespokeReference,BESPOKE_REFERENCE_FORMAT} from '../src/lib/enquiries/schema';
import {bespokeEnquiryAvailability,bespokeServiceClient,completeBespokeEnquiry,notifyBespokeEnquiry,loadBespokeEnquiry,customerEnquiryReference,type StoredBespokeEnquiry} from '../src/lib/enquiries/server';
import {policies} from '../src/content/policies';
const sql=()=>readFile('supabase/migrations/20261027_bespoke_enquiries.sql','utf8');
const referenceSql=()=>readFile('supabase/migrations/20261027_bespoke_enquiry_references.sql','utf8');
const valid=()=>({...emptyBrief(),destinationChoice:'known',destinationIdeas:'Italy or Greece',holidayType:'family',adults:'2',children:'1',childrenAges:['7'],dateChoice:'approximate',travelPeriod:'August 2099, flexible by a week',duration:'seven',departurePreferences:'Manchester or Liverpool',budget:'2000-3000',preferences:'A quieter pool.\nTransfers included if possible.',requirementsDiscussion:true,name:'Fixture traveller',email:'fixture@example.org',phone:'01234567890',contactMethod:'telephone',intention:'soon'});
const keys=['SUPABASE_URL','SUPABASE_SECRET_KEY','RESEND_API_KEY','ENQUIRY_EMAIL_FROM','ENQUIRY_EMAIL_TO','BESPOKE_ENQUIRIES_ENABLED'];
function config(){const prior=keys.map(k=>process.env[k]);Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fixture',RESEND_API_KEY:'fixture-key',ENQUIRY_EMAIL_FROM:'Fixture <sender@example.org>',ENQUIRY_EMAIL_TO:'jay@plannedbyjay.com',BESPOKE_ENQUIRIES_ENABLED:'true'});return ()=>keys.forEach((k,i)=>{if(prior[i]===undefined)delete process.env[k];else process.env[k]=prior[i];});}

test('brief validation respects flexible choices, conditional fields, child ages and total budgets',()=>{
  assert.ok(briefSchema.safeParse(valid()).success);
  assert.ok(briefSchema.safeParse({...valid(),destinationChoice:'open',destinationIdeas:'',dateChoice:'flexible',travelPeriod:'',flexibleNotes:'',departurePreferences:'',budget:'guidance',phone:'',contactMethod:'email'}).success);
  for(const [key,value,error] of [['adults','0','adults'],['children','21','children'],['childrenAges',['18'],'childrenAges.0'],['childrenAges',[],'childrenAges'],['phone','','phone'],['email','bad','email'],['travelPeriod','','travelPeriod'],['destinationIdeas','','destinationIdeas']] as const)assert.ok(briefErrors({...valid(),[key]:value})[error]);
  assert.ok(briefErrors({...valid(),dateChoice:'specific',startDate:'2099-02-30',endDate:'2099-02-01'}).startDate);
  assert.ok(briefErrors({...valid(),dateChoice:'specific',startDate:'2099-02-02',endDate:'2099-02-01'}).endDate);
  const first=briefErrors(emptyBrief(),0);assert.ok(first.destinationChoice);assert.equal(first.email,undefined);
  const clean=briefSchema.parse({...valid(),destinationChoice:'open',dateChoice:'flexible',startDate:'2099-01-01',endDate:'2099-01-02'});
  assert.equal(clean.destinationIdeas,'');assert.equal(clean.startDate,'');assert.equal(clean.travelPeriod,'');
});

test('one re-runnable bespoke migration keeps private immutable briefs, random references, deduplication and rate limits',async()=>{
  const {db,admin,other,run,sample,save}=await offerFixture();
  const offer=await save(sample);await db.exec(await sql());
  const snapshot=briefSnapshot(briefSchema.parse(valid())),request=randomUUID(),hash='a'.repeat(64);
  const receive=async(id=request,brief=snapshot)=>(await db.query<{id:string}>('select public.receive_bespoke_enquiry($1,$2,$3) id',[id,brief,hash])).rows[0].id;
  try{
    const id=await receive(),original=(await db.query<StoredBespokeEnquiry>('select * from public.bespoke_enquiries where id=$1',[id])).rows[0];
    assert.ok(isLegacyBespokeReference(original.reference));assert.equal(original.name,valid().name);
    assert.equal(await receive(),id);assert.equal(await receive(randomUUID()),id,'reload with an identical brief reuses the saved record');
    await assert.rejects(receive(request,briefSnapshot(briefSchema.parse({...valid(),preferences:'Changed'}))),/different answers/);
    await db.exec(await sql());assert.deepEqual((await db.query('select brief,reference,created_at from public.bespoke_enquiries where id=$1',[id])).rows[0],{brief:original.brief,reference:original.reference,created_at:original.created_at});
    await assert.rejects(run('anon','', 'select * from public.bespoke_enquiries'),/permission denied/);
    assert.equal((await run('authenticated',other,'select * from public.bespoke_enquiries')).rows.length,0);
    assert.equal((await run('authenticated',admin,'select * from public.bespoke_enquiries')).rows.length,1);
    await assert.rejects(run('authenticated',admin,'delete from public.bespoke_enquiries'),/permission denied/);
    await assert.rejects(run('authenticated',admin,'select public.receive_bespoke_enquiry($1,$2,$3)',[randomUUID(),snapshot,hash]),/permission denied/);
    await assert.rejects(run('anon','','select public.receive_bespoke_enquiry($1,$2,$3)',[randomUUID(),snapshot,hash]),/permission denied/);
    await db.exec('begin;set local role service_role');
    assert.equal((await db.query<{id:string}>('select public.receive_bespoke_enquiry($1,$2,$3) id',[request,snapshot,hash])).rows[0].id,id);await db.exec('commit');
    await db.exec('begin;set local role service_role');
    await assert.rejects(db.query('update public.bespoke_enquiries set brief=$1 where id=$2',[snapshot,id]),/permission denied/);await db.exec('rollback');
    for(let i=1;i<=2;i++)await receive(randomUUID(),briefSnapshot(briefSchema.parse({...valid(),preferences:'Different request '+i})));
    await assert.rejects(receive(randomUUID(),briefSnapshot(briefSchema.parse({...valid(),preferences:'Fourth request'}))),/wait before/);
    assert.equal((await db.query('select id from public.holiday_offers where id=$1',[offer.id])).rows.length,1);
    await db.query('update auth.users set banned_until=now()+interval \'1 day\' where id=$1',[admin]);
    assert.equal((await run('authenticated',admin,'select * from public.bespoke_enquiries')).rows.length,0);
  }finally{await db.close();}
});

test('bespoke activation is off by default and requires the existing mail, storage and privacy checks',()=>{
  const restore=config(),privacy=policies.privacy;
  try{
    delete process.env.BESPOKE_ENQUIRIES_ENABLED;assert.equal(bespokeEnquiryAvailability().enabled,false);
    process.env.BESPOKE_ENQUIRIES_ENABLED='true';assert.equal(bespokeEnquiryAvailability().enabled,true);
    process.env.ENQUIRY_EMAIL_TO='wrong@example.org';assert.equal(bespokeEnquiryAvailability().enabled,false);
    process.env.ENQUIRY_EMAIL_TO='jay@plannedbyjay.com';policies.privacy={...privacy,approved:false};assert.equal(bespokeEnquiryAvailability().enabled,false);
  }finally{policies.privacy=privacy;restore();}
});

test('stored bespoke briefs survive mail and receipt failures, keep original email content and retry without duplication',async()=>{
  const {db}=await offerFixture();await db.exec(await sql());
  const restore=config(),fetch=globalThis.fetch,log=console.error;
  let mailFails=true,receiptFails=false,storageFails=false,lookupFails=false,calls=0;
  const sent=new Map<string,{body:string;id:string}>(),logged:unknown[][]=[];
  console.error=(...args)=>logged.push(args);
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input));
    if(url.pathname.endsWith('/rpc/receive_bespoke_enquiry')){
      if(storageFails)return Response.json({code:'XX000'},{status:503});
      const p=JSON.parse(String(init?.body));assert.match(p.p_client_hash,/^[a-f0-9]{64}$/);
      try{return Response.json((await db.query<{id:string}>('select public.receive_bespoke_enquiry($1,$2,$3) id',[p.p_request_id,p.p_brief,p.p_client_hash])).rows[0].id);}catch(e){return Response.json({code:(e as {code:string}).code},{status:400});}
    }
    if(url.pathname.endsWith('/bespoke_enquiries')){
      const id=url.searchParams.get('id')!.replace(/^eq\./,'');
      if(init?.method==='PATCH'){
        const patch=JSON.parse(String(init.body));if(receiptFails&&patch.notification_id)return Response.json({code:'XX000'},{status:503});
        const names=Object.keys(patch);assert.ok(names.every(k=>['notification_id','notified_at','notification_attempted_at','last_notification_error'].includes(k)));
        await db.query('update public.bespoke_enquiries set '+names.map((k,i)=>k+'=$'+(i+1)).join(',')+' where id=$'+(names.length+1)+' and notification_id is null',[...Object.values(patch),id]);return new Response(null,{status:204});
      }
      if(lookupFails)return Response.json({code:'XX000'},{status:503});
      return Response.json((await db.query('select * from public.bespoke_enquiries where id=$1',[id])).rows[0]);
    }
    assert.equal(url.href,'https://api.resend.com/emails');calls++;
    if(mailFails)return Response.json({message:'Fixture failure'},{status:503});
    const key=new Headers(init?.headers).get('Idempotency-Key')!,body=String(init?.body),previous=sent.get(key);
    if(previous)assert.equal(body,previous.body);else sent.set(key,{body,id:'fixture-mail-'+sent.size});
    const message=JSON.parse(body);assert.deepEqual(message.to,['jay@plannedbyjay.com']);assert.equal(message.reply_to,valid().email);assert.match(message.subject,/^Bespoke holiday enquiry ([0-9]{6}|PBJ-[A-F0-9]{16})$/);
    for(const row of briefSnapshot(briefSchema.parse(valid())).summary)assert.ok(message.text.includes(row.label)&&message.text.includes(row.value));
    assert.match(message.text,/total for the whole party/);assert.match(message.text,/Europe\/London/);
    return Response.json({id:sent.get(key)!.id});
  };
  const input={request_id:randomUUID(),brief:valid()},request=new Request('https://plannedbyjay.com/api/enquiries');
  const complete=(value:unknown=input)=>completeBespokeEnquiry(request,value);
  const rows=async()=>(await db.query<StoredBespokeEnquiry>('select * from public.bespoke_enquiries')).rows;
  try{
    const {POST}=await import('../src/app/api/enquiries/route');
    const pendingResponse=await POST(new Request('https://plannedbyjay.com/api/enquiries',{method:'POST',headers:{Origin:'https://plannedbyjay.com','Content-Type':'application/json','X-Bespoke-Reference-Format':BESPOKE_REFERENCE_FORMAT},body:JSON.stringify(input)}));
    assert.equal(pendingResponse.status,202);const originalReceipt=await pendingResponse.json();assert.equal(originalReceipt.accepted,true);
    const results=await Promise.all([complete(),complete()]);assert.ok(results.every(r=>r.accepted&&r.notification==='pending'));assert.equal((await rows()).length,1);assert.equal((await rows())[0].last_notification_error,'HTTP_503');
    mailFails=false;receiptFails=true;assert.equal((await complete()).notification,'pending');assert.equal(sent.size,1);
    await db.exec(await referenceSql());
    const migrated=(await rows())[0];assert.ok(isBespokeReference(migrated.reference));assert.equal(migrated.issued_reference,originalReceipt.reference);
    receiptFails=false;const retried=await complete();assert.equal(retried.notification,'accepted');assert.equal(retried.reference,originalReceipt.reference);assert.equal(sent.size,1,'migration preserves the original idempotency key AND exact email payload');
    const acceptedResponse=await POST(new Request('https://plannedbyjay.com/api/enquiries',{method:'POST',headers:{Origin:'https://plannedbyjay.com','Content-Type':'application/json','X-Bespoke-Reference-Format':BESPOKE_REFERENCE_FORMAT},body:JSON.stringify(input)}));assert.equal(acceptedResponse.status,200);
    const before=calls;await complete({...input,request_id:randomUUID()});assert.equal(calls,before);assert.equal((await rows()).length,1);
    storageFails=true;await assert.rejects(complete(),/could not be received/);assert.equal(calls,before);storageFails=false;
    lookupFails=true;await assert.rejects(complete(),/was saved.*Retry/);lookupFails=false;
    await assert.rejects(complete({...input,website:'spam'}));assert.equal(calls,before);
    const saved=(await rows())[0],older={...saved,notification_id:null,created_at:new Date(Date.now()-25*3600000).toISOString()};
    await assert.rejects(notifyBespokeEnquiry(bespokeServiceClient(),older),/Check Resend/);
    // Historical labels/option values survive later website changes and are mailed verbatim.
    const historical={...saved,notification_id:null,brief:{...saved.brief,answers:{...saved.brief.answers,holidayType:'retired-option'}}};
    await notifyBespokeEnquiry(bespokeServiceClient(),historical);
    const fresh=(await db.query<{id:string}>('select public.receive_bespoke_enquiry($1,$2,$3) id',[randomUUID(),briefSnapshot(briefSchema.parse(valid())),'c'.repeat(64)])).rows[0].id;
    const numeric=await loadBespokeEnquiry(bespokeServiceClient(),fresh);assert.ok(isBespokeReference(numeric.reference));assert.equal(numeric.issued_reference,null);
    await notifyBespokeEnquiry(bespokeServiceClient(),numeric);
    const numericMail=JSON.parse(sent.get('bespoke-enquiry/'+fresh)!.body);assert.equal(numericMail.subject,'Bespoke holiday enquiry '+numeric.reference);assert.ok(numericMail.text.includes('Enquiry reference: '+numeric.reference));
    assert.doesNotMatch(JSON.stringify(logged),/fixture@example.org|01234567890|fixture-key|quieter pool/);
  }finally{globalThis.fetch=fetch;console.error=log;restore();await db.close();}
});

test('bespoke endpoint rejects disabled, cross-origin and invalid submissions before touching storage',async()=>{
  const restore=config(),fetch=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;throw Error('No network expected');};
  try{
    const {POST}=await import('../src/app/api/enquiries/route');
    const request=(origin='https://plannedbyjay.com',body:unknown={})=>new Request('https://plannedbyjay.com/api/enquiries',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Bespoke-Reference-Format':BESPOKE_REFERENCE_FORMAT},body:JSON.stringify(body)});
    delete process.env.BESPOKE_ENQUIRIES_ENABLED;const disabled=request();disabled.text=async()=>{throw Error('Must not read disabled submissions');};assert.equal((await POST(disabled)).status,503);
    process.env.BESPOKE_ENQUIRIES_ENABLED='true';assert.equal((await POST(request('https://other.example'))).status,403);
    const oldTab=request('https://plannedbyjay.com',{request_id:randomUUID(),brief:valid()});oldTab.headers.delete('X-Bespoke-Reference-Format');oldTab.text=async()=>{throw Error('Old tabs must be rejected before reading/saving data');};assert.equal((await POST(oldTab)).status,409);
    const invalid=await POST(request('https://plannedbyjay.com',{request_id:randomUUID(),brief:{...valid(),email:'invalid'}}));assert.equal(invalid.status,400);assert.ok((await invalid.json()).errors.email);
    assert.equal(calls,0);
  }finally{globalThis.fetch=fetch;restore();}
});

test('corrective migration preserves issued aliases, notification history, security and offer data and is re-runnable',async()=>{
  const {db,sample,save}=await offerFixture();await db.exec(await sql());const offer=await save(sample);
  const snapshot=briefSnapshot(briefSchema.parse(valid()));
  try{
    for(let i=0;i<3;i++)await db.query('select public.receive_bespoke_enquiry($1,$2,$3)',[randomUUID(),snapshot,String(i).repeat(64)]);
    const first=(await db.query<{id:string}>('select id from public.bespoke_enquiries order by id')).rows[0].id;
    await db.query("update public.bespoke_enquiries set notification_id='saved-receipt',notified_at=now(),notification_attempted_at=now(),last_notification_error=null where id=$1",[first]);
    const before=(await db.query<Record<string,unknown>>('select * from public.bespoke_enquiries order by id')).rows;
    const acl=async()=>(await db.query("select relacl::text as acl from pg_class where oid='public.bespoke_enquiries'::regclass")).rows;
    const grants=async()=>(await db.query("select proacl::text as acl from pg_proc where oid='public.receive_bespoke_enquiry(uuid,jsonb,text)'::regprocedure")).rows;
    const beforeAcl=await acl(),beforeGrants=await grants();
    const offerBefore=(await db.query('select to_jsonb(o) row from public.holiday_offers o where id=$1',[offer.id])).rows;
    await db.exec(await referenceSql());
    const after=(await db.query<Record<string,unknown>>('select * from public.bespoke_enquiries order by id')).rows;
    for(let i=0;i<after.length;i++){
      const {reference,issued_reference,...other}=after[i],{reference:old,...unchanged}=before[i];
      assert.ok(isBespokeReference(reference));assert.equal(issued_reference,old);assert.deepEqual(other,unchanged);
      assert.equal(customerEnquiryReference(after[i] as unknown as StoredBespokeEnquiry),old);
    }
    assert.equal(new Set(after.map(r=>r.reference)).size,after.length);
    assert.deepEqual(await acl(),beforeAcl);assert.deepEqual(await grants(),beforeGrants);
    assert.deepEqual((await db.query('select to_jsonb(o) row from public.holiday_offers o where id=$1',[offer.id])).rows,offerBefore);
    await assert.rejects(db.query("update public.bespoke_enquiries set reference='999999' where id=$1",[first]),/permanent/);
    await assert.rejects(db.query('update public.bespoke_enquiries set issued_reference=null where id=$1',[first]),/permanent/);
    await db.exec('begin;set local role service_role');
    await db.query("update public.bespoke_enquiries set last_notification_error='HTTP_503' where id=$1",[first]);await db.exec('commit');
    const beforeRerun=(await db.query('select * from public.bespoke_enquiries order by id')).rows;await db.exec(await referenceSql());
    assert.deepEqual((await db.query('select * from public.bespoke_enquiries order by id')).rows,beforeRerun);
  }finally{await db.close();}
});

test('database candidate generation produces six digit strings and uniqueness collisions retry at most 64 times',async()=>{
  const {db}=await offerFixture();await db.exec(await sql());await db.exec(await referenceSql());
  const snapshot=briefSnapshot(briefSchema.parse(valid()));
  const receive=async(index:number)=>(await db.query<{id:string}>('select public.receive_bespoke_enquiry($1,$2,$3) id',[randomUUID(),{...snapshot,answers:{...snapshot.answers,preferences:'Request '+index}},index.toString(16).padStart(64,'0')])).rows[0].id;
  try{
    const draws=(await db.query<{value:string}>('select public.bespoke_reference_candidate() value from generate_series(1,128)')).rows;
    assert.ok(draws.every(r=>isBespokeReference(r.value)));assert.ok(new Set(draws.map(r=>r.value)).size>1);
    await db.exec("create or replace function public.bespoke_reference_candidate() returns text language sql volatile set search_path='' as $$select '000007'::text$$");
    const first=await receive(1);assert.equal((await db.query<{reference:string}>('select reference from public.bespoke_enquiries where id=$1',[first])).rows[0].reference,'000007');
    await db.exec("create sequence public.reference_test_draws;create or replace function public.bespoke_reference_candidate() returns text language plpgsql volatile set search_path='' as $$begin if nextval('public.reference_test_draws')<=2 then return '000007';end if;return '000008';end;$$");
    const second=await receive(2);assert.equal((await db.query<{reference:string}>('select reference from public.bespoke_enquiries where id=$1',[second])).rows[0].reference,'000008');
    assert.equal((await db.query<{n:number}>('select last_value::int n from public.reference_test_draws')).rows[0].n,3);
    await db.exec("select setval('public.reference_test_draws',1,false);create or replace function public.bespoke_reference_candidate() returns text language plpgsql volatile set search_path='' as $$begin perform nextval('public.reference_test_draws');return '000007';end;$$");
    await assert.rejects(receive(3),e=>(e as {code:string}).code==='55000'&&/64 attempts/.test(String(e)));
    assert.equal((await db.query<{n:number}>('select last_value::int n from public.reference_test_draws')).rows[0].n,64);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from public.bespoke_enquiries')).rows[0].n,2);
    assert.ok(isBespokeReference('000000'));assert.ok(isBespokeReference('999999'));for(const invalid of ['12345','1234567',123456,'PBJ-0123456789ABCDEF','１２３４５６'])assert.equal(isBespokeReference(invalid),false);
    assert.throws(()=>customerEnquiryReference({reference:'000007'}),/mapping is temporarily unavailable/);
    assert.equal(customerEnquiryReference({reference:'000007',issued_reference:null}),'000007');
  }finally{await db.close();}
});
