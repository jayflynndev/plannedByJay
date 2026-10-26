import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { offerFixture,offerSql } from "./helpers/offer-fixture";
import { prepareOffer } from "../src/lib/offers/validation";
import { emptyOffer,averagePrice,displayedSash,offerQuery } from "../src/lib/offers/schema";
import { offerEnquiryAvailability } from "../src/lib/offers/enquiries";
import { duplicateInput,offerRecord } from "../src/lib/offers/data";
import { sendOfferNotification } from "../src/lib/offers/notifications";
test("one offers migration supports private drafts, atomic multi-type saves, stable URLs, eligibility and private enquiry snapshots",async()=>{
  const {db,admin,other,run,sample,save,supplierId,dates}=await offerFixture();
  const publicList=async(params:unknown[]=[]) => (await db.query<{result:{offers:Record<string,unknown>[];total:number}}>("select public.public_holiday_offers() result",params)).rows[0].result;
  try {
    await db.exec(await offerSql());
    const draft=await save();assert.equal(draft.status,"draft");
    assert.equal((await run("anon","","select * from public.holiday_offers")).rows.length,0);
    assert.equal((await publicList()).total,0);
    await assert.rejects(run("authenticated",other,"select public.save_holiday_offer($1,$2)",[sample,[]]),/Administrator/);
    const published=await save({...sample,id:String(draft.id),version:Number(draft.version),status:"published",featured:true});
    assert.ok(published.published_at);assert.equal((await publicList()).total,1);
    const types=await run("anon","","select * from public.offer_holiday_types");assert.equal(types.rows.length,2);
    const raw=(await publicList()).offers[0];
    assert.equal((raw.supplier as Record<string,unknown>).name,"Jet2holidays");assert.equal((raw.supplier as Record<string,unknown>).atol_number,"");
    await assert.rejects(run("anon","","select * from public.suppliers"),/permission denied/);
    for(const type of sample.holiday_type_ids){const r=await db.query<{r:{total:number}}>("select public.public_holiday_offers(p_type:=$1) r",[type]);assert.equal(r.rows[0].r.total,1);}
    await assert.rejects(save({...sample,id:String(published.id),version:Number(draft.version),status:"draft"}),/changed elsewhere/);
    await assert.rejects(run("authenticated",admin,"update public.holiday_offers set slug='changed' where id=$1",[published.id]),/permanent/);
    await assert.rejects(run("authenticated",admin,"delete from public.holiday_offers where id=$1",[published.id]),/permission denied/);
    assert.equal((await db.query<{r:{total:number}}>("select public.public_holiday_offers(p_featured:=true) r")).rows[0].r.total,1);
    await run("authenticated",admin,"update public.holiday_offers set featured=false where id=$1",[published.id]);
    assert.equal((await db.query<{r:{total:number}}>("select public.public_holiday_offers(p_featured:=true) r")).rows[0].r.total,0);
    const request=randomUUID(),hash="a".repeat(64);
    await assert.rejects(run("anon","","select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7)",[request,published.id,"Fixture customer","customer@example.org","","A fixture question",hash]),/permission denied/);
    const send=(token:string)=>db.query<{id:string}>("select public.receive_offer_enquiry($1,$2,$3,$4,$5,$6,$7) id",[token,published.id,"Fixture customer","customer@example.org","","A fixture question",hash]);
    const enquiry=(await send(request)).rows[0].id;assert.equal((await send(request)).rows[0].id,enquiry);
    await run("authenticated",admin,"update public.holiday_offers set title='A later correction',total_price_minor=260000 where id=$1",[published.id]);
    const snapshot=(await db.query<{offer_snapshot:{title:string;total_price_minor:number;supplier:{name:string};adults:number}}>("select offer_snapshot from public.offer_enquiries where id=$1",[enquiry])).rows[0].offer_snapshot;
    assert.equal(snapshot.title,sample.title);assert.equal(snapshot.total_price_minor,240000);assert.equal(snapshot.supplier.name,"Jet2holidays");assert.equal(snapshot.adults,2);
    await assert.rejects(run("anon","","select * from public.offer_enquiries"),/permission denied/);
    assert.equal((await run("authenticated",other,"select * from public.offer_enquiries")).rows.length,0);
    assert.equal((await run("authenticated",admin,"select * from public.offer_enquiries")).rows.length,1);
    await send(randomUUID());await send(randomUUID());await assert.rejects(send(randomUUID()),/wait/);
    await run("authenticated",admin,"update public.suppliers set archived=true where id=$1",[supplierId]);assert.equal((await publicList()).total,0);
    await run("authenticated",admin,"update public.suppliers set archived=false where id=$1",[supplierId]);
    await run("authenticated",admin,"update public.holiday_offers set archived=true where id=$1",[published.id]);assert.equal((await publicList()).total,0);
    await run("authenticated",admin,"update public.holiday_offers set archived=false,status='draft' where id=$1",[published.id]);assert.equal((await publicList()).total,0);
    const future=await save({...sample,slug:"expired-fixture",booking_deadline:dates.today,status:"published"});
    // Use a fixture-only clock-independent row update after disabling this fixture's trigger.
    await db.exec("alter table public.holiday_offers disable trigger holiday_offer_dates");
    await db.query("update public.holiday_offers set booking_deadline='2000-01-01' where id=$1",[future.id]);
    assert.equal((await publicList()).total,0);
    assert.equal((await db.query<{count:number}>("select count(*)::int count from public.holiday_types")).rows[0].count,6);
  }finally{await db.close();}
});
test("offer preparation calculates dates, permits incomplete drafts and controls price/claim display without blanket protection",()=>{
  assert.equal(prepareOffer({}).status,"draft");
  const o=prepareOffer({...emptyOffer(),departure_date:"2099-01-01",return_date:"2099-01-08"});assert.equal(o.nights,7);
  assert.throws(()=>prepareOffer({...emptyOffer(),status:"published"}),/Before publishing/);
  assert.equal(averagePrice({...o,total_price_minor:240000,show_per_person:true}),120000);
  assert.equal(averagePrice({...o,total_price_minor:240000,children:1,show_per_person:true}),null);
  assert.equal(displayedSash({...o,sash:"leaving-soon"},"2098-01-01"),"");
  assert.equal(displayedSash({...o,sash:"leaving-soon"},"2098-12-20"),"Leaving Soon");
  assert.equal(displayedSash({...o,sash:"adults-only"}),"");
  assert.equal(offerQuery({type:"../private",month:"2026-99",sort:"injection"}).sort,"departure");
  assert.equal(offerEnquiryAvailability().enabled,false);
  const copy=duplicateInput(offerRecord({...o,id:"60000000-0000-4000-8000-000000000001",title:"Original",slug:"original",featured:true,status:"published",price_checked_on:"2098-12-01",published_at:"2098-12-01"}));
  assert.equal(copy.id,null);assert.equal(copy.status,"draft");assert.equal(copy.featured,false);assert.equal(copy.price_checked_on,"");assert.notEqual(copy.slug,"original");
});

