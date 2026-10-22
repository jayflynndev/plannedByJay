import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import sharp from 'sharp';
import { prepareImage } from '../src/lib/cms/media';
import { CmsError, verifyAdministrator, verifyOrigin } from '../src/lib/cms/security';
import { articleInput, slugify } from '../src/lib/cms/schema';
import { editorValue } from '../src/lib/cms/editor';
import { articlePaths } from '../src/lib/cms/urls';
import { databaseError } from '../src/lib/cms/security';
import { saveArticle } from '../src/lib/cms/publishing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
const admin='10000000-0000-4000-8000-000000000001';
const ordinary='10000000-0000-4000-8000-000000000002';

test('server authentication denies forged/absent sessions, ordinary accounts and permission failures', async()=>{
  const fake=(user:{id:string}|null,membership:unknown,error:unknown=null)=>({auth:{getUser:async()=>({data:{user},error:null})},rpc:async()=>({data:membership,error})});
  await assert.rejects(verifyAdministrator(fake(null,true)),(error:unknown)=>error instanceof CmsError&&error.status===401);
  await assert.rejects(verifyAdministrator(fake({id:ordinary},false)),(error:unknown)=>error instanceof CmsError&&error.status===403);
  await assert.rejects(verifyAdministrator(fake({id:admin},null,new Error())),(error:unknown)=>error instanceof CmsError&&error.status===503);
  assert.equal((await verifyAdministrator(fake({id:admin},true))).id,admin);
  assert.throws(()=>verifyOrigin(new Request('http://localhost:3000/api/cms/articles',{headers:{origin:'https://attacker.example'}}),'http://localhost:3000'),/could not be verified/);
  assert.throws(()=>verifyOrigin(new Request('http://localhost:3000/api/cms/articles'),'http://localhost:3000'));
});
test('publishing validation, portable Markdown and failure messages do not hide errors',()=>{
  const draft={...editorValue(null),title:'A useful article',slug:'useful-article',body:'# Heading\n\n**Markdown**'};
  assert.equal(articleInput.safeParse(draft).success,true);
  assert.equal(articleInput.safeParse({...draft,status:'published'}).success,false);
  assert.equal(articleInput.safeParse({...draft,status:'published',excerpt:'A description',author:'Editor'}).success,true);
  assert.equal(articleInput.safeParse({...draft,canonical_url:'javascript:alert(1)'}).success,false);
  assert.equal(slugify('Café & city breaks'),'cafe-city-breaks');
  assert.throws(()=>databaseError({code:'23505'}),/already in use/);
  assert.throws(()=>databaseError({code:'40001'}),/another tab/);
  assert.throws(()=>databaseError({code:'unknown'}),/could not be saved/);
  assert.deepEqual(articlePaths(['old-url','new-url','old-url']),['/','/travel-advice','/sitemap.xml','/travel-advice/old-url','/travel-advice/new-url']);
});
test('save failures never report success or invalidate public caches; successful changes invalidate the listing, sitemap and old URLs',async()=>{
  const input={...editorValue(null),title:'Test',slug:'test',body:'Text',author:'Editor',excerpt:'Description',status:'published'};
  const paths:unknown[]=[];let error:{code:string}|null={code:'network'};
  const client={rpc:async()=>({data:{...input,id:admin,revision:1},error})} as unknown as SupabaseClient;
  await assert.rejects(saveArticle(client,input,(...args)=>paths.push(args)),/could not be saved/);assert.equal(paths.length,0);
  error=null;const saved=await saveArticle(client,input,(...args)=>paths.push(args));assert.equal(saved.status,'published');
  assert.deepEqual(paths,[['/'],['/travel-advice'],['/sitemap.xml'],['/travel-advice/test'],['/travel-advice/[slug]','page']]);
});
test('real Supabase RPC transport consumes the explicit JSON object returned by the CMS transaction',async()=>{
  const input={...editorValue(null),title:'RPC article',slug:'rpc-article',body:'Markdown',excerpt:'A description',author:'Editor'};
  let called=false;
  const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,init)=>{
    called=true;assert.ok(String(url).endsWith('/rest/v1/rpc/cms_save_article'));const body=JSON.parse(String(init?.body));assert.equal(body.p_article.slug,'rpc-article');assert.equal(body.p_revision,0);
    return Response.json({...body.p_article,id:admin,revision:1,updated_at:'2026-10-13T12:00:00Z'});
  }}});
  const saved=await saveArticle(client,input,()=>{});assert.equal(called,true);assert.equal(saved.id,admin);assert.equal(saved.slug,'rpc-article');
});
test('image upload decodes content, bounds input, strips location metadata and deduplicates the result',async()=>{
  const jpeg=await sharp({create:{width:80,height:60,channels:3,background:'#839c91'}}).jpeg().withExif({IFD0:{Artist:'Test'},IFD3:{GPSLatitude:'51/1 0/1 0/1',GPSLongitude:'0/1 0/1 0/1'}}).toBuffer();
  const image=await prepareImage(jpeg,'image/jpeg');const metadata=await sharp(image.data).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.exif,undefined);assert.equal(image.width,80);assert.equal(image.height,60);
  assert.equal(image.sha256,(await prepareImage(jpeg,'image/jpeg')).sha256);
  await assert.rejects(prepareImage(jpeg,'image/png'),/genuine/);
  await assert.rejects(prepareImage(Buffer.from('<svg onload="alert(1)"></svg>'),'image/svg+xml'),/genuine/);
  await assert.rejects(prepareImage(Buffer.alloc(5*1024*1024+1),'image/jpeg'),/smaller than/);
  await assert.rejects(prepareImage(Buffer.from([255,216,255,1,2]),'image/jpeg'),/could not be read/);
});

