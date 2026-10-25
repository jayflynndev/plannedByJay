import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createClient} from '@supabase/supabase-js';
import {emptyOffer,prepareOffer,supplierInput,publicationIssues,disclosureIssues,isCurrentOffer,partyTotal,duplicateOffer,type OfferInput} from '../src/lib/offers/schema';
import {loadOffers} from '../src/lib/offers/data';
import {offersQuery} from '../src/lib/offers/query';
import {durationBetween,localInstant,localDateTime} from '../src/lib/offers/editor';
function complete(supplier:string=randomUUID(),media:string=randomUUID()):OfferInput{return prepareOffer({...emptyOffer(),title:'Synthetic holiday',slug:'synthetic-holiday',supplier_id:supplier,holiday_types:['family'],price_minor:99900,featured_media_id:media,featured_alt:'Synthetic coastline',details:{...emptyOffer().details,country:'Spain',description:'Synthetic holiday description',travel_type:'hotel-only',flight_inclusive:'no',adults:'2',children:'0',departure_date:new Date(Date.now()+60*86400000).toISOString().slice(0,10),nights:7,inclusions:'Accommodation',price_checked_at:new Date(Date.now()-20*86400000).toISOString()}},'published');}

test('simple validation uses factual details and actual deadlines, not approval questionnaires or seven-day expiry',()=>{
 const o=complete();assert.deepEqual(publicationIssues(o),[]);assert.equal(o.price_people,2);assert.equal(partyTotal(o),'\u00a31,998.00');assert.equal(isCurrentOffer({...o,expires_at:'2000-01-01T00:00:00Z'}),true);
 const s={...supplierInput.parse({name:'Synthetic',disclosures:{legal_name:'Synthetic company',business_address:'Synthetic address',public_contact:'public@example.com'}}),id:o.supplier_id!,revision:1};assert.deepEqual(disclosureIssues(o,s),[]);assert.ok(disclosureIssues(o,{...s,archived:true}).length);assert.ok(disclosureIssues(o,{...s,restricted:true}).length);
 const flight={...o,details:{...o.details,travel_type:'package' as const,flight_inclusive:'yes' as const,atol_status:'applicable' as const,departure_point:'Manchester'}};assert.ok(disclosureIssues(flight,s).length);
 const checked={...s,atol_verified:true,disclosures:{...s.disclosures,atol_holder:'Synthetic holder',atol_number:'1234',protection_information:'Synthetic approved wording'}};assert.deepEqual(disclosureIssues(flight,checked),[]);assert.ok(disclosureIssues(flight,{...checked,atol_verified:false}).length);
 assert.equal(isCurrentOffer({...o,details:{...o.details,promotion_expires_at:'2000-01-01T00:00:00Z'}}),false);assert.ok(publicationIssues({...o,details:{...o.details,promotion_expires_at:'2000-01-01T00:00:00Z'}}).length);
 assert.equal(supplierInput.safeParse({name:'Hotel supplier'}).success,true);assert.equal(supplierInput.safeParse({name:'Bad',disclosures:{booking_conditions_url:'javascript:alert(1)'}}).success,false);
 const copied=duplicateOffer({...o,id:randomUUID(),revision:4,details:{...o.details,promotion_expires_at:'2030-01-01T12:00:00Z'}});assert.equal(copied.id,null);assert.equal(copied.details.promotion_expires_at,'2030-01-01T12:00:00Z');assert.equal(durationBetween('2030-03-30','2030-04-02'),3);assert.equal(localDateTime(localInstant('2030-07-10T14:45')),'2030-07-10T14:45');
});

