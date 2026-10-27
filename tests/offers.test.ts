import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { offerFixture,offerSql,offerReferencesSql } from "./helpers/offer-fixture";
import { prepareOffer } from "../src/lib/offers/validation";
import { emptyOffer,averagePrice,displayedSash,offerQuery } from "../src/lib/offers/schema";
import { offerEnquiryAvailability,completeOfferEnquiry,notificationNeedsReview,notifyOfferEnquiry,offerEnquiryServiceClient,storeOfferEnquiry,requireEnquiryAdmin,type StoredOfferEnquiry } from "../src/lib/offers/enquiries";
import { duplicateInput,offerRecord } from "../src/lib/offers/data";
import { sendOfferNotification } from "../src/lib/offers/notifications";
import { cardBenefit,cardReason,inclusionItems } from "../src/lib/offers/presentation";
import { policies } from "../src/content/policies";

test('verified enquiry delivery still requires storage, mail configuration and published privacy',()=>{
  const keys=['SUPABASE_URL','SUPABASE_SECRET_KEY','RESEND_API_KEY','ENQUIRY_EMAIL_FROM','ENQUIRY_EMAIL_TO'],old=keys.map(k=>process.env[k]),privacy=policies.privacy;
  Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fixture',RESEND_API_KEY:'fixture-key',ENQUIRY_EMAIL_FROM:'Fixture <sender@example.org>',ENQUIRY_EMAIL_TO:'jay@plannedbyjay.com'});
  try{
    assert.equal(offerEnquiryAvailability().enabled,true);
    for(const key of keys){
      const configured=process.env[key];delete process.env[key];
      assert.equal(offerEnquiryAvailability().enabled,false,`${key} is required`);
      process.env[key]=configured;
    }
    process.env.ENQUIRY_EMAIL_TO='wrong@example.org';assert.equal(offerEnquiryAvailability().enabled,false);
    process.env.ENQUIRY_EMAIL_TO='jay@plannedbyjay.com';
    policies.privacy={...privacy,approved:false};assert.equal(offerEnquiryAvailability().enabled,false);
  }finally{policies.privacy=privacy;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});
test("offers migrations support private drafts, atomic multi-type saves, stable URLs, eligibility and private enquiry snapshots",async()=>{
  const {db,admin,other,run,sample,save,supplierId,dates}=await offerFixture();
  const publicList=async(params:unknown[]=[]) => (await db.query<{result:{offers:Record<string,unknown>[];total:number}}>("select public.public_holiday_offers() result",params)).rows[0].result;
  try {
    await db.exec(await offerSql());
    const draft=await save();assert.equal(draft.status,"draft");
    assert.equal((await run("anon","","select * from public.holiday_offers")).rows.length,0);
    assert.equal((await publicList()).total,0);
    await assert.rejects(run("authenticated",other,"select public.save_holiday_offer($1,$2)",[sample,[]]),/Administrator/);
    const published=await save({...sample,id:String(draft.id),version:Number(draft.version),status:"published",featured:true});
    assert.ok(published.published_at);assert.equal((await publicList()).total,1);
    const types=await run("anon","","select * from public.offer_holiday_types");assert.equal(types.rows.length,2);
    const raw=(await publicList()).offers[0];
    assert.equal((raw.supplier as Record<string,unknown>).name,"Jet2holidays");assert.equal((raw.supplier as Record<string,unknown>).atol_number,"");
    await assert.rejects(run("anon","","select * from public.suppliers"),/permission denied/);
    for(const type of sample.holiday_type_ids){const r=await db.query<{r:{total:number}}>("select public.public_holiday_offers(p_type:=$1) r",[type]);assert.equal(r.rows[0].r.total,1);}
    await assert.rejects(save({...sample,id:String(published.id),version:Number(draft.version),status:"draft"}),/changed elsewhere/);
    await assert.rejects(run("authenticated",admin,"update public.holiday_offers set slug='changed' where id=$1",[published.id]),/permanent/);
    await assert.rejects(run("authenticated",admin,"delete from public.holiday_offers where id=$1",[published.id]),/permission denied/);
    assert.equal((await db.query<{r:{total:number}}>("select public.public_holiday_offers(p_featured:=true) r")).rows[0].r.total,1);
    await run("authenticated",admin,"update public.holiday_offers set featured=false where id=$1",[published.id]);
    assert.equal((await db.query<{r:{total:number}}>("select public.public_holiday_offers(p_featured:=true) r")).rows[0].r.total,0);
    const request=randomUUID(),hash="a".repeat(64);
    await assert.rejects(run("anon","","select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7)",[request,published.id,"Fixture customer","customer@example.org","","A fixture question",hash]),/permission denied/);
    const send=(token:string)=>db.query<{id:string}>("select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7) id",[token,published.id,"Fixture customer","customer@example.org","","A fixture question",hash]);
    const enquiry=(await send(request)).rows[0].id;assert.equal((await send(request)).rows[0].id,enquiry);
    await run("authenticated",admin,"update public.holiday_offers set title='A later correction',total_price_minor=260000 where id=$1",[published.id]);
    const snapshot=(await db.query<{offer_snapshot:{title:string;total_price_minor:number;supplier:{name:string};adults:number}}>("select offer_snapshot from public.offer_enquiries where id=$1",[enquiry])).rows[0].offer_snapshot;
    assert.equal(snapshot.title,sample.title);assert.equal(snapshot.total_price_minor,240000);assert.equal(snapshot.supplier.name,"Jet2holidays");assert.equal(snapshot.adults,2);
    await assert.rejects(run("anon","","select * from public.offer_enquiries"),/permission denied/);
    assert.equal((await run("authenticated",other,"select * from public.offer_enquiries")).rows.length,0);
    assert.equal((await run("authenticated",admin,"select * from public.offer_enquiries")).rows.length,1);
    await send(randomUUID());await send(randomUUID());await assert.rejects(send(randomUUID()),/wait/);
    await run("authenticated",admin,"update public.suppliers set archived=true where id=$1",[supplierId]);assert.equal((await publicList()).total,0);
    await run("authenticated",admin,"update public.suppliers set archived=false where id=$1",[supplierId]);
    await run("authenticated",admin,"update public.holiday_offers set archived=true where id=$1",[published.id]);assert.equal((await publicList()).total,0);
    await run("authenticated",admin,"update public.holiday_offers set archived=false,status='draft' where id=$1",[published.id]);assert.equal((await publicList()).total,0);
    const future=await save({...sample,slug:"expired-fixture",booking_deadline:dates.today,status:"published"});
    // Use a fixture-only clock-independent row update after disabling this fixture's trigger.
    await db.exec("alter table public.holiday_offers disable trigger holiday_offer_dates");
    await db.query("update public.holiday_offers set booking_deadline='2000-01-01' where id=$1",[future.id]);
    assert.equal((await publicList()).total,0);
    assert.equal((await db.query<{count:number}>("select count(*)::int count from public.holiday_types")).rows[0].count,6);
  }finally{await db.close();}
});

test('durable enquiries survive mail/receipt failures and retries accept only one notification',async()=>{
  const {db,sample,save}=await offerFixture();
  const published=await save({...sample,status:'published'});
  const keys=['SUPABASE_URL','SUPABASE_SECRET_KEY','RESEND_API_KEY','ENQUIRY_EMAIL_FROM','ENQUIRY_EMAIL_TO'],old=keys.map(k=>process.env[k]);
  const originalFetch=globalThis.fetch,originalError=console.error;
  Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fixture',RESEND_API_KEY:'fixture-key',ENQUIRY_EMAIL_FROM:'Fixture <sender@example.org>',ENQUIRY_EMAIL_TO:'jay@plannedbyjay.com'});
  let mailFails=true,receiptFails=false,storageFails=false,lookupFails=false,mailCalls=0,rpcCalls=0;
  const sent=new Map<string,{id:string;body:string}>(),logged:unknown[][]=[];
  console.error=(...args)=>{logged.push(args);};
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input));
    if(url.pathname.endsWith('/rpc/receive_offer_enquiry')){
      rpcCalls++;if(storageFails)return Response.json({code:'XX000',message:'Fixture database failure'},{status:503});
      const p=JSON.parse(String(init?.body));
      try {const result=await db.query<{id:string}>('select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7) id',[p.p_request_id,p.p_offer_id,p.p_name,p.p_email,p.p_phone,p.p_message,p.p_client_hash]);return Response.json(result.rows[0].id);}
      catch(error){return Response.json({code:(error as {code:string}).code,message:'Fixture SQL rejection'},{status:400});}
    }
    if(url.pathname.endsWith('/offer_enquiries')){
      const id=url.searchParams.get('id')!.replace(/^eq\./,'');
      if(init?.method==='PATCH'){
        if(receiptFails)return Response.json({code:'XX000',message:'Fixture receipt failure'},{status:503});
        const update=JSON.parse(String(init.body));assert.deepEqual(Object.keys(update).sort(),['notification_id','notified_at']);
        await db.query('update public.offer_enquiries set notification_id=$1,notified_at=$2 where id=$3 and notification_id is null',[update.notification_id,update.notified_at,id]);return new Response(null,{status:204});
      }
      if(lookupFails)return Response.json({code:'XX000',message:'Fixture read failure'},{status:503});
      const result=await db.query<{row:StoredOfferEnquiry}>("select to_jsonb(e)||jsonb_build_object('offer',jsonb_build_object('reference',o.reference)) row from public.offer_enquiries e join public.holiday_offers o on o.id=e.offer_id where e.id=$1",[id]);return Response.json(result.rows[0].row);
    }
    assert.equal(url.href,'https://api.resend.com/emails');mailCalls++;
    if(mailFails)return Response.json({message:'Fixture temporary mail failure'},{status:503});
    const key=new Headers(init?.headers).get('Idempotency-Key')!,body=String(init?.body),prior=sent.get(key);
    if(prior)assert.equal(body,prior.body,'the retry payload, including submission time, is unchanged');
    else sent.set(key,{id:'fixture-mail-'+sent.size,body});
    return Response.json({id:sent.get(key)!.id});
  };
  const input={request_id:randomUUID(),offer_id:String(published.id),name:'Fixture customer',email:'fixture@example.org',phone:'01234567890',message:'A fixture question'};
  const complete=(value:unknown=input)=>completeOfferEnquiry(new Request('https://plannedbyjay.com/api/offer-enquiries'),value);
  const rows=async()=>(await db.query<{row:StoredOfferEnquiry}>('select to_jsonb(e) row from public.offer_enquiries e order by created_at')).rows.map(r=>r.row);
  try{
    const pending=await Promise.all([complete(),complete()]);
    for(const receipt of pending)assert.deepEqual(receipt,{accepted:true,reference:published.reference,notification:'pending'});
    assert.equal((await rows()).length,1);assert.equal((await rows())[0].notification_id,null);
    mailFails=false;receiptFails=true;assert.equal((await complete()).notification,'pending');assert.equal(sent.size,1);assert.equal((await rows())[0].notification_id,null);
    receiptFails=false;assert.equal((await complete()).notification,'accepted');assert.ok((await rows())[0].notification_id);assert.equal(sent.size,1);
    const callsBefore=mailCalls;assert.equal((await complete()).notification,'accepted');assert.equal(mailCalls,callsBefore,'stored receipts prevent repeat sends');
    storageFails=true;await assert.rejects(complete({...input,request_id:randomUUID()}),/could not be received/);assert.equal(mailCalls,callsBefore);storageFails=false;
    const second={...input,request_id:randomUUID()};lookupFails=true;await assert.rejects(complete(second),/was saved.*Retry/);assert.equal((await rows()).length,2);lookupFails=false;
    assert.equal((await complete(second)).notification,'accepted');assert.equal((await rows()).length,2);
    const beforeInvalid=rpcCalls;
    for(const invalid of [{...input,name:''},{...input,email:'invalid'},{...input,website:'spam'},{...input,phone:'1'.repeat(51)},{...input,reference:'999999'}])await assert.rejects(storeOfferEnquiry(offerEnquiryServiceClient(),invalid,'fixture-address','fixture-hash-secret'),/Check your enquiry/);
    assert.equal(rpcCalls,beforeInvalid);
    assert.ok(logged.length>=3);assert.doesNotMatch(JSON.stringify(logged),/fixture@example.org|01234567890|fixture-key|A fixture question/,'failure logs contain IDs/codes only');
    const saved=(await rows())[0];assert.equal(saved.name,input.name);assert.equal(saved.offer_snapshot.reference,published.reference);assert.equal(saved.offer_snapshot.total_price_minor,240000);
  }finally{globalThis.fetch=originalFetch;console.error=originalError;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});await db.close();}
});

