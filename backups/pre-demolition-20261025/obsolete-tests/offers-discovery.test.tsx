import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {emptyOffer,prepareOffer,supplierInput,type OfferInput} from '../src/lib/offers/schema';
import type {loadOffers} from '../src/lib/offers/data';
// Node fixture only: load server modules outside Next's RSC bundler so public page
// functions can be exercised with ordinary React. No live account/auth is mocked.
const marker=require.resolve('server-only');
require.cache[marker]={id:marker,filename:marker,loaded:true,exports:{}} as NodeModule;
function complete(supplier:string=randomUUID(),media:string=randomUUID()):OfferInput{return prepareOffer({...emptyOffer(),title:'Synthetic holiday',slug:'synthetic-holiday',supplier_id:supplier,holiday_types:['family'],price_minor:99900,featured_media_id:media,featured_alt:'Synthetic coastline',details:{...emptyOffer().details,country:'Spain',description:'Synthetic holiday description',travel_type:'hotel-only',flight_inclusive:'no',adults:'2',children:'0',departure_date:new Date(Date.now()+60*86400000).toISOString().slice(0,10),nights:7,inclusions:'Accommodation',price_checked_at:new Date(Date.now()-20*86400000).toISOString()}},'published');}

test('publication feedback distinguishes a closed gate, expiry, database hold, anonymous access and unavailable verification',async()=>{
 const {offerVisibility}=await import('../src/lib/offers/visibility');const offer={...complete(),id:randomUUID(),holiday_types:[]};
 const supplier={...supplierInput.parse({name:'Synthetic',disclosures:{legal_name:'Synthetic company',business_address:'Public address',public_contact:'public@example.com'}}),id:offer.supplier_id!};
 let gate=true,current=true,unavailable=false;
 const client=createClient('https://fixture.supabase.co','sb_publishable_fixture',{auth:{persistSession:false},global:{fetch:async input=>unavailable?Response.json({code:'unavailable'},{status:503}):Response.json(String(input).includes('holiday_offers_enabled')?gate:current)}});
 const readable=async()=>({total:1,offers:[{slug:offer.slug}] as Awaited<ReturnType<typeof loadOffers>>['offers']});
 assert.equal((await offerVisibility(client,offer,supplier,readable)).visible,true);
 gate=false;assert.match((await offerVisibility(client,offer,supplier,readable)).message,/gate is disabled/);gate=true;
 assert.match((await offerVisibility(client,{...offer,details:{...offer.details,promotion_expires_at:'2000-01-01T00:00:00Z'}},supplier,readable)).message,/deadline has passed/);
 current=false;assert.match((await offerVisibility(client,offer,supplier,readable)).message,/database public-visibility guard/);current=true;
 assert.match((await offerVisibility(client,offer,supplier,async()=>({total:0,offers:[]}))).message,/anonymous catalogue/);
 unavailable=true;assert.equal((await offerVisibility(client,offer,supplier,readable)).visible,null);
 assert.equal((await offerVisibility(client,{...offer,status:'draft'},supplier,readable)).visible,false);
});

