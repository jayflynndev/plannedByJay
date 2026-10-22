import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import { articleInput } from '../src/lib/cms/schema';
import { editorValue } from '../src/lib/cms/editor';
import { parseDiscoveryQuery,discoveryHref } from '../src/lib/cms/discovery-query';
import { loadDiscovery } from '../src/lib/cms/discovery';
import { loadArticlePreviews } from '../src/lib/cms/previews';

test('discovery URL validation, parameterised transport, bounded projection and honest failure/empty states',async()=>{
  assert.equal(parseDiscoveryQuery({q:'x'.repeat(121)}).valid,false);
  assert.equal(parseDiscoveryQuery({page:'-1'}).valid,false);
  assert.equal(parseDiscoveryQuery({tag:'not-a-uuid'}).valid,false);
  assert.equal(parseDiscoveryQuery({q:['one','two']}).valid,false);
  const {query}=parseDiscoveryQuery({q:'  mountains & coast  ',type:'Travel advice',page:'2'});
  assert.match(discoveryHref(query),/q=mountains\+%26\+coast/);
  assert.match(discoveryHref(query),/page=2/);
  let fail=false;const requests:{url:URL;body:Record<string,unknown>}[]=[];
  const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
    const url=new URL(String(input));requests.push({url,body:JSON.parse(String(init?.body||'{}'))});
    if(fail)return Response.json({message:'private upstream details'},{status:403});
    if(url.pathname.endsWith('search_content_articles'))return Response.json({total:0,articles:[]});
    return Response.json([]);
  }}});
  const result=await loadDiscovery(client,'https://fixture.supabase.co',query);
  assert.equal(result.total,0);assert.equal(result.articles.length,0);
  const search=requests.find(request=>request.url.pathname.endsWith('search_content_articles'))!;
  assert.equal(search.body.p_query,'mountains & coast');assert.equal(search.body.p_page,2);
  assert.ok(requests.every(request=>!request.url.pathname.endsWith('/content_articles')),'no unbounded article-table download');
  fail=true;await assert.rejects(loadDiscovery(client,'https://fixture.supabase.co',query),/discovery_unavailable/);
  await assert.rejects(loadDiscovery(null,'',query),/unconfigured/);
  assert.equal(articleInput.safeParse({...editorValue(null),title:'Fixture',slug:'fixture',tag_ids:Array.from({length:9},()=>randomUUID())}).success,false);
});

test('homepage explicitly featured articles override latest fallback with deterministic public ordering',async()=>{
  let featured=false;let request:URL|undefined;
  const row=(id:string,isFeatured=false)=>({id,title:id,slug:id,excerpt:'Fixture',content_type:'Travel advice',status:'published',homepage_featured:isFeatured,featured_media_id:null,featured_alt:''});
  const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input)=>{
    request=new URL(String(input));return Response.json(featured?[row('featured',true),row('latest'),{...row('draft',true),status:'draft'}]:[row('latest'),row('older')]);
  }}});
  assert.deepEqual((await loadArticlePreviews(client,'https://fixture.supabase.co')).map(row=>row.id),['latest','older']);
  featured=true;assert.deepEqual((await loadArticlePreviews(client,'https://fixture.supabase.co')).map(row=>row.id),['featured']);
  assert.equal(request?.searchParams.get('limit'),'3');
  assert.equal(request?.searchParams.get('order'),'homepage_featured.desc,published_at.desc,updated_at.desc,id.asc');
});

