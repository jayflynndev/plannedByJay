import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {supplierDisclosures} from '../src/lib/offers/schema';

const sql=readFileSync('data/preferred-suppliers/import.sql','utf8');
const batch=JSON.parse(sql.split('$pbj_data$')[1]) as {cell:string;aliases:string[];payload:Record<string,unknown>}[];
const apply=sql.replace('values (false); -- THE ONLY APPLY SWITCH','values (true); -- THE ONLY APPLY SWITCH');

test('historical research/import batch preserves all 76 workbook names and public facts',async()=>{
  const workbook=JSON.parse(await readFile('src/content/preferred-suppliers.json','utf8'));
  const research=JSON.parse(await readFile('data/preferred-suppliers/research.json','utf8'));
  assert.equal(batch.length,76);
  assert.deepEqual(batch.map(r=>({name:r.payload.name,cell:r.cell})),workbook.entries);
  assert.deepEqual(research.records.map((r:{workbook_name:string;cell:string})=>({name:r.workbook_name,cell:r.cell})),workbook.entries);
  for(const {payload} of batch){
    const disclosures=supplierDisclosures.parse(payload.disclosures);
    const researched=research.records.find((r:{workbook_name:string})=>r.workbook_name===payload.name);
    for(const key of ['legal_name','business_address','public_contact','atol_holder','atol_number'] as const)assert.equal(disclosures[key],researched[key]);
    assert.equal(payload.permission,'pending');assert.equal(payload.network_confirmed,true);
    assert.ok(String(payload.usage_notes).includes('Dale'));
  }
});

test('actual-schema import: preview, matching, conflict preservation, private provenance, atomic repeat and no enquiry/offer changes',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
    for(const name of ['20261012_holiday_enquiries.sql','20261013_friendly_enquiry_references.sql','20261014_editorial_cms.sql','20261023_article_discovery.sql','20261024_inline_classification.sql','20261022_safe_enquiry_erasure.sql','20261025_curated_holiday_offers.sql','20261026_offer_enquiry_snapshots.sql','20261027_supplier_offer_disclosures.sql','20261028_supplier_lookup.sql'])
      await db.exec(await readFile(`supabase/migrations/${name}`,'utf8'));
    await db.exec(sql);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from public.holiday_offer_suppliers')).rows[0].n,0);
    await assert.rejects(db.exec(apply.replace('"display_name": "Ambassador Cruise Line"','"display_name": ""')),/check constraint/);
    await db.exec('rollback');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from public.holiday_offer_suppliers')).rows[0].n,0);
    const existing=[['AmaWaterways','  AMAWATERWAYS  ','https://existing.example'],['Ambassador Cruise Line','Existing ambassador one',''],['Ambassador Cruise Lines','Existing ambassador two',''],['Existing luxury desk','Existing luxury desk','https://www.caribtours.co.uk']];
    const ids:string[]=[];
    for(const [display,name,website] of existing){
      const id=randomUUID();ids.push(id);
      await db.query('insert into public.holiday_offer_suppliers(id,display_name,disclosures) values($1,$2,$3)',[id,display,{legal_name:'Original verified entity',business_address:'Original verified address',official_website:website}]);
      await db.query(`insert into cms_private.offer_supplier_information(supplier_id,name,website,notes,permission,usage_notes,account_reference,lookup_record,revision)
        values($1,$2,$3,'PRIVATE ORIGINAL NOTES','declined','Original restriction','PRIVATE ACCOUNT',$4,7)`,[id,name,display==='Existing luxury desk'?'':website,{facts:[],company_number:'99999999'}]);
    }
    const draftId=randomUUID(),draftNote='Name from New Travel preferred supplier list: Sheet1!A5. Identity, public disclosures, marketing restrictions and asset rights require review.';
    await db.query("insert into public.holiday_offer_suppliers(id,display_name) values($1,'APT')",[draftId]);
    await db.query("insert into cms_private.offer_supplier_information(supplier_id,name,notes) values($1,'APT',$2)",[draftId,draftNote]);
    const offer=randomUUID(),enquiry=randomUUID();
    await db.query("insert into public.holiday_offers(id,supplier_id,title) values($1,$2,'Preserved synthetic draft')",[offer,ids[0]]);
    await db.query('select public.receive_holiday_enquiry_v2($1,$2,now(),$3,$4,$5,$6,$7)',[enquiry,'PBJ-654321',{name:'Synthetic only'},{text:'Immutable original',html:'<body>Immutable original</body>'},'synthetic-fingerprint','synthetic-session','synthetic-email']);
    const snapshot=async()=>({suppliers:(await db.query('select * from public.holiday_offer_suppliers where id=any($1) order by id',[ids])).rows,private:(await db.query('select * from cms_private.offer_supplier_information where supplier_id=any($1) order by supplier_id',[ids])).rows,offers:(await db.query('select * from public.holiday_offers')).rows,enquiries:(await db.query('select * from public.holiday_enquiries')).rows,launch:(await db.query('select * from cms_private.offer_launch')).rows});
    const before=await snapshot();
    const preview=await db.exec(sql);
    const plan=preview.flatMap(r=>r.rows).filter(r=>'action' in r) as {action:string;workbook_name:string;applied:boolean}[];
    assert.equal(plan.length,76);assert.ok(plan.every(r=>!r.applied));
    assert.equal(plan.find(r=>r.workbook_name==='AmaWaterways')?.action,'preserve_existing');
    assert.equal(plan.find(r=>r.workbook_name==='Ambassador Cruise Lines')?.action,'review_multiple_matches');
    assert.equal(plan.find(r=>r.workbook_name==='Caribtours')?.action,'review_possible_duplicate');
    assert.equal(plan.find(r=>r.workbook_name==='APT')?.action,'enrich_name_only_draft');
    assert.deepEqual(await snapshot(),before);
    await db.exec(apply);
    assert.deepEqual(await snapshot(),before);
    assert.equal((await db.query<{n:number}>('select count(*)::int n from public.holiday_offer_suppliers')).rows[0].n,77);
    const enriched=(await db.query<{name:string;notes:string;revision:number;website:string;active:boolean;permission:string}>('select * from cms_private.offer_supplier_information where supplier_id=$1',[draftId])).rows[0];
    assert.equal(enriched.name,'APT');assert.ok(enriched.notes.startsWith(draftNote));assert.equal(enriched.revision,2);
    assert.equal(enriched.website,'https://www.aptouring.com/en-gb');assert.equal(enriched.active,true);assert.equal(enriched.permission,'pending');
    const all=async()=>(await db.query('select to_jsonb(s)||to_jsonb(i) record from public.holiday_offer_suppliers s join cms_private.offer_supplier_information i on i.supplier_id=s.id order by s.id')).rows;
    const once=await all();await db.exec(apply);assert.deepEqual(await all(),once);
    const publicJson=JSON.stringify((await db.query('select * from public.holiday_offer_suppliers')).rows);
    assert.equal(publicJson.includes('Dale'),false);assert.equal(publicJson.includes('source_url'),false);assert.equal(publicJson.includes('PRIVATE ACCOUNT'),false);
    await db.exec('set role anon');
    assert.equal((await db.query<{n:number}>('select count(*)::int n from public.holiday_offer_suppliers')).rows[0].n,0);
    await assert.rejects(db.query('select * from cms_private.offer_supplier_information'),/permission denied/);
    await db.exec('reset role');
  } finally {await db.close();}
});
