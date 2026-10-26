import test from "node:test";
import assert from "node:assert/strict";
import { offerFixture } from "./helpers/offer-fixture";
const marker=require.resolve("server-only");require.cache[marker]={exports:{},id:marker,filename:marker,loaded:true} as NodeModule;
test("eligible offers drive catalogue, filters, type pages, featured homepage, metadata and sitemap from one record",async()=>{
  const {db,run,admin,sample,save}=await offerFixture();
  const original=globalThis.fetch,keys=["SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY","SITE_URL"],old=keys.map(k=>process.env[k]);
  Object.assign(process.env,{SUPABASE_URL:"https://fixture.supabase.co",SUPABASE_PUBLISHABLE_KEY:"sb_publishable_fixture",SITE_URL:"https://plannedbyjay.com"});
  const requests:{url:URL;cache?:RequestCache}[]=[];
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input));requests.push({url,cache:init?.cache});
    if(url.pathname.endsWith("/rpc/public_holiday_offers")){
      const p=JSON.parse(String(init?.body));
      const r=await db.query<{result:unknown}>("select public.public_holiday_offers($1,$2,$3,$4,$5,$6,$7,$8) result",[p.p_destination,p.p_type,p.p_month,p.p_sort,p.p_featured,p.p_slug,p.p_offset,p.p_limit]);
      return Response.json(r.rows[0].result);
    }
    if(url.pathname.endsWith("holiday_types")){
      const slug=url.searchParams.get("slug")?.replace(/^eq\./,"");
      return Response.json((await run("anon","","select * from public.holiday_types"+(slug?" where slug=$1":"")+" order by display_order",slug?[slug]:[])).rows);
    }
    return Response.json([],{headers:{"Content-Range":"0-0/0"}});
  };
  try{
    const {default:Catalogue}=await import("../src/app/holiday-offers/page");
    const {default:Detail,generateMetadata}=await import("../src/app/holiday-offers/[slug]/page");
    const {default:Holiday}=await import("../src/app/holidays/[slug]/page");
    const {default:Home}=await import("../src/app/page");
    const {default:sitemap}=await import("../src/app/sitemap");
    const draft=await save();
    assert.equal((await Catalogue()).props.offers.length,0);
    await assert.rejects(Detail({params:Promise.resolve({slug:sample.slug})}),/NEXT_HTTP_ERROR_FALLBACK;404/);
    const published=await save({...sample,id:String(draft.id),version:Number(draft.version),status:"published",featured:true,sash:"jays-pick"});
    const catalogue=await Catalogue();assert.equal(catalogue.props.offers.length,1);
    assert.equal(catalogue.props.offers[0].supplier.name,"Jet2holidays");
    assert.equal((await Catalogue({searchParams:Promise.resolve({destination:"Missing"})})).props.offers.length,0);
    assert.equal((await Catalogue({searchParams:Promise.resolve({type:sample.holiday_type_ids[0]})})).props.offers.length,1);
    for(const slug of ["family","couples"])assert.equal((await Holiday({params:Promise.resolve({slug})})).props.offers.length,1);
    const page=await Detail({params:Promise.resolve({slug:sample.slug})});assert.ok(page);
    const meta=await generateMetadata({params:Promise.resolve({slug:sample.slug})});
    assert.equal(meta.alternates.canonical,"https://plannedbyjay.com/holiday-offers/"+sample.slug);assert.equal(meta.description,sample.summary);assert.ok(meta.openGraph.images);
    const home=await Home();assert.equal(home.props.children.find((c:{props:{offers?:unknown[]}})=>c.props.offers)?.props.offers.length,1);
    assert.ok((await sitemap()).some(s=>s.url.endsWith("/holiday-offers/"+sample.slug)));
    await run("authenticated",admin,"update public.holiday_offers set featured=false where id=$1",[published.id]);
    assert.equal((await Home()).props.children.find((c:{props:{offers?:unknown[]}})=>c.props.offers)?.props.offers.length,0);
    assert.equal((await Catalogue()).props.offers.length,1);
    await run("authenticated",admin,"update public.holiday_offers set status='draft' where id=$1",[published.id]);
    assert.equal((await Catalogue()).props.offers.length,0);
    await assert.rejects(generateMetadata({params:Promise.resolve({slug:sample.slug})}),/NEXT_HTTP_ERROR_FALLBACK;404/);
    assert.ok(!(await sitemap()).some(s=>s.url.endsWith("/holiday-offers/"+sample.slug)));
    assert.ok(requests.every(r=>r.cache==="no-store"));
  }finally{globalThis.fetch=original;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});await db.close();}
});