test('CMS migrations enforce RLS, publication, protected notes, slug history, optimistic saves and concurrent-safe media usage',async()=>{
  const db=new PGlite();
  async function as<T>(role:string,user:string,sql:string,args:unknown[]=[]) {
    await db.exec('begin');
    try {await db.exec(`set local role ${role}`);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const result=await db.query<T>(sql,args);await db.exec('commit');return result;}
    catch(error){await db.exec('rollback');throw error;}
  }
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth to anon,authenticated;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      insert into auth.users values('${admin}'),('${ordinary}');
      create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;
      create policy existing_broad_storage_policy on storage.objects for all to authenticated using(true) with check(true);`);
    await db.exec(await readFile('supabase/migrations/20261012_holiday_enquiries.sql','utf8'));
    await db.exec(await readFile('supabase/migrations/20261013_friendly_enquiry_references.sql','utf8'));
    const enquiryColumns=await db.query("select column_name from information_schema.columns where table_name='holiday_enquiries' order by ordinal_position");
    await db.exec(await readFile('supabase/migrations/20261014_editorial_cms.sql','utf8'));
    await db.exec(await readFile('supabase/migrations/20261014_editorial_storage.sql','utf8'));
    await db.exec(await readFile('supabase/migrations/20261023_article_discovery.sql','utf8'));
    assert.deepEqual((await db.query("select column_name from information_schema.columns where table_name='holiday_enquiries' order by ordinal_position")).rows,enquiryColumns.rows);
    await db.query('insert into cms_private.administrators(user_id) values($1)',[admin]);
    const draft=articleInput.parse({...editorValue(null),title:'First article',slug:'first-article',excerpt:'Useful advice',body:'# Heading\n\nContent',author:'Test author'});
    const {sources: _sources,notes: _notes,revision: _revision,...payload}=draft;void _sources;void _notes;void _revision;
    const save=(user:string,data:typeof payload,revision:number)=>as<{a:{id:string;revision:number;slug:string;status:string}}>('authenticated',user,'select to_jsonb(public.cms_save_article($1,$2,$3,$4,$5)) a',[JSON.stringify(data),'Private research source','Private editorial note',[],revision]);
    await assert.rejects(as('anon','','select public.cms_save_article($1,$2,$3,$4,$5)',[JSON.stringify(payload),'','',[],0]),/permission denied/);
    await assert.rejects(save(ordinary,payload,0),/Administrator access required/);
    const first=(await save(admin,payload,0)).rows[0].a;
    assert.equal((await as('anon','','select * from content_articles')).rows.length,0);
    assert.equal((await as('authenticated',ordinary,'select * from content_articles')).rows.length,0);
    assert.equal((await as('authenticated',ordinary,'select * from content_editorial')).rows.length,0);
    await assert.rejects(as('anon','','select * from content_editorial'),/permission denied/);
    await assert.rejects(as('authenticated',ordinary,"insert into content_articles(title,slug,content_type) values('Bad','bad','Blog')"),/permission denied/);
    assert.equal((await as('authenticated',admin,'select notes from content_editorial')).rows.length,1);
    const published=(await save(admin,{...payload,id:first.id,status:'published'},first.revision)).rows[0].a;
    assert.equal((await as('anon','','select * from content_articles')).rows.length,1);
    await assert.rejects(save(admin,{...payload,id:first.id,status:'draft'},first.revision),/changed elsewhere/);
    const renamed=(await save(admin,{...payload,id:first.id,status:'published',slug:'new-url'},published.revision)).rows[0].a;
    assert.equal((await as('anon',"",'select slug from content_slugs where was_published')).rows.length,2);
    await assert.rejects(save(admin,payload,0),/already reserved/);
    const unpublished=(await save(admin,{...payload,id:first.id,slug:'new-url'},renamed.revision)).rows[0].a;
    assert.equal((await as('anon','','select * from content_articles')).rows.length,0);
    assert.equal((await as('anon','','select * from content_slugs')).rows.length,0);
    const archived=(await save(admin,{...payload,id:first.id,slug:'new-url',status:'archived'},unpublished.revision)).rows[0].a;
    assert.equal(archived.status,'archived');
    // A direct authenticated request cannot delete objects while their registry exists.
    const imageId='20000000-0000-4000-8000-000000000001';
    await as('authenticated',admin,'select public.cms_register_media($1)',[JSON.stringify({id:imageId,storage_path:`${imageId}.webp`,original_name:'Photo',sha256:'a'.repeat(64),width:80,height:60,bytes:100})]);
    await as('authenticated',admin,"insert into storage.objects(bucket_id,name) values('editorial-images',$1)",[`${imageId}.webp`]);
    await assert.rejects(as('authenticated',ordinary,"insert into storage.objects(bucket_id,name) values('editorial-images',$1)",['20000000-0000-4000-8000-000000000002.webp']),/row-level security/);
    assert.equal((await as('authenticated',admin,'delete from storage.objects where name=$1 returning id',[`${imageId}.webp`])).rows.length,0);
    const withImage=(await save(admin,{...payload,id:first.id,slug:'new-url',body:`![Description](https://example.supabase.co/storage/v1/object/public/editorial-images/${imageId}.webp)`},archived.revision)).rows[0].a;
    await assert.rejects(as('authenticated',admin,'select public.cms_delete_media($1)',[imageId]),/foreign key/);
    await save(admin,{...payload,id:first.id,slug:'new-url'},withImage.revision);
    await as('authenticated',admin,'select public.cms_delete_media($1)',[imageId]);
    assert.equal((await as('authenticated',admin,'delete from storage.objects where name=$1 returning id',[`${imageId}.webp`])).rows.length,1);
    // CMS membership never grants access to enquiry personal data.
    await assert.rejects(as('authenticated',admin,'select * from holiday_enquiries'),/permission denied/);
  } finally{await db.close();}
});