test('real catalogue/detail/category/homepage routes use fresh shared public reads, including uncategorised packages',async()=>{
 const keys=['CMS_ENABLED','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','APP_ORIGIN'];const before=keys.map(k=>process.env[k]);const original=globalThis.fetch;
 Object.assign(process.env,{CMS_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture',APP_ORIGIN:'https://plannedbyjay.com'});
 const {default:Catalogue,dynamic:catalogueDynamic}=await import('../src/app/holiday-offers/page');
 const {default:Detail,dynamic:detailDynamic}=await import('../src/app/holiday-offers/[slug]/page');
 const {default:Category}=await import('../src/app/holidays/[slug]/page');
 const {default:Home,dynamic:homeDynamic}=await import('../src/app/page');
 const rows=['generic','family','cruise'].map((name,index)=>{const o=complete();return {...o,id:randomUUID(),status:'published',reference:`PBJO-ABCDEF0${index}`,slug:name,featured:index===0,holiday_types:index===0?[]:[index===1?'family':'cruises'],details:{...o.details,travel_type:index===2?'cruise-only':'package',departure_point:'London',board_basis:index===0?'All Inclusive':'Full board'},updated_at:new Date().toISOString(),expires_at:null,holiday_offer_suppliers:{display_name:'Synthetic supplier',logo_id:null,logo_alt:'',disclosures:{legal_name:'Synthetic company',business_address:'Public address',public_contact:'public@example.com'}}};});
 let gate=true,available=rows;const cacheModes:unknown[]=[];
 globalThis.fetch=async(input,init)=>{const url=new URL(String(input));cacheModes.push(init?.cache);
   if(url.pathname.includes('/rpc/holiday_offers_enabled'))return Response.json(gate);
   if(url.pathname.endsWith('/holiday_offers')){let selected=gate?available:[];const slug=url.searchParams.get('slug');if(slug)selected=selected.filter(o=>'eq.'+o.slug===slug);const type=url.searchParams.get('holiday_types');if(type)selected=selected.filter(o=>o.holiday_types.some(t=>type.includes(t)));if(url.searchParams.has('or'))selected=selected.filter(o=>o.details.board_basis==='All Inclusive');if(url.searchParams.get('featured')==='eq.true')selected=selected.filter(o=>o.featured);return Response.json(selected,{headers:{'Content-Range':`0-${Math.max(0,selected.length-1)}/${selected.length}`}});}
   return Response.json([]);
 };
 try{
   assert.equal(catalogueDynamic,'force-dynamic');assert.equal(detailDynamic,'force-dynamic');assert.equal(homeDynamic,'force-dynamic');
   const all=await Catalogue({searchParams:Promise.resolve({})});assert.deepEqual(all.props.offers.map((o:{slug:string})=>o.slug),['generic','family','cruise']);
   const inclusive=await Catalogue({searchParams:Promise.resolve({type:'all-inclusive'})});assert.deepEqual(inclusive.props.offers.map((o:{slug:string})=>o.slug),['generic']);
   const family=await Category({params:Promise.resolve({slug:'family'})});assert.deepEqual(family.props.offers.map((o:{slug:string})=>o.slug),['family']);
   const cruises=await Category({params:Promise.resolve({slug:'cruises'})});assert.deepEqual(cruises.props.offers.map((o:{slug:string})=>o.slug),['cruise']);
   const detail=await Detail({params:Promise.resolve({slug:'generic'})});assert.ok(detail);
   const home=await Home();const children=home.props.children as {props:{offers?:{slug:string}[]}}[];assert.deepEqual(children.find(c=>c.props.offers)?.props.offers?.map(o=>o.slug),['generic']);
   available=[];const fresh=await Catalogue({searchParams:Promise.resolve({})});assert.equal(fresh.props.offers.length,0);const homeAfter=await Home();assert.equal((homeAfter.props.children as {props:{offers?:unknown[]}}[]).find(c=>c.props.offers)?.props.offers?.length,0);assert.ok(cacheModes.every(v=>v==='no-store'));
   await assert.rejects(Detail({params:Promise.resolve({slug:'draft-or-expired'})}),/NEXT_HTTP_ERROR_FALLBACK;404/);
   gate=false;await assert.rejects(Catalogue({searchParams:Promise.resolve({})}),/NEXT_HTTP_ERROR_FALLBACK;404/);await assert.rejects(Detail({params:Promise.resolve({slug:'generic'})}),/NEXT_HTTP_ERROR_FALLBACK;404/);
   const route=await readFile('src/app/api/cms/holiday-offers/route.ts','utf8');for(const path of ["'/'","'/holiday-offers'","'/holidays'","'/sitemap.xml'","'/holiday-offers/[slug]'","'/holidays/[slug]'"])assert.ok(route.includes(path));
 }finally{globalThis.fetch=original;keys.forEach((k,i)=>{if(before[i]===undefined)delete process.env[k];else process.env[k]=before[i];});}
});
