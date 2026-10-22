import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { holidayTypes, holidayType } from '../src/content/holiday-types';
import { holidayMetadata } from '../src/lib/holiday-metadata';
import { holidayReading } from '../src/lib/cms/holiday-reading';
import { home } from '../src/content/home';
import { navigation } from '../src/content/navigation';
import { buildPublicSitemap } from '../src/lib/cms/sitemap';

test('six holiday definitions drive valid routes, homepage cards, metadata, images, navigation and resilient sitemap',async()=>{
  assert.deepEqual(holidayTypes.map(item=>item.slug),['family','cruises','couples','city-breaks','something-different','accessible']);
  const titles=new Set(),descriptions=new Set();
  for(const item of holidayTypes){
    assert.equal(holidayType(item.slug),item);assert.match(item.slug,/^[a-z]+(?:-[a-z]+)*$/);
    assert.equal(home.holidays.items.find(card=>card.title===item.title)?.href,`/holidays/${item.slug}`);
    await access(`public${item.image.src}`);assert.ok(item.image.alt);
    assert.ok(item.introduction.length&&item.considerations.length&&item.ideas.length&&item.questions.length);
    assert.ok(item.alsoExplore.every(slug=>holidayType(slug)&&slug!==item.slug));
    const meta=holidayMetadata('https://plannedbyjay.com',item);
    assert.equal(meta.alternates?.canonical,`https://plannedbyjay.com/holidays/${item.slug}`);
    assert.ok(meta.openGraph);titles.add(meta.title);descriptions.add(meta.description);
    assert.equal(item.cta.action.href,'/plan-my-holiday');
  }
  assert.equal(titles.size,6);assert.equal(descriptions.size,6);assert.equal(holidayType('not-a-style'),undefined);assert.equal(holidayType('constructor'),undefined);
  assert.equal(navigation.find(item=>item.label==='Explore Holidays')?.href,'/holidays');
  assert.equal(holidayMetadata('https://plannedbyjay.com').alternates?.canonical,'https://plannedbyjay.com/holidays');
  const map=await buildPublicSitemap('https://plannedbyjay.com',[],async()=>{throw new Error('offline');},()=>{});
  assert.equal(map.filter(item=>item.url.includes('/holidays')).length,7);
  const route=await readFile('src/app/holidays/[slug]/page.tsx','utf8');
  assert.match(route,/force-dynamic/);assert.equal(route.match(/if\(!item\)notFound\(\)/g)?.length,2);
});

test('related reading matches taxonomy, bounds published queries, removes duplicates and strips private fields; empty/error states are honest',async()=>{
  const requests:URL[]=[];let mode='published';
  const id='10000000-0000-4000-8000-000000000001',tagId='20000000-0000-4000-8000-000000000001';
  const row={id,title:'Family room planning',slug:'family-room-planning',excerpt:'Room questions',content_type:'Travel advice',status:'published',featured_media_id:null,featured_alt:'',published_at:'2026-10-22T12:00:00Z',body:'Not a preview field',notes:'Private notes'};
  const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async input=>{
    const url=new URL(String(input));requests.push(url);
    if(mode==='error')return Response.json({message:'Do not expose provider details'},{status:503});
    if(url.pathname.endsWith('public_article_tags'))return Response.json(mode==='empty'?[]:[{id:tagId,name:' FAMILY   HOLIDAYS '},{id:'20000000-0000-4000-8000-000000000002',name:'Unrelated'}]);
    if(url.pathname.endsWith('content_categories'))return Response.json(mode==='empty'?[]:[{id:tagId,name:'Family Holidays'}]);
    return Response.json([row,row,{...row,id:tagId,status:'draft',slug:'private-draft'},{...row,id:'10000000-0000-4000-8000-000000000003',slug:'another-guide',published_at:'2026-10-21T12:00:00Z'}]);
  }}});
  const result=await holidayReading(client,'https://fixture.supabase.co',holidayTypes[0].related);
  assert.equal(result.length,2);assert.equal(result[0].slug,'family-room-planning');assert.equal(result[0].image,null);
  assert.equal(JSON.stringify(result).includes('Private'),false);assert.equal('body' in result[0],false);
  const queries=requests.filter(url=>url.pathname.endsWith('content_articles'));
  assert.equal(queries.length,2);
  for(const url of queries){assert.equal(url.searchParams.get('status'),'eq.published');assert.equal(url.searchParams.get('limit'),'3');assert.doesNotMatch(url.searchParams.get('select')||'',/body|sources|notes/);}
  assert.ok(queries.some(url=>url.searchParams.get('content_article_tags.tag_id')===`in.(${tagId})`));
  mode='empty';requests.length=0;assert.deepEqual(await holidayReading(client,'',holidayTypes[0].related),[]);assert.ok(requests.every(url=>!url.pathname.endsWith('content_articles')));
  mode='error';await assert.rejects(holidayReading(client,'',holidayTypes[0].related),/holiday_reading_unavailable/);
  assert.deepEqual(await holidayReading(null,'',holidayTypes[0].related),[]);
});
