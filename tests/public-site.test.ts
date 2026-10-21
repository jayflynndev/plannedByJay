import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { loadArticlePreviews } from '../src/lib/cms/previews';
import { approvedPolicies,policies } from '../src/content/policies';
import { navigation } from '../src/content/navigation';
import { site } from '../src/content/site';
test('homepage query requests only three published previews and strips all non-public fields',async()=>{
  const requests:URL[]=[];
  const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input)=>{
    const url=new URL(String(input));requests.push(url);
    if(url.pathname.endsWith('content_articles'))return Response.json([
      {id:'one',title:'Published guide',slug:'published-guide',excerpt:'A real saved excerpt',content_type:'Destination guide',status:'published',featured_media_id:'photo',featured_alt:'A coastline',notes:'Private note',body:'Not needed'},
      {id:'two',title:'No photograph',slug:'no-photo',excerpt:'Second excerpt',content_type:'Travel advice',status:'published',featured_media_id:null},
      {id:'three',title:'Private draft',slug:'private-draft',status:'draft',notes:'Private research'},
    ]);
    return Response.json([{id:'photo',storage_path:'20000000-0000-4000-8000-000000000001.webp',width:1200,height:800}]);
  }}});
  const previews=await loadArticlePreviews(client,'https://fixture.supabase.co');
  assert.equal(previews.length,2);assert.equal(previews[0].title,'Published guide');assert.equal(previews[1].image,null);
  assert.equal(previews[0].image?.alt,'A coastline');assert.equal(JSON.stringify(previews).includes('Private'),false);assert.equal('body' in previews[0],false);
  assert.equal(requests[0].searchParams.get('status'),'eq.published');assert.equal(requests[0].searchParams.get('limit'),'3');
  assert.equal(requests[0].searchParams.get('order'),'published_at.desc,updated_at.desc');assert.ok(!requests[0].searchParams.get('select')?.includes('body'));
  assert.ok(requests.every(url=>!url.pathname.includes('editorial')));
});
test('empty CMS libraries need no image query and database failures are not fabricated as articles',async()=>{
  let calls=0;let fail=false;
  const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async()=>{
    calls++;return fail?Response.json({code:'42501',message:'Denied'},{status:403}):Response.json([]);
  }}});
  assert.deepEqual(await loadArticlePreviews(client,'https://fixture.supabase.co'),[]);assert.equal(calls,1);
  fail=true;await assert.rejects(loadArticlePreviews(client,'https://fixture.supabase.co'),/permission/);
});
test('policy links require both explicit approval and actual text; confirmed trading details do not assert independent protection',()=>{
  assert.deepEqual(approvedPolicies(),[]);const original=policies.privacy;
  try{policies.privacy={...original,approved:true};assert.deepEqual(approvedPolicies(),[]);
    policies.privacy={...original,approved:true,sections:[{heading:'Test policy',paragraphs:['Approved test text']} ]};assert.deepEqual(approvedPolicies(),[{href:'/privacy',label:'Privacy policy'}]);
  }finally{policies.privacy=original;}
  assert.equal(site.contact.email,'jay@plannedbyjay.com');assert.equal(site.business.companyNumber,'16135195');assert.equal(site.business.vatNumber,'482 4625 76');
  assert.ok(site.business.tradingStatement.includes('on behalf of New Travel Holidays'));assert.ok(!site.business.headOffice.includes('registered office'));
  assert.ok(site.logos.every(logo=>!logo.src&&!logo.approvedForDisplay));
  assert.equal(navigation.find(item=>item.label==='Why Book With Jay?')?.href,'/why-jay');
});