test('actual discovery migration: indexed title/body/tag search, filters, pinning, bounded pages, tag limits, RLS and atomic saves',async()=>{
  const db=new PGlite();const admin=randomUUID(),ordinary=randomUUID();
  async function as<T>(role:string,user:string,sql:string,args:unknown[]=[]) {
    await db.exec('begin');
    try{await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const result=await db.query<T>(sql,args);await db.exec('commit');return result;}
    catch(error){await db.exec('rollback');throw error;}
  }
  type Saved={id:string;revision:number;slug:string;tag_ids:string[]};
  type Found={total:number;articles:{id:string;slug:string;advice_pinned:boolean}[]};
  const base=articleInput.parse({...editorValue(null),title:'Mountain weekend',slug:'mountain-weekend',excerpt:'Volcano walks',body:'Glacier excursions',author:'Fixture author',status:'published'});
  const save=async(values:Record<string,unknown>={},revision=0)=>(await as<{saved:Saved}>('authenticated',admin,
    "select public.cms_save_article($1,'private source','private editorial note','{}', $2) as saved",[{...base,...values},revision])).rows[0].saved;
  const tag=async(name:string)=>(await as<{tag:{id:string;name:string}}>('authenticated',admin,'select public.cms_create_tag($1) as tag',[name])).rows[0].tag;
  const search=async(q='',type='',category:string|null=null,tagId:string|null=null,page=1)=>(await as<{result:Found}>('anon','',
    'select public.search_content_articles($1,$2,$3,$4,$5) as result',[q,type,category,tagId,page])).rows[0].result;
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;
      create table auth.users(id uuid primary key);grant usage on schema auth to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
    await db.query('insert into auth.users values($1),($2)',[admin,ordinary]);
    await db.exec(await readFile('supabase/migrations/20261014_editorial_cms.sql','utf8'));
    await db.query('insert into cms_private.administrators(user_id) values($1)',[admin]);
    const old=await save();
    const before=(await db.query('select title,slug,body,revision from public.content_articles')).rows;
    await db.exec(await readFile('supabase/migrations/20261023_article_discovery.sql','utf8'));
    assert.deepEqual((await db.query('select title,slug,body,revision from public.content_articles')).rows,before);
    assert.ok((await db.query<{indexdef:string}>("select indexdef from pg_indexes where indexname='content_articles_search'")).rows[0].indexdef.includes('gin'));
    assert.equal((await search('mountain')).total,1);assert.equal((await search('glacier')).total,1);assert.equal((await search('volcano')).total,1);
    const japan=await tag('  Japan  ');assert.equal((await tag('JAPAN')).id,japan.id);
    await assert.rejects(db.query("insert into public.content_tags(name) values(E'\\tJaPaN\\t')"),/unique constraint/,'database constraint also protects normalised duplicates');
    const coast=await tag('Coastal   escapes');assert.equal((await tag('coastal escapes')).id,coast.id);
    const cat=(await db.query<{id:string}>("select id from public.content_categories where name='Destinations'")).rows[0].id;
    const mountain=await save({...old,category_id:cat,tag_ids:[japan.id],advice_pinned:true,homepage_featured:true},old.revision);
    assert.equal((await search('japan')).total,1);
    assert.equal((await search('glacier','Travel advice',cat,japan.id)).total,1);
    assert.equal((await search('glacier','Blog',cat,japan.id)).total,0);
    const beach=await save({title:'Beach days',slug:'beach-days',body:'Sandy shores',excerpt:'Warm coast',tag_ids:[coast.id]});
    const hidden=await tag('Private draft tag');
    const draft=await save({title:'Draft secret',slug:'draft-secret',status:'draft',body:'Glacier hidden fixture',tag_ids:[hidden.id],advice_pinned:true,homepage_featured:true});
    await save({title:'Archived secret',slug:'archived-secret',status:'archived',body:'Glacier hidden fixture',tag_ids:[hidden.id],advice_pinned:true});
    assert.equal((await search('glacier')).total,1);
    assert.equal((await search()).articles[0].id,mountain.id,'matching pinned article above chronological results');
    assert.deepEqual((await search('beach')).articles.map(row=>row.id),[beach.id],'unmatching pin excluded');
    await save({...beach,title:'Beach days',body:'Sandy shores',excerpt:'Warm coast',tag_ids:[coast.id],advice_pinned:true,homepage_featured:true},beach.revision);
    await db.query("update public.content_articles set published_at='2026-10-20T12:00:00Z',updated_at='2026-10-22T12:00:00Z' where id=any($1::uuid[])",[[mountain.id,beach.id]]);
    assert.deepEqual((await search()).articles.map(row=>row.id),[mountain.id,beach.id].sort(),'multiple pins use stable UUID tie-breaks');
    const featuredOrder=await db.query<{id:string}>("select id from public.content_articles where status='published' and homepage_featured order by published_at desc,updated_at desc,id limit 3");
    assert.deepEqual(featuredOrder.rows.map(row=>row.id),[mountain.id,beach.id].sort(),'multiple featured articles use deterministic ties and exclude featured drafts');
    assert.equal((await search('nonexistentword')).total,0);
    const publicTags=(await as<{id:string}>('anon','','select id from public.public_article_tags()')).rows;
    assert.ok(!publicTags.some(row=>row.id===hidden.id));
    assert.equal((await as('anon','','select * from public.content_articles where id=$1',[draft.id])).rows.length,0);
    assert.equal(JSON.stringify(await search()).includes('private editorial'),false);
    assert.equal(JSON.stringify(await search()).includes('body'),false);
    await assert.rejects(as('anon','','select public.cms_create_tag($1)',['Forbidden']),/permission denied/);
    await assert.rejects(as('authenticated',ordinary,'select public.cms_create_tag($1)',['Forbidden']),/Administrator access/);
    await assert.rejects(as('authenticated',ordinary,"insert into public.content_article_tags values($1,$2)",[draft.id,japan.id]),/permission denied/);
    await assert.rejects(as('authenticated',admin,"insert into public.content_tags(name) values('Bypass')"),/permission denied/);
    await assert.rejects(as('authenticated',admin,"select public.cms_save_article_core($1,'','','{}',0)",[base]),/permission denied/);
    const ids=[japan.id,coast.id,hidden.id];for(let i=0;i<6;i++)ids.push((await tag(`Fixture tag ${i}`)).id);
    await assert.rejects(save({...mountain,tag_ids:ids},mountain.revision),/eight distinct/);
    assert.equal((await db.query<{revision:number}>('select revision from public.content_articles where id=$1',[mountain.id])).rows[0].revision,mountain.revision);
    const removed=await save({...mountain,tag_ids:[]},mountain.revision);
    assert.equal((await search('japan')).total,0,'removing tag updates search vector');
    assert.equal((await db.query('select id from public.content_tags where id=$1',[japan.id])).rows.length,1);
    const renamed=await save({...removed,slug:'mountain-new',tag_ids:[japan.id]},removed.revision);
    assert.equal((await db.query('select slug from public.content_slugs where article_id=$1',[renamed.id])).rows.length,2,'slug reservations/redirect history preserved');
    await assert.rejects(save({...renamed,tag_ids:[]},removed.revision),/changed elsewhere/);
    assert.equal((await search('japan')).total,1,'conflicting save cannot detach tags');
    for(let i=0;i<13;i++)await save({title:`Page fixture ${i}`,slug:`page-fixture-${i}`,body:'Paginationfixture'});
    assert.equal((await search('Paginationfixture')).articles.length,12);
    await assert.rejects(search('Paginationfixture','','',null),/invalid input syntax for type uuid/,'invalid UUID is rejected, not interpolated');
    assert.equal((await search('Paginationfixture','',null,null,2)).articles.length,1);
    await assert.rejects(search('', '',null,null,1001),/Invalid discovery query/);
    const count=(await db.query<{count:number}>('select count(*)::int as count from public.content_tags')).rows[0].count;
    for(let i=count;i<100;i++)await tag(`Registry fixture ${i}`);
    await assert.rejects(tag('One too many'),/100-tag limit/);
    assert.equal((await tag('japan')).id,japan.id,'existing tag still reusable at registry limit');
  } finally {await db.close();}
});