test("existing Resend notification uses a fixed business recipient, stored snapshot and stable idempotency key",async()=>{
  const keys=["RESEND_API_KEY","ENQUIRY_EMAIL_FROM","ENQUIRY_EMAIL_TO"],old=keys.map(k=>process.env[k]);
  Object.assign(process.env,{RESEND_API_KEY:"fixture-key",ENQUIRY_EMAIL_FROM:"Fixture sender <sender@example.org>",ENQUIRY_EMAIL_TO:"jay@plannedbyjay.com"});
  const enquiry={id:"70000000-0000-4000-8000-000000000001",name:"Fixture customer",email:"customer@example.org",phone:"",message:"A fixture question",offer_snapshot:{reference:"PBJ-FIXTURE",title:"Stored title",supplier:{name:"Stored supplier"},total_price_minor:240050,currency:"GBP",adults:2,children:0}};
  let calls=0;
  const sender:typeof fetch=async(url,init)=>{calls++;assert.equal(String(url),"https://api.resend.com/emails");assert.equal(new Headers(init?.headers).get("Idempotency-Key"),"offer-enquiry/"+enquiry.id);const body=JSON.parse(String(init?.body));assert.deepEqual(body.to,["jay@plannedbyjay.com"]);assert.equal(body.reply_to,enquiry.email);assert.match(body.text,/Stored title/);assert.match(body.text,/2400.5/);return Response.json({id:"fixture-notification"});};
  try{
    assert.equal(await sendOfferNotification(enquiry,sender),"fixture-notification");
    process.env.ENQUIRY_EMAIL_TO="wrong@example.org";
    await assert.rejects(sendOfferNotification(enquiry,sender),/unavailable/);assert.equal(calls,1);
    process.env.ENQUIRY_EMAIL_TO="jay@plannedbyjay.com";
    await assert.rejects(sendOfferNotification(enquiry,async()=>Response.json({error:"fixture"},{status:503})),/not accepted/);
  }finally{keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});}
});
