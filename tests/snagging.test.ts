import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {offerFixture,offerReferencesSql} from './helpers/offer-fixture';
import {holidayFixture} from './helpers/holiday-fixture';
import {articleBodyForDisplay} from '../src/lib/article-presentation';
import {cleanHtml} from '../src/lib/articles/html';
import {imageDescription} from '../src/content/image-descriptions';
import {relatedHolidays} from '../src/lib/related-holidays';
import {publicIndexingEnabled} from '../src/lib/indexing';
import robots from '../src/app/robots';

test('article placement migration retains content and independent flags, published/expiry rules and legacy saves',async()=>{
 const {db,run,admin}=await holidayFixture();
 const save=async(value:Record<string,unknown>)=>(await run<{article:Record<string,unknown>}>('authenticated',admin,'select public.save_article($1,$2) article',[value,[]])).rows[0].article;
 try{
   const first=await save({title:'Featured guide',slug:'featured-guide',body:'<p>Original text.</p>',status:'published',homepage_featured:true,advice_pinned:false});
   const pinned=await save({title:'Pinned guide',slug:'pinned-guide',body:'<p>Other original text.</p>',status:'published',homepage_featured:false,advice_pinned:true});
   const draft=await save({title:'Private guide',slug:'private-guide',body:'<p>Private text.</p>',homepage_featured:true,advice_pinned:true});
   await save({title:'Expired guide',slug:'expired-guide',body:'<p>Expired text.</p>',status:'published',expires_on:'2000-01-01',homepage_featured:true,advice_pinned:true});
   const before=(await db.query('select * from public.articles order by id')).rows;
   await db.exec(await readFile('supabase/migrations/20261027_article_placement.sql','utf8'));
   assert.deepEqual((await db.query('select * from public.articles order by id')).rows,before);
   const legacy=await save({...first,version:first.version,title:'Corrected title'});assert.equal(legacy.homepage_featured,true);assert.equal(legacy.advice_pinned,false);
   const minimal=await save({id:legacy.id,version:legacy.version,slug:legacy.slug,title:legacy.title,body:legacy.body,status:'published'});assert.equal(minimal.homepage_featured,true);
   const changed=await save({...minimal,version:minimal.version,advice_pinned:true,homepage_featured:false});assert.equal(changed.homepage_featured,false);assert.equal(changed.advice_pinned,true);
   assert.deepEqual((await run<{id:string}>('anon','','select id from public.articles order by advice_pinned desc,published_at desc,id')).rows.map(a=>a.id).sort(),[first.id,pinned.id].sort());
   assert.equal((await run('anon','','select id from public.articles where id=$1',[draft.id])).rows.length,0);
 }finally{await db.close();}
});

test('homepage reads selected featured articles independently from pinned newest-first advice ordering',async()=>{
 const keys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'],old=keys.map(k=>process.env[k]),original=fetch;
 Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'});
 const base={id:randomUUID(),slug:'guide',title:'Guide',body:'<p>Advice.</p>',category_id:'a0000000-0000-4000-8000-000000000001',status:'published',version:1,created_at:'2026-10-25T12:00:00Z',updated_at:'2026-10-25T12:00:00Z',published_at:'2026-10-25T12:00:00Z'};
 const rows=[{...base,id:randomUUID(),slug:'recent',homepage_featured:false,advice_pinned:false,published_at:'2026-10-27T12:00:00Z'},{...base,id:randomUUID(),slug:'pinned',homepage_featured:false,advice_pinned:true},{...base,id:randomUUID(),slug:'featured',homepage_featured:true,advice_pinned:false}];
 const queries:URL[]=[];
 globalThis.fetch=async(input)=>{const url=new URL(String(input));if(url.pathname.endsWith('article_categories'))return Response.json([]);queries.push(url);let result=rows.filter(row=>url.searchParams.get('homepage_featured')!=='eq.true'||row.homepage_featured);result=result.toSorted((a,b)=>(url.searchParams.get('order')?.startsWith('advice_pinned.desc')?Number(b.advice_pinned)-Number(a.advice_pinned):0)||b.published_at.localeCompare(a.published_at));return Response.json(result,{headers:{'Content-Range':`0-${result.length-1}/${result.length}`}});};
 try{const {publicArticleList}=await import('../src/lib/articles/data');assert.deepEqual((await publicArticleList()).articles.map(a=>a.slug),['pinned','recent','featured']);assert.deepEqual((await publicArticleList({featured:true,limit:3})).articles.map(a=>a.slug),['featured']);assert.equal(queries[0].searchParams.get('status'),'eq.published');assert.equal(queries[1].searchParams.get('homepage_featured'),'eq.true');assert.ok(!queries[1].searchParams.get('order')?.includes('advice_pinned'));}
 finally{globalThis.fetch=original;keys.forEach((key,i)=>{if(old[i]===undefined)delete process.env[key];else process.env[key]=old[i];});}
});

