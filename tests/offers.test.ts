import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createClient} from '@supabase/supabase-js';
import {emptyOffer,supplierDisclosures,disclosureIssues,offerInput,supplierInput,publicationIssues,duplicateOffer,priceLabel,partyTotal,isCurrentOffer,type OfferInput} from '../src/lib/offers/schema';
import {offersQuery,offerHref} from '../src/lib/offers/query';
import {loadOffers} from '../src/lib/offers/data';
const now=new Date(Date.now()-60000).toISOString(),future=new Date(Date.now()+86400000).toISOString(),departure=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
function complete():OfferInput{return {...emptyOffer(),title:'Synthetic cruise',slug:'synthetic-cruise',supplier_id:randomUUID(),status:'published' as const,holiday_types:['cruises' as const],price_minor:123456,price_people:2,featured_media_id:randomUUID(),featured_alt:'Synthetic image',publication_approved:true,expires_at:future,details:{...emptyOffer().details,country:'Synthetic country',summary:'Synthetic description',description:'Synthetic only — not a live offer',travel_type:'cruise-only' as const,flight_inclusive:'no',atol_status:'not-applicable',classification_reason:'Verified cruise only, no flights',adults:'2',children:'0',full_price_confirmed:'confirmed',promotion_conditions:'No promotion conditions',booking_conditions:'Synthetic cancellation terms checked',departure_point:'Synthetic port',departure_date:departure,nights:7,board_basis:'Synthetic fare',occupancy:'Two sharing a cabin',inclusions:'Only the verified cabin/fare',exclusions:'Flights excluded',unavoidable_charges:'All unavoidable charges included in displayed price',price_checked_at:now,last_verified_at:now}};}
test('partial drafts, verified full-price publication, per-person/party bases, travel arrangements and duplication',()=>{
  assert.ok(offerInput.safeParse({}).success);const o=complete();assert.deepEqual(publicationIssues(o),[]);
  assert.match(priceLabel(o),/1,234.56 per person/);assert.match(priceLabel({...o,price_basis:'total-party'}),/total party/);
  assert.ok(publicationIssues({...o,price_minor:null}).length);assert.equal(offerInput.safeParse({...o,price_minor:-1}).success,false);
  assert.ok(publicationIssues({...o,details:{...o.details,departure_point:''}}).length);
  assert.deepEqual(publicationIssues({...o,details:{...o.details,travel_type:'hotel-only',departure_point:''}}),[]);
  assert.equal(isCurrentOffer({...o,expires_at:now}),false);assert.equal(isCurrentOffer({...o,details:{...o.details,promotion_expires_at:now}}),false);
  assert.equal(isCurrentOffer({...o,details:{...o.details,last_verified_at:new Date(Date.now()-8*86400000).toISOString()}}),false);
  const duplicate=duplicateOffer({...o,id:randomUUID(),revision:4});assert.equal(duplicate.id,null);assert.equal(duplicate.slug,'');assert.equal(duplicate.status,'draft');assert.equal(duplicate.expires_at,'');assert.equal(duplicate.details.price_checked_at,'');assert.equal(duplicate.publication_approved,false);assert.equal(duplicate.details.country,o.details.country);
  assert.equal(supplierInput.safeParse({name:'A',display_name:'A',permission:'approved'}).success,false);
});