test('older notification retries require review, while saved receipts remain idempotent',async()=>{
  const original=globalThis.fetch,keys=['RESEND_API_KEY','ENQUIRY_EMAIL_FROM','ENQUIRY_EMAIL_TO'],old=keys.map(k=>process.env[k]);
  Object.assign(process.env,{RESEND_API_KEY:'fixture-key',ENQUIRY_EMAIL_FROM:'Fixture <sender@example.org>',ENQUIRY_EMAIL_TO:'jay@plannedbyjay.com'});
  const created_at=new Date(Date.now()-25*60*60*1000).toISOString();
  const enquiry:StoredOfferEnquiry={id:randomUUID(),name:'Fixture customer',email:'fixture@example.org',phone:'',message:'',created_at,notification_id:null,notified_at:null,offer:{reference:'000042'},offer_snapshot:{reference:'000042',title:'Stored title',currency:'GBP',total_price_minor:240600,adults:2,children:1}};
  let sends=0,marks=0;
  const client={from:()=>({update:()=>({eq:()=>({is:async()=>{marks++;return {error:null};}})})})} as unknown as import('@supabase/supabase-js').SupabaseClient;
  globalThis.fetch=async()=>{sends++;return Response.json({id:'fixture-receipt'});};
  try{
    assert.equal(notificationNeedsReview(created_at),true);assert.equal(notificationNeedsReview(new Date().toISOString()),false);
    await assert.rejects(notifyOfferEnquiry(client,enquiry),/Check Resend and the mailbox/);assert.equal(sends,0);
    await notifyOfferEnquiry(client,enquiry,true);assert.equal(sends,1);assert.equal(marks,1);
    await notifyOfferEnquiry(client,{...enquiry,notification_id:'already-saved'});assert.equal(sends,1);
  }finally{globalThis.fetch=original;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});

test('private notification retry honours the existing database administrator decision, including bans',async()=>{
  const {db,run,admin,other}=await offerFixture();
  const client=(id:string)=>({rpc:async(name:string)=>{
    assert.equal(name,'articles_is_admin');
    const result=await run<{allowed:boolean}>('authenticated',id,'select public.articles_is_admin() allowed');return {data:result.rows[0].allowed,error:null};
  }}) as unknown as import('@supabase/supabase-js').SupabaseClient;
  try{
    await requireEnquiryAdmin(client(admin));
    await assert.rejects(requireEnquiryAdmin(client(other)),/cannot retry/);
    await db.query("update auth.users set banned_until=now()+interval '1 day' where id=$1",[admin]);
    await assert.rejects(requireEnquiryAdmin(client(admin)),/cannot retry/);
    await assert.rejects(requireEnquiryAdmin({rpc:async()=>({data:null,error:{code:'fixture'}})} as unknown as import('@supabase/supabase-js').SupabaseClient),/cannot retry/);
  }finally{await db.close();}
});

test("six-digit references backfill without data loss, remain immutable, and are never reused",async()=>{
  const {db,admin,run,sample,save}=await offerFixture({references:false});
  try{
    const draft=await save(),published=await save({...sample,slug:'published-fixture',status:'published'});
    await run('authenticated',admin,'update public.holiday_offers set archived=true where id=$1',[draft.id]);
    await db.query('select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),published.id,'Fixture customer','fixture@example.org','','','b'.repeat(64)]);
    // A departed published record must be backfilled without invoking publication validation.
    await db.exec('alter table public.holiday_offers disable trigger holiday_offer_dates');
    await db.query("update public.holiday_offers set departure_date='2000-01-01',return_date='2000-01-08' where id=$1",[published.id]);
    await db.exec('alter table public.holiday_offers enable trigger holiday_offer_dates');
    const offersBefore=(await db.query("select to_jsonb(o)-'reference' as row from public.holiday_offers o order by id")).rows;
    const preserved=async()=>Promise.all(['offer_enquiries','suppliers','holiday_types','offer_holiday_types'].map(t=>db.query(`select to_jsonb(t) as row from public.${t} t order by to_jsonb(t)::text`)));
    const before=await preserved();
    await db.exec(await offerReferencesSql());
    assert.deepEqual((await db.query("select to_jsonb(o)-'reference' as row from public.holiday_offers o order by id")).rows,offersBefore);
    assert.deepEqual((await preserved()).map(r=>r.rows),before.map(r=>r.rows),'snapshots, supplier data and links are untouched');
    const references=async()=>(await db.query<{id:string;reference:string}>('select id,reference from public.holiday_offers order by id')).rows;
    const assigned=await references();assert.equal(new Set(assigned.map(o=>o.reference)).size,2);
    for(const o of assigned)assert.match(o.reference,/^0[0-9]{5}$/,'text preserves leading zeros');
    await db.exec(await offerReferencesSql());assert.deepEqual(await references(),assigned,'migration is safe to re-run');
    const ref=assigned.find(o=>o.id===draft.id)!.reference;
    await run('authenticated',admin,"update public.holiday_offers set reference='999999',archived=false,status='draft' where id=$1",[draft.id]);
    assert.equal((await references()).find(o=>o.id===draft.id)!.reference,ref);
    const original=offerRecord((await db.query<{offer:Record<string,unknown>}>("select to_jsonb(o)||jsonb_build_object('holiday_type_ids','[]'::jsonb) offer from public.holiday_offers o where id=$1",[draft.id])).rows[0].offer);
    const edited=await save({...sample,id:original.id,version:original.version,title:'A correction'});assert.equal(edited.reference,ref);
    const duplicate=await save({...sample,...duplicateInput(offerRecord({...edited,holiday_type_ids:[]}))});assert.notEqual(duplicate.reference,ref);assert.match(String(duplicate.reference),/^[0-9]{6}$/);
    const fresh=await save({...sample,slug:'new-published',status:'published'});
    const receipt=(await db.query<{id:string}>('select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7) id',[randomUUID(),fresh.id,'Fixture customer','fixture@example.org','','','c'.repeat(64)])).rows[0].id;
    const snapshot=(await db.query<{ref:string}>("select offer_snapshot->>'reference' ref from public.offer_enquiries where id=$1",[receipt])).rows[0];assert.equal(snapshot.ref,fresh.reference);
    await run('authenticated',admin,"update public.holiday_offers set status='draft',archived=true where id=$1",[fresh.id]);
    assert.equal((await references()).find(o=>o.id===fresh.id)!.reference,fresh.reference);
    await assert.rejects(run('authenticated',admin,"select nextval('public.holiday_offer_reference_seq')"),/permission denied/);
    await assert.rejects(run('anon','',"select setval('public.holiday_offer_reference_seq',1)"),/permission denied/);
    await db.query('delete from public.holiday_offers where id=$1',[duplicate.id]);
    const afterDelete=await save({...sample,slug:'after-delete'});assert.ok(Number(afterDelete.reference)>Number(duplicate.reference));
    await db.exec('begin');const rolledBack=await db.query<{reference:string}>("insert into public.holiday_offers(slug,reference) values('rolled-back','999998') returning reference");await db.exec('rollback');
    const afterRollback=await save({...sample,slug:'after-rollback'});assert.ok(Number(afterRollback.reference)>Number(rolledBack.rows[0].reference));
    // A collision cannot be forced by supplying a reference, and exhaustion cannot wrap.
    const manual=await run<{reference:string}>('authenticated',admin,"insert into public.holiday_offers(slug,reference) values('manual-reference',$1) returning reference",[ref]);assert.notEqual(manual.rows[0].reference,ref);
    await db.exec('alter table public.holiday_offers disable trigger holiday_offer_reference');
    await assert.rejects(db.query("insert into public.holiday_offers(slug,reference) values('duplicate-number',$1)",[ref]),/unique constraint/);
    await assert.rejects(db.query("insert into public.holiday_offers(slug,reference) values('invalid-number','12345')"),/check constraint/);
    await db.exec('alter table public.holiday_offers enable trigger holiday_offer_reference');
    await db.query("delete from public.holiday_offers where slug='manual-reference'");
    await db.exec(await offerReferencesSql());
    assert.ok(Number((await save({...sample,slug:'after-rerun'})).reference)>Number(manual.rows[0].reference),'re-running after deletion never reuses a number');
    await db.exec("select setval('public.holiday_offer_reference_seq',999998)");
    assert.equal((await save({...sample,slug:'last-reference'})).reference,'999999');
    await assert.rejects(save({...sample,slug:'exhausted'}),/maximum value/);
    await db.exec(await offerReferencesSql());
    await assert.rejects(save({...sample,slug:'still-exhausted'}),/maximum value/);
  }finally{await db.close();}
});

test('card highlights use only explicit unqualified saved inclusions and commentary stays concise',()=>{
  const o={...emptyOffer(),children:1};
  assert.equal(cardBenefit({...o,inclusions:'Free Child Place, 22kg baggage.'}),'Free Child Place');
  for(const text of ['No free child place','Free Child Place not included','Free Child Place, subject to availability','Selected free child places','Baggage included'])assert.equal(cardBenefit({...o,inclusions:text}),'');
  assert.equal(cardBenefit({...o,children:0,inclusions:'Free Child Place'}),'');
  assert.equal(cardReason('A short saved reason.'),'A short saved reason.');
  assert.ok(cardReason('A saved reason with many words. '.repeat(20)).length<=111);
});

test('inclusion formatting keeps clauses and numerical commas intact rather than manufacturing checklist items',()=>{
  assert.deepEqual(inclusionItems('Return flights, 22kg baggage, Coach transfers'),['Return flights','22kg baggage','Coach transfers']);
  assert.deepEqual(inclusionItems('Return flights\n22kg baggage\nCoach transfers'),['Return flights','22kg baggage','Coach transfers']);
  assert.deepEqual(inclusionItems('- Return flights\n- Transfers, subject to arrival time'),['Return flights','Transfers, subject to arrival time']);
  for(const text of ['', 'Accommodation only','Meals, including breakfast, are provided.','A £1,000 allowance, transfers','Transfers (hotel, airport), baggage','Flights included. Baggage, seats and transfers are optional.','Flights included, baggage costs extra','Breakfast and lunch, served at the hotel'])assert.equal(inclusionItems(text),null);
});
test("offer preparation calculates dates, permits incomplete drafts and controls price/claim display without blanket protection",()=>{
  assert.equal(prepareOffer({}).status,"draft");
  const o=prepareOffer({...emptyOffer(),departure_date:"2099-01-01",return_date:"2099-01-08"});assert.equal(o.nights,7);
  assert.throws(()=>prepareOffer({...emptyOffer(),status:"published"}),/Before publishing/);
  assert.equal(averagePrice({...o,total_price_minor:240000,show_per_person:true}),120000);
  assert.equal(averagePrice({...o,total_price_minor:240000,children:1,show_per_person:true}),null);
  assert.equal(displayedSash({...o,sash:"leaving-soon"},"2098-01-01"),"");
  assert.equal(displayedSash({...o,sash:"leaving-soon"},"2098-12-20"),"Leaving Soon");
  assert.equal(displayedSash({...o,sash:"adults-only"}),"");
  assert.equal(offerQuery({type:"../private",month:"2026-99",sort:"injection"}).sort,"departure");
  assert.equal(offerEnquiryAvailability().enabled,false);
  const copy=duplicateInput(offerRecord({...o,id:"60000000-0000-4000-8000-000000000001",title:"Original",slug:"original",featured:true,status:"published",price_checked_on:"2098-12-01",published_at:"2098-12-01"}));
  assert.equal(copy.id,null);assert.equal(copy.status,"draft");assert.equal(copy.featured,false);assert.equal(copy.price_checked_on,"");assert.notEqual(copy.slug,"original");
});

test("existing Resend notification uses a fixed business recipient, stored snapshot and stable idempotency key",async()=>{
  const keys=["RESEND_API_KEY","ENQUIRY_EMAIL_FROM","ENQUIRY_EMAIL_TO"],old=keys.map(k=>process.env[k]);
  Object.assign(process.env,{RESEND_API_KEY:"fixture-key",ENQUIRY_EMAIL_FROM:"Fixture sender <sender@example.org>",ENQUIRY_EMAIL_TO:"jay@plannedbyjay.com"});
  const enquiry={id:"70000000-0000-4000-8000-000000000001",name:"Fixture customer",email:"customer@example.org",phone:"",message:"A fixture question",created_at:"2026-10-27T10:30:00Z",offer_snapshot:{reference:"000042",title:"Stored title",supplier:{name:"Stored supplier"},total_price_minor:240050,currency:"GBP",adults:2,children:0}};
  let calls=0;
  const sender:typeof fetch=async(url,init)=>{calls++;assert.equal(String(url),"https://api.resend.com/emails");assert.equal(new Headers(init?.headers).get("Idempotency-Key"),"offer-enquiry/"+enquiry.id);const body=JSON.parse(String(init?.body));assert.deepEqual(body.to,["jay@plannedbyjay.com"]);assert.equal(body.reply_to,enquiry.email);assert.match(body.text,/Stored title/);assert.match(body.text,/Offer reference: 000042/);assert.equal(body.subject,'Holiday enquiry 000042');assert.match(body.text,/\u00a32,400\.50/);assert.match(body.text,/Submitted: 27 Oct 2026, 10:30 \(Europe\/London\)/);return Response.json({id:"fixture-notification"});};
  try{
    assert.equal(await sendOfferNotification(enquiry,sender),"fixture-notification");
    process.env.ENQUIRY_EMAIL_TO="wrong@example.org";
    await assert.rejects(sendOfferNotification(enquiry,sender),/unavailable/);assert.equal(calls,1);
    process.env.ENQUIRY_EMAIL_TO="jay@plannedbyjay.com";
    await assert.rejects(sendOfferNotification(enquiry,async()=>Response.json({error:"fixture"},{status:503})),/not accepted/);
  }finally{keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});

test('enquiry completion returns the saved offer reference and resolves historical snapshots without rewriting them',async()=>{
  const keys=['SUPABASE_URL','SUPABASE_SECRET_KEY','RESEND_API_KEY','ENQUIRY_EMAIL_FROM','ENQUIRY_EMAIL_TO'],old=keys.map(k=>process.env[k]),original=globalThis.fetch;
  Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fixture',RESEND_API_KEY:'fixture-key',ENQUIRY_EMAIL_FROM:'Fixture <sender@example.org>',ENQUIRY_EMAIL_TO:'jay@plannedbyjay.com'});
  const enquiryId=randomUUID(),offerId=randomUUID(),requestId=randomUUID(),created_at=new Date().toISOString();
  let legacy=false,messages=0,updates=0;
  const snapshots:Record<string,unknown>[]=[];
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input));
    if(url.pathname.endsWith('/rpc/receive_offer_enquiry')){const data=JSON.parse(String(init?.body));assert.equal(data.p_offer_id,offerId);assert.equal('reference' in data,false);return Response.json(enquiryId);}
    if(url.pathname.endsWith('/offer_enquiries')&&init?.method==='PATCH'){updates++;assert.equal(url.searchParams.get('id'),'eq.'+enquiryId);assert.equal('offer_snapshot' in JSON.parse(String(init.body)),false);return new Response(null,{status:204});}
    if(url.pathname.endsWith('/offer_enquiries')){
      assert.match(url.searchParams.get('select')||'',/holiday_offers\(reference\)/);
      const offer_snapshot={reference:legacy?'PBJ-HISTORICAL':'000042',title:'Stored title',currency:'GBP',total_price_minor:240600,adults:2,children:1};snapshots.push(offer_snapshot);
      return Response.json({id:enquiryId,name:'Fixture customer',email:'fixture@example.org',phone:'',message:'',created_at,offer_snapshot,notification_id:null,notified_at:null,offer:{reference:'000042'}});
    }
    assert.equal(url.href,'https://api.resend.com/emails');messages++;
    const body=JSON.parse(String(init?.body));assert.equal(body.subject,'Holiday enquiry 000042');assert.match(body.text,/Offer reference: 000042/);assert.doesNotMatch(body.text,/PBJ-HISTORICAL/);
    return Response.json({id:'fixture-mail'});
  };
  try{
    const input={request_id:requestId,offer_id:offerId,name:'Fixture customer',email:'fixture@example.org'};
    const complete=()=>completeOfferEnquiry(new Request('https://plannedbyjay.com/api/offer-enquiries'),input);
    assert.deepEqual(await complete(),{accepted:true,reference:'000042',notification:'accepted'});legacy=true;assert.deepEqual(await complete(),{accepted:true,reference:'000042',notification:'accepted'});
    assert.equal(messages,2);assert.equal(updates,2);assert.equal(snapshots[1].reference,'PBJ-HISTORICAL');assert.equal(offerEnquiryAvailability().enabled,true);
  }finally{globalThis.fetch=original;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});
