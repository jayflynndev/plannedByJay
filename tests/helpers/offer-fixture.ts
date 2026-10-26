import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { holidayFixture } from "./holiday-fixture";
import { emptyOffer } from "../../src/lib/offers/schema";
export const offerSql=()=>readFile("supabase/migrations/20261026_holiday_offers_cms.sql","utf8");
export async function offerFixture() {
  const fixture=await holidayFixture();const {db,run,admin}=fixture;
  await db.exec("create role service_role bypassrls");
  await db.exec(await readFile("supabase/migrations/20261026_suppliers_directory.sql","utf8"));
  await db.exec(await offerSql());
  const supplierId=randomUUID();
  await run("authenticated",admin,"insert into public.suppliers(id,name,legal_name,business_address,contact_url,booking_conditions_url,status,atol_holder,atol_number) values($1,'Jet2holidays','Synthetic fixture company','Synthetic fixture address','https://example.org/contact','https://example.org/booking-conditions','approved','Synthetic holder','1234')",[supplierId]);
  const dates=(await db.query<{today:string;departure:string;end:string}>("select ((now() at time zone 'Europe/London')::date)::text today,((now() at time zone 'Europe/London')::date+20)::text departure,((now() at time zone 'Europe/London')::date+27)::text as end")).rows[0];
  const sample={...emptyOffer(),supplier_id:supplierId,title:"Synthetic family holiday",slug:"synthetic-family-holiday",country:"Spain",resort:"Tenerife",accommodation:"Synthetic hotel",summary:"A controlled test fixture, never a live advertised offer.",body:"<h2>Holiday highlights</h2><p><strong>Useful details</strong></p>",departure_date:dates.departure,return_date:dates.end,nights:7,total_price_minor:240000,price_checked_on:dates.today,inclusions:"Fixture flights and accommodation",featured_image:"30000000-0000-4000-8000-000000000001-coast.webp",holiday_type_ids:["b0000000-0000-4000-8000-000000000001","b0000000-0000-4000-8000-000000000003"]};
  async function save(value=sample) {
    const {holiday_type_ids,...record}=value;const p:Record<string,unknown>={...record};for(const key of ["departure_date","return_date","price_checked_on","booking_deadline"])p[key] ||= null;
    return (await run<{offer:Record<string,unknown>}>("authenticated",admin,"select public.save_holiday_offer($1,$2) as offer",[p,holiday_type_ids])).rows[0].offer;
  }
  return {...fixture,supplierId,dates,sample,save};
}