test('actual offers/snapshot migrations: RLS, permissions, duplicates, visibility, expiry, private information and atomic enquiry snapshots',async()=>{
  const db=new PGlite(),admin=randomUUID(),ordinary=randomUUID();
  const as=async<T>(role:string,user:string,sql:string,args:unknown[]=[])=>{await db.exec('begin');try{await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const result=await db.query<T>(sql,args);await db.exec('commit');return result;}catch(e){await db.exec('rollback');throw e;}};
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth to anon,authenticated;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
    await db.query('insert into auth.users values($1),($2)',[admin,ordinary]);
    for(const name of ['20261012_holiday_enquiries.sql','20261013_friendly_enquiry_references.sql','20261014_editorial_cms.sql','20261023_article_discovery.sql','20261024_inline_classification.sql','20261022_safe_enquiry_erasure.sql'])await db.exec(await readFile(`supabase/migrations/${name}`,'utf8'));
    await db.query('insert into cms_private.administrators(user_id) values($1)',[admin]);
    const legacyId=randomUUID();await as('service_role','','select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7)',[legacyId,'PBJ-654321',{name:'Synthetic legacy'},{text:'Immutable legacy',html:'<body>Immutable legacy</body>'},'legacy','legacy-session','legacy-email']);
    const legacyBefore=(await db.query('select * from public.holiday_enquiries where id=$1',[legacyId])).rows[0];
    for(const name of ['20261025_curated_holiday_offers.sql','20261026_offer_enquiry_snapshots.sql'])await db.exec(await readFile(`supabase/migrations/${name}`,'utf8'));
    const oldSupplier=randomUUID(),oldOffer=randomUUID();
    await db.query("insert into public.holiday_offer_suppliers(id,display_name) values($1,'Preserved old operator')",[oldSupplier]);
    await db.query("insert into cms_private.offer_supplier_information(supplier_id,name,usage_notes) values($1,'Preserved operator','Original evidence')",[oldSupplier]);
    await db.query("insert into public.holiday_offers(id,supplier_id,title) values($1,$2,'Preserved existing draft')",[oldOffer,oldSupplier]);
    const historicContext={reference:'PBJO-1234ABCD',title:'Historic immutable offer context'};
    await db.query('update public.holiday_enquiries set offer_context=$1 where id=$2',[historicContext,legacyId]);
    const oldBefore=(await db.query('select * from public.holiday_offers where id=$1',[oldOffer])).rows[0];
    await db.exec(await readFile('supabase/migrations/20261027_supplier_offer_disclosures.sql','utf8'));
    assert.deepEqual((await db.query('select * from public.holiday_offers where id=$1',[oldOffer])).rows[0],oldBefore);
    assert.equal((await db.query<{network_confirmed:boolean}>('select network_confirmed from cms_private.offer_supplier_information where supplier_id=$1',[oldSupplier])).rows[0].network_confirmed,false);

    const legacyAfter=(await db.query<Record<string,unknown>>('select * from public.holiday_enquiries where id=$1',[legacyId])).rows[0];assert.deepEqual(legacyAfter.offer_context,historicContext);delete legacyAfter.offer_context;assert.deepEqual(legacyAfter,legacyBefore);
    const supplierSave=async(data:unknown)=>(await as<{s:Record<string,unknown>}>('authenticated',admin,'select public.cms_save_offer_supplier($1) s',[data])).rows[0].s;
    const payload=supplierInput.parse({name:'Synthetic operator',display_name:'Public synthetic operator',agent_url:'https://example.com/PRIVATE_AGENT',notes:'PRIVATE_SUPPLIER_NOTES'});
    let supplier=await supplierSave(payload);assert.equal(supplier.permission,'pending');
    await assert.rejects(supplierSave({...payload,name:' SYNTHETIC   OPERATOR '}),/unique constraint/);
    await assert.rejects(as('authenticated',ordinary,'select public.cms_save_offer_supplier($1)',[payload]),/Administrator access/);
    await assert.rejects(as('anon','','select public.cms_offer_suppliers()'),/permission denied/);
    const media=randomUUID();await db.query('insert into public.content_media values($1,$2,$3,$4,1200,800,1000,now())',[media,`${media}.webp`,'Synthetic image','a'.repeat(64)]);
    const offer=complete();offer.supplier_id=String(supplier.id);offer.featured_media_id=media;
    const save=async(data:Record<string,unknown>)=>(await as<{o:Record<string,unknown>}>('authenticated',admin,'select public.cms_save_holiday_offer($1,$2) o',[data,{agent_reference:'PRIVATE_OFFER_SOURCE',notes:'PRIVATE_OFFER_NOTES'}])).rows[0].o;
    let draft=await save({...offer,status:'draft'});assert.match(String(draft.reference),/^PBJO-[A-F0-9]{8}$/);
    assert.equal((await as<{c:{draft:number}}>('authenticated',admin,'select public.cms_holiday_offer_counts() c')).rows[0].c.draft,2);
    await assert.rejects(as('authenticated',ordinary,'select public.cms_save_holiday_offer($1,$2)',[offer,{}]),/Administrator access/);
    assert.equal((await as<{enabled:boolean}>('anon','','select public.holiday_offers_enabled() enabled')).rows[0].enabled,false);
    assert.equal((await as('anon','','select * from public.holiday_offers')).rows.length,0);
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision}),/Owner launch approval/);
    // Fixture-only activation: never executed against a hosted database.
    await assert.rejects(db.exec("update cms_private.offer_launch set enabled=true,approved_at=now()"),/check constraint/);
    await db.exec("update cms_private.offer_launch set enabled=true,approved_by='Synthetic test owner',approved_at=now()");
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision}),/supplier marketing permission/);
    supplier=await supplierSave({...payload,id:supplier.id,revision:supplier.revision,permission:'approved',permission_date:new Date().toISOString().slice(0,10),usage_notes:'General permission alone does not verify this operator'});
    const pendingOffer=(await db.query<Record<string,unknown>>('select * from public.holiday_offers where id=$1',[draft.id])).rows[0];
    await assert.rejects(save({...offer,id:pendingOffer.id,revision:pendingOffer.revision}),/supplier marketing permission/);
    supplier=await supplierSave({...payload,id:supplier.id,revision:supplier.revision,permission:'approved',network_confirmed:true,permission_basis:'new-travel-network',disclosures_verified_at:new Date().toISOString().slice(0,10),disclosure_evidence:'Synthetic official source',disclosures:supplierDisclosures.parse({legal_name:'Synthetic legal operator',business_address:'Synthetic public address',public_contact:'public@example.com'}),permission_date:new Date().toISOString().slice(0,10),usage_notes:'Synthetic permission evidence'});
    draft=(await db.query<Record<string,unknown>>('select * from public.holiday_offers where id=$1',[draft.id])).rows[0];
    for(const details of [
      {...offer.details,atol_status:'pending'}, {...offer.details,flight_inclusive:'yes',atol_status:'not-applicable'},
      {...offer.details,classification_reason:''}, {...offer.details,full_price_confirmed:'pending'},
      {...offer.details,adults:'1'}, {...offer.details,promotion_conditions:''}, {...offer.details,booking_conditions:''},
      {...offer.details,flight_inclusive:'yes',atol_status:'applicable',travel_type:'package'}
    ])await assert.rejects(save({...offer,id:draft.id,revision:draft.revision,details}),/Complete verified/);
    // Database trigger also rejects a privileged direct write; ordinary roles have no write grants.
    await assert.rejects(db.query("update public.holiday_offers set status='published',details=jsonb_set(details,'{full_price_confirmed}','\"pending\"') where id=$1",[draft.id]),/Complete verified/);
    draft=await save({...offer,id:draft.id,revision:draft.revision});
    assert.equal((await as<{c:{published:number}}>('authenticated',admin,'select public.cms_holiday_offer_counts() c')).rows[0].c.published,1);
    const publicRows=(await as('anon','','select * from public.holiday_offers')).rows;assert.equal(publicRows.length,1);assert.equal(JSON.stringify(publicRows).includes('PRIVATE'),false);
    assert.equal((await as('anon','','select id from public.content_media where id=$1',[media])).rows.length,1);
    const publicSupplier=(await as('anon','','select * from public.holiday_offer_suppliers')).rows;assert.equal(JSON.stringify(publicSupplier).includes('PRIVATE'),false);
    await assert.rejects(as('anon','','select * from cms_private.offer_information'),/permission denied/);
    await assert.rejects(as('authenticated',ordinary,"update public.holiday_offers set price_minor=1"),/permission denied/);
    await assert.rejects(save({...offer,id:draft.id,revision:0}),/changed elsewhere/);
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision,details:{...offer.details,private_agent_url:'PRIVATE'}}),/check constraint/);
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision,price_minor:0}),/check constraint/);
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision,expires_at:now}),/Recheck/);
    const {nights:omitted,...withoutNights}=offer.details;assert.equal(omitted,7);
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision,details:withoutNights}),/Complete the travel/);
    await assert.rejects(save({...offer,id:draft.id,revision:draft.revision,publication_approved:null}),/Complete and review/);
    await assert.rejects(db.query('update public.holiday_offers set price_minor=null where id=$1',[draft.id]),/Complete verified/);
    await assert.rejects(db.query("update public.holiday_offers set title='' where id=$1",[draft.id]),/Complete verified/);
    const enquiry=randomUUID();const receive=async(id=enquiry,fp='offer-fingerprint',ref='PBJ-765432')=>(await as<{r:{outcome:string;reference:string}}>('service_role','','select public.receive_holiday_offer_enquiry($1,$2,now(),$3,$4,$5,$6,$7,$8,$9) r',[id,ref,{name:'Synthetic customer'},{text:'Base notification',html:'<body>Base notification</body>'},fp,'offer-session','offer-email',draft.reference,draft.updated_at])).rows[0].r;
    assert.equal((await receive()).outcome,'received');
    const stored=(await db.query<{offer_context:Record<string,unknown>;notification_email:{text:string;html:string}}>('select offer_context,notification_email from public.holiday_enquiries where id=$1',[enquiry])).rows[0];assert.equal(stored.offer_context.price_minor,offer.price_minor);assert.equal((stored.offer_context.supplier_disclosures as {legal_name:string}).legal_name,'Synthetic legal operator');assert.match(stored.notification_email.text,/Synthetic public address/);assert.match(stored.notification_email.text,/not-applicable/);assert.ok(stored.notification_email.text.includes(String(draft.reference)));assert.ok(stored.notification_email.text.includes('1234.56'));assert.equal(JSON.stringify(stored).includes('PRIVATE'),false);
    supplier=await supplierSave({...payload,...supplier,display_name:'Changed synthetic name',permission_date:new Date().toISOString().slice(0,10),disclosures_verified_at:new Date().toISOString().slice(0,10)});
    assert.notEqual((await db.query<{updated_at:Date}>('select updated_at from public.holiday_offers where id=$1',[draft.id])).rows[0].updated_at,String(draft.updated_at));
    assert.equal((await receive(randomUUID(),'stale-version','PBJ-765435')).outcome,'offer_unavailable');
    await db.query('update public.holiday_offers set price_minor=999999 where id=$1',[draft.id]);
    await db.query("update public.holiday_offers set expires_at=now()-interval '1 second' where id=$1",[draft.id]);
    assert.equal((await as('anon','','select * from public.holiday_offers')).rows.length,0);
    assert.equal((await as('anon','','select id from public.content_media where id=$1',[media])).rows.length,0);
    assert.equal((await receive()).reference,'PBJ-765432');assert.equal((await receive(randomUUID(),'new-fingerprint','PBJ-765433')).outcome,'offer_unavailable');
    assert.equal((await receive(randomUUID(),'offer-fingerprint','PBJ-765434')).reference,'PBJ-765432');
    assert.deepEqual((await db.query('select offer_context,notification_email from public.holiday_enquiries where id=$1',[enquiry])).rows[0],stored);
    await assert.rejects(db.query("update public.holiday_enquiries set offer_context='{}' where id=$1",[enquiry]),/immutable/);
    const claimed=await as('service_role','','select * from public.claim_holiday_notification($1)',[enquiry]);assert.equal(claimed.rows.length,1);
    await db.query("update public.holiday_offers set expires_at=$1 where id=$2",[future,draft.id]);
    await supplierSave({...payload,id:supplier.id,revision:supplier.revision,active:false,permission:'approved',network_confirmed:true,permission_basis:'new-travel-network',disclosures_verified_at:new Date().toISOString().slice(0,10),disclosure_evidence:'Synthetic official source',disclosures:supplierDisclosures.parse({legal_name:'Synthetic legal operator',business_address:'Synthetic public address',public_contact:'public@example.com'}),permission_date:new Date().toISOString().slice(0,10),usage_notes:'Synthetic evidence'});
    assert.equal((await as('anon','','select * from public.holiday_offers')).rows.length,0);
    const flightSupplier=await supplierSave(supplierInput.parse({name:'Synthetic flight operator',display_name:'Synthetic flight operator',permission:'approved',network_confirmed:true,permission_basis:'new-travel-network',permission_date:new Date().toISOString().slice(0,10),usage_notes:'Synthetic restrictions',disclosures_verified_at:new Date().toISOString().slice(0,10),disclosure_evidence:'Synthetic register lookup',disclosures:{legal_name:'Synthetic flight company',business_address:'Synthetic address',public_contact:'public@example.com',atol_holder:'Synthetic licensed holder',atol_number:'T1234',atol_artwork:'/images/brand/synthetic.svg',protection_information:'Synthetic approved protection wording'}}));
    const flight=await save({...offer,id:null,revision:0,supplier_id:flightSupplier.id,slug:'synthetic-flight',details:{...offer.details,travel_type:'package',flight_inclusive:'yes',atol_status:'applicable'}});
    assert.ok((await as<{id:string}>('anon','','select id from public.holiday_offers')).rows.some(row=>row.id===flight.id));
    await assert.rejects(supplierSave({...payload,name:'Unsafe public projection',disclosures:{legal_name:'Safe',agent_url:'PRIVATE'}}),/check constraint/);
    await assert.rejects(as('authenticated',admin,"select public.cms_save_holiday_offer_phase8($1,$2)",[offer,{}]),/permission denied/);
    await assert.rejects(as('authenticated',admin,"update cms_private.offer_launch set enabled=true"),/permission denied/);
  }finally{await db.close();}
});