test('random offer references reserve old sequence numbers forever and reconcile 000001 without changing enquiries',async()=>{
 const {db,save,sample,run}=await offerFixture();
 try{
   const published=await save({...sample,status:'published'});assert.equal(published.reference,'000001');
   await db.query('select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),published.id,'Fixture customer','fixture@example.org','','Saved question','a'.repeat(64)]);
   const enquiriesBefore=(await db.query('select * from public.offer_enquiries')).rows;
   const second=await save({...sample,slug:'second-fixture'});await db.query('delete from public.holiday_offers where id=$1',[second.id]);
   const before=(await db.query<{row:Record<string,unknown>}>("select to_jsonb(o)-'reference' row from public.holiday_offers o where id=$1",[published.id])).rows[0];
   const migration=await readFile('supabase/migrations/20261027_random_offer_references.sql','utf8');await db.exec(migration);
   const row=(await db.query<Record<string,unknown>>('select * from public.holiday_offers where id=$1',[published.id])).rows[0];
   assert.match(String(row.reference),/^[0-9]{6}$/);assert.notEqual(row.reference,'000001');assert.equal(row.previous_reference,'000001');
   const other=(await db.query<{row:Record<string,unknown>}>("select to_jsonb(o)-'reference'-'previous_reference' row from public.holiday_offers o where id=$1",[published.id])).rows[0].row;assert.deepEqual(other,before.row);
   assert.deepEqual((await db.query('select * from public.offer_enquiries')).rows,enquiriesBefore);
   assert.equal((enquiriesBefore[0] as {offer_snapshot:{reference:string}}).offer_snapshot.reference,'000001');
   assert.equal((await db.query<{n:number}>("select count(*)::int n from public.holiday_offer_reference_reservations where reference in ('000001','000002')")).rows[0].n,2);
   const state=(await db.query('select * from public.holiday_offers order by id')).rows;await db.exec(migration);assert.deepEqual((await db.query('select * from public.holiday_offers order by id')).rows,state);
   await assert.rejects(run('anon','','select * from public.holiday_offer_reference_reservations'),/permission denied/);
   // Force collisions with a deleted old code, then return a zero-padded free code.
   await db.exec("create sequence public.offer_ref_test_draw;create or replace function public.holiday_offer_reference_candidate() returns text language plpgsql volatile set search_path='' as $$begin if nextval('public.offer_ref_test_draw')<=2 then return '000002';end if;return '000000';end;$$");
   const created=await save({...sample,slug:'random-fixture'});assert.equal(created.reference,'000000');
   const edited=await save({...sample,id:String(created.id),version:Number(created.version),slug:'random-fixture',title:'Updated fixture'});assert.equal(edited.reference,'000000');
   await db.query('delete from public.holiday_offers where id=$1',[created.id]);
   assert.equal((await db.query<{n:number}>("select count(*)::int n from public.holiday_offer_reference_reservations where reference='000000'")).rows[0].n,1);
   await assert.rejects(save({...sample,slug:'exhausted-fixture'}),e=>(e as {code:string}).code==='55000');
 }finally{await db.close();}
});

test('very old enquiry snapshots keep their reference fallback when offer references become random',async()=>{
 const {db,save,sample}=await offerFixture({references:false});
 try{
   const published=await save({...sample,status:'published'});
   await db.query('select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),published.id,'Fixture customer','fixture@example.org','','Original question','b'.repeat(64)]);
   const before=(await db.query('select * from public.offer_enquiries')).rows;
   await db.exec(await offerReferencesSql());
   assert.equal((await db.query<{reference:string}>('select reference from public.holiday_offers where id=$1',[published.id])).rows[0].reference,'000001');
   await db.exec(await readFile('supabase/migrations/20261027_random_offer_references.sql','utf8'));
   const retained=(await db.query<{reference:string;previous_reference:string|null}>('select reference,previous_reference from public.holiday_offers where id=$1',[published.id])).rows[0];
   assert.deepEqual(retained,{reference:'000001',previous_reference:null});
   assert.deepEqual((await db.query('select * from public.offer_enquiries')).rows,before);
   const created=await save({...sample,slug:'new-random-fixture'});
   assert.match(String(created.reference),/^[0-9]{6}$/);assert.notEqual(created.reference,'000001');
 }finally{await db.close();}
});

test('table sanitation and duplicate-heading presentation preserve stored content and meaningful sections',()=>{
 const raw='<h2><strong>Travel &amp; advice</strong></h2><p>Useful original content.</p><table onclick="bad()"><thead><tr><th colspan="2" scope="col">Header</th></tr></thead><tbody><tr><td rowspan="2" style="text-align: right; background: url(javascript:bad)"><strong>Value</strong></td><td colspan="9999" onmouseover="bad()">Second</td></tr></tbody></table><h2>Useful section</h2><p><a href="javascript:bad()">Unsafe link</a></p>';
 const clean=cleanHtml(raw);assert.match(clean,/<table>/);assert.match(clean,/<th colspan="2" scope="col">/);assert.match(clean,/rowspan="2"/);assert.doesNotMatch(clean,/onclick|onmouseover|javascript:|9999|background/);
 const displayed=articleBodyForDisplay(clean,'Travel & advice');assert.doesNotMatch(displayed,/h2><strong>Travel/);assert.match(displayed,/Useful original content/);assert.match(displayed,/<h2>Useful section/);assert.match(displayed,/article-table-scroll/);assert.equal((displayed.match(/<th /g)||[]).length,1);assert.ok(clean.includes('Travel &amp; advice'));
 assert.match(articleBodyForDisplay('<h2>A different section</h2><p>Text.</p>','Title'),/different section/);
});

test('image labels and related holiday links use reviewed assets and deliberate associations',()=>{
 assert.match(imageDescription('https://example.org/a173848f-4771-4d85-a52f-abc23252e509-caption.webp','caption'),/swimming pool/);
 assert.equal(imageDescription('/photo.webp','A description supplied by Jay'),'A description supplied by Jay');assert.equal(imageDescription('/unknown.webp','caption'),'');
 const categories=['family','couples','city-breaks','something-different'].map(slug=>({slug}));
 for(const slug of ['couples','city-breaks'])assert.ok(relatedHolidays(slug,categories).every(h=>h.slug!=='family'&&h.slug!==slug));
});

test('robots permits public crawling and launch indexing is explicit, production-only and private routes stay excluded',()=>{
 const keys=['SITE_INDEXABLE','SITE_URL','VERCEL','VERCEL_ENV'],old=keys.map(k=>process.env[k]);
 try{
 Object.assign(process.env,{SITE_URL:'https://plannedbyjay.com',VERCEL:'1',VERCEL_ENV:'production'});delete process.env.SITE_INDEXABLE;assert.equal(publicIndexingEnabled(),false);
 process.env.SITE_INDEXABLE='true';assert.equal(publicIndexingEnabled(),true);process.env.VERCEL_ENV='preview';assert.equal(publicIndexingEnabled(),false);
 process.env.VERCEL_ENV='production';process.env.SITE_URL='http://localhost:3000';assert.equal(publicIndexingEnabled(),false);
 process.env.SITE_URL='https://plannedbyjay.com';const rule=robots();assert.deepEqual(rule.rules,{userAgent:'*',allow:'/',disallow:['/admin','/api/']});assert.equal(rule.sitemap,'https://plannedbyjay.com/sitemap.xml');
 }finally{keys.forEach((key,i)=>{if(old[i]===undefined)delete process.env[key];else process.env[key]=old[i];});}
});