for(const prior29 of [false,true])test(`consolidated migration after ${prior29?'20261029':'20261028'} preserves research/snapshots and enforces only substantive publication/security checks`,async()=>{
 const db=new PGlite(),admin=randomUUID(),ordinary=randomUUID();
 const as=async<T>(role:string,user:string,sql:string,args:unknown[]=[])=>{await db.exec('begin');try{await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const result=await db.query<T>(sql,args);await db.exec('commit');return result;}catch(e){await db.exec('rollback');throw e;}};
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth to anon,authenticated;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 await db.query('insert into auth.users values($1),($2)',[admin,ordinary]);
 for(const f of ['20261012_holiday_enquiries.sql','20261013_friendly_enquiry_references.sql','20261014_editorial_cms.sql','20261023_article_discovery.sql','20261024_inline_classification.sql','20261022_safe_enquiry_erasure.sql','20261025_curated_holiday_offers.sql','20261026_offer_enquiry_snapshots.sql','20261027_supplier_offer_disclosures.sql','20261028_supplier_lookup.sql'])await db.exec(await readFile(`supabase/migrations/${f}`,'utf8'));
 await db.query('insert into cms_private.administrators(user_id) values($1)',[admin]);
 // Only an in-memory fixture opens this gate; never a hosted project.
 await db.exec("update cms_private.offer_launch set enabled=true,approved_by='Synthetic fixture owner',approved_at=now()");
 const legacy=randomUUID(),media=randomUUID();
 await db.query('insert into public.content_media values($1,$2,$3,$4,1200,800,1000,now())',[media,`${media}.webp`,'Synthetic image','a'.repeat(64)]);
 await db.query('insert into public.holiday_offer_suppliers(id,display_name,disclosures) values($1,$2,$3)',[legacy,'Legacy operator',{legal_name:'Legacy legal operator',business_address:'Public address',public_contact:'public@example.com'}]);
 await db.query(`insert into cms_private.offer_supplier_information(supplier_id,name,permission,permission_date,usage_notes,network_confirmed,permission_basis,disclosures_verified_at,disclosure_evidence,account_reference,lookup_record)
 values($1,'Legacy operator','approved',current_date,'PRIVATE DALE EVIDENCE',true,'new-travel-network',current_date,'PRIVATE SOURCE','PRIVATE ACCOUNT',$2)`,[legacy,{facts:[],company_number:'01234567'}]);
 const legacyOffer={...complete(legacy,media),expires_at:new Date(Date.now()+86400000).toISOString(),details:{...complete(legacy,media).details,summary:'Synthetic summary',board_basis:'Synthetic fare',occupancy:'Two adults',exclusions:'None after check',unavoidable_charges:'Included',classification_reason:'Verified non-flight',full_price_confirmed:'confirmed',promotion_conditions:'None after check',booking_conditions:'Synthetic terms',price_checked_at:new Date(Date.now()-60000).toISOString(),last_verified_at:new Date(Date.now()-60000).toISOString()}};
 const oldSave=async(data:unknown)=>(await as<{o:Record<string,unknown>}>('authenticated',admin,'select public.cms_save_holiday_offer($1,$2) o',[data,{notes:'PRIVATE OFFER'}])).rows[0].o;
 const visible=await oldSave(legacyOffer),hidden=await oldSave({...legacyOffer,slug:'hidden-legacy'});
 await db.query("update public.holiday_offers set expires_at=now()-interval '1 day' where id=$1",[hidden.id]);
 const eid=randomUUID();await as('service_role','','select public.receive_holiday_offer_enquiry($1,$2,now(),$3,$4,$5,$6,$7,$8,$9)',[eid,'PBJ-654321',{name:'Synthetic customer'},{text:'Immutable email',html:'<body>Immutable email</body>'},'fingerprint','session','email',visible.reference,visible.updated_at]);
 const enquiryBefore=(await db.query('select * from public.holiday_enquiries')).rows;
 // All 76 actual imported names/research are exercised locally, not written to hosted data.
 const historical=await readFile('data/preferred-suppliers/import.sql','utf8');await db.exec(historical.replace('values (false); -- THE ONLY APPLY SWITCH','values (true); -- THE ONLY APPLY SWITCH'));
 const suppliersBefore=(await db.query('select * from public.holiday_offer_suppliers order by id')).rows;
 const privateBefore=(await db.query('select supplier_id,name,lookup_record,usage_notes,account_reference from cms_private.offer_supplier_information order by supplier_id')).rows;
 const offersBefore=(await db.query('select * from public.holiday_offers order by id')).rows;
 if(prior29)await db.exec(await readFile('supabase/migrations/20261029_simpler_offer_publication.sql','utf8'));
 await db.exec(await readFile('supabase/migrations/20261030_simple_supplier_offer_workflow.sql','utf8'));
 assert.deepEqual((await db.query('select * from public.holiday_offer_suppliers order by id')).rows,suppliersBefore);
 assert.deepEqual((await db.query('select supplier_id,name,lookup_record,usage_notes,account_reference from cms_private.offer_supplier_information order by supplier_id')).rows,privateBefore);
 assert.deepEqual((await db.query('select * from public.holiday_offers order by id')).rows,offersBefore);
 assert.deepEqual((await db.query('select * from public.holiday_enquiries')).rows,enquiryBefore);
 const beforePublic=(await as<{id:string}>('anon','','select id from public.holiday_offers')).rows;assert.equal(beforePublic.length,1);assert.equal(beforePublic[0].id,visible.id);
 const listed=(await as<{s:Record<string,unknown>}>('authenticated',admin,'select public.cms_offer_suppliers() s')).rows;
 assert.equal(listed.length,77);assert.equal(listed.filter(r=>!r.s.archived).length,77);assert.equal(listed.some(r=>'permission' in r.s||'lookup_record' in r.s||'account_reference' in r.s),false);
 const saveSupplier=async(data:unknown)=>(await as<{s:Record<string,unknown>}>('authenticated',admin,'select public.cms_save_offer_supplier($1) s',[data])).rows[0].s;
 const s=await saveSupplier(supplierInput.parse({name:'New simple supplier',disclosures:{legal_name:'New company',business_address:'Public business address',public_contact:'public@example.com',booking_conditions_url:'https://example.com/terms'}}));
 assert.equal(s.display_name,'New simple supplier');assert.equal(s.atol_verified,false);
 await assert.rejects(saveSupplier(supplierInput.parse({name:' new SIMPLE supplier '})),/unique constraint/);
 await assert.rejects(as('authenticated',ordinary,'select public.cms_save_offer_supplier($1)',[supplierInput.parse({name:'Not authorised'})]),/Administrator/);
 const save=async(data:unknown)=>(await as<{o:Record<string,unknown>}>('authenticated',admin,'select public.cms_save_holiday_offer($1,$2) o',[data,{agent_reference:'PRIVATE REF',notes:'PRIVATE NOTES'}])).rows[0].o;
 const offer={...complete(String(s.id),media),slug:'new-simple-holiday'};const draft=await save({...offer,status:'draft',price_minor:null,details:{...emptyOffer().details}});assert.equal(draft.status,'draft');assert.equal((await as('anon','','select id from public.holiday_offers where id=$1',[draft.id])).rows.length,0);
 let published=await save({...offer,id:draft.id,revision:draft.revision});assert.equal((await as('anon','','select id from public.holiday_offers where id=$1',[published.id])).rows.length,1);
 assert.ok(new Date(String((published.details as {price_checked_at:string}).price_checked_at)).getTime()<Date.now()-7*86400000); // old price dates are disclosed, not a hard expiry
 await assert.rejects(save({...offer,id:published.id,revision:0}),/changed elsewhere/);
 for(const d of [{...offer.details,adults:'1'},{...offer.details,promotion_expires_at:'2000-01-01T00:00:00Z'},{...offer.details,price_checked_at:''},{...offer.details,flight_inclusive:'yes',atol_status:'applicable',travel_type:'package',departure_point:'Manchester'}])await assert.rejects(save({...offer,id:published.id,revision:published.revision,details:d}),/Complete/);
 await assert.rejects(save({...offer,id:published.id,revision:published.revision,price_minor:0}),/check constraint/);
 await assert.rejects(as('authenticated',ordinary,'select public.cms_save_holiday_offer($1,$2)',[offer,{}]),/Administrator/);
 await assert.rejects(as('anon','','select * from cms_private.offer_information'),/permission denied/);
 await assert.rejects(as('authenticated',ordinary,'update public.holiday_offers set price_minor=1'),/permission denied/);
 const freshId=randomUUID();const receipt=(await as<{r:{outcome:string;reference:string}}>('service_role','','select public.receive_holiday_offer_enquiry($1,$2,now(),$3,$4,$5,$6,$7,$8,$9) r',[freshId,'PBJ-654322',{name:'Synthetic fresh enquiry'},{text:'New immutable message',html:'<body>New immutable message</body>'},'fresh-fp','fresh-session','fresh-email',published.reference,published.updated_at])).rows[0].r;
 assert.equal(receipt.outcome,'received');
 const freshSnapshot=(await db.query<{offer_context:{supplier_disclosures:{booking_conditions_url:string}}}>('select offer_context from public.holiday_enquiries where id=$1',[freshId])).rows[0];assert.equal(freshSnapshot.offer_context.supplier_disclosures.booking_conditions_url,'https://example.com/terms');
 const checked=await saveSupplier({...s,atol_verified:true,disclosures:{...(s.disclosures as object),atol_holder:'Checked synthetic holder',atol_number:'1234',protection_information:'Synthetic approved protection wording'}});
 const flight=await save({...offer,id:null,revision:0,slug:'checked-flight',details:{...offer.details,travel_type:'package',flight_inclusive:'yes',atol_status:'applicable',departure_point:'Manchester'}});assert.ok(flight.id);
 const archived=await saveSupplier({...checked,archived:true});assert.equal((await as('anon','','select id from public.holiday_offers where supplier_id=$1',[s.id])).rows.length,0);
 await saveSupplier({...archived,archived:false,restricted:true});assert.equal((await as('anon','','select id from public.holiday_offers where supplier_id=$1',[s.id])).rows.length,0);
 // Explicit publish clears only this legacy hold; no migration-triggered publication.
 published=await save({...legacyOffer,id:hidden.id,revision:hidden.revision,slug:'hidden-legacy'});assert.equal((await as('anon','','select id from public.holiday_offers where id=$1',[published.id])).rows.length,1);
 assert.deepEqual((await db.query('select * from public.holiday_enquiries where id=$1',[eid])).rows,enquiryBefore);
 assert.deepEqual((await db.query('select offer_context from public.holiday_enquiries where id=$1',[freshId])).rows[0],freshSnapshot);
 await db.exec('update cms_private.offer_launch set enabled=false');await assert.rejects(save({...legacyOffer,id:null,slug:'closed-gate'}),/Publication unavailable/);
 await assert.rejects(as('authenticated',admin,'select public.cms_save_holiday_offer_record($1,$2)',[offer,{}]),/permission denied/);
 }finally{await db.close();}
});

test('public placements use the existing featured/category query and never filter by legacy seven-day expiry or select private data',async()=>{
 const urls:URL[]=[];const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false},global:{fetch:async input=>{urls.push(new URL(String(input)));return Response.json([],{headers:{'Content-Range':'0-0/0'}});}}});
 await loadOffers(offersQuery.parse({type:'family'}),{featured:true},client);assert.equal(urls[0].searchParams.get('featured'),'eq.true');assert.equal(urls[0].searchParams.get('holiday_types'),'cs.{family}');assert.equal(urls[0].searchParams.has('expires_at'),false);assert.doesNotMatch(urls[0].searchParams.get('select')||'',/notes|agent|private/);
});