test('public offer filtering is bounded and parameterised, type/featured associations explicit, private fields excluded and expired rows rejected',async()=>{
  const requests:URL[]=[];const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false},global:{fetch:async input=>{requests.push(new URL(String(input)));return Response.json([],{headers:{'Content-Range':'0-0/0'}});}}});
  const q=offersQuery.parse({q:'Synthetic',destination:'Test',type:'cruises',departure:'Port',month:'2027-05',min:'100',max:'2000',board:'Full board',page:'2'});
  await loadOffers(q,{featured:true},client);const request=requests[0];assert.equal(request.searchParams.get('status'),'eq.published');assert.equal(request.searchParams.get('featured'),'eq.true');assert.equal(request.searchParams.get('holiday_types'),'cs.{cruises}');assert.equal(request.searchParams.get('price_minor'),'gte.10000');assert.ok(request.searchParams.get('select')?.includes('holiday_offer_suppliers'));assert.doesNotMatch(request.searchParams.get('select')||'',/private|agent|source|notes/);assert.match(offerHref(q),/page=2/);
  assert.equal(offersQuery.safeParse({month:'2027-13'}).success,false);assert.equal(offersQuery.safeParse({min:200,max:100}).success,false);assert.equal(offersQuery.safeParse({supplier:'invalid'}).success,false);
});

test('verified disclosures distinguish applicable, non-flight and pending ATOL; party pricing and strict public facts',()=>{
 const o=complete();const supplier=supplierInput.parse({name:'Synthetic',display_name:'Synthetic',active:true,permission:'approved',permission_date:'2026-10-22',usage_notes:'Synthetic network restrictions',network_confirmed:true,permission_basis:'new-travel-network',disclosures_verified_at:'2026-10-22',disclosure_evidence:'Synthetic source',disclosures:{legal_name:'Synthetic legal name',business_address:'Synthetic address',public_contact:'public@example.com'}});
 const s={...supplier,id:randomUUID()};assert.deepEqual(disclosureIssues(o,s),[]);
 assert.ok(disclosureIssues(o,{...s,network_confirmed:false}).length);assert.ok(disclosureIssues(o,{...s,permission:'declined'}).length);
 assert.ok(disclosureIssues(o,{...s,disclosures:{...s.disclosures,business_address:''}}).length);
 const flight={...o,details:{...o.details,travel_type:'package' as const,flight_inclusive:'yes' as const,atol_status:'applicable' as const}};
 assert.ok(disclosureIssues(flight,s).length);
 const licensed={...s,disclosures:{...s.disclosures,atol_holder:'Synthetic holder',atol_number:'T1234',protection_information:'Synthetic verified statement',atol_artwork:'/images/brand/synthetic.svg'}};
 assert.deepEqual(disclosureIssues(flight,licensed),[]);
 assert.ok(disclosureIssues({...flight,details:{...flight.details,atol_status:'not-applicable'}},licensed).length);
 assert.ok(disclosureIssues({...o,details:{...o.details,atol_status:'pending'}},s).length);
 assert.equal(partyTotal(o),'\u00a32,469.12');assert.equal(partyTotal({...o,price_basis:'total-party'}),'\u00a31,234.56');
 assert.equal(supplierDisclosures.safeParse({...s.disclosures,agent_url:'PRIVATE'}).success,false);
 assert.equal(supplierDisclosures.safeParse({...s.disclosures,atol_number:'P8763'}).success,false);
});
