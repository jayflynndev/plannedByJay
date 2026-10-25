import {z} from 'zod';
import {slugify} from '@/lib/cms/schema';
import {durationBetween,todayUK} from './editor';
export const offerStatuses=['draft','published','paused','expired','archived'] as const;
export const travelTypes=['package','cruise-only','fly-cruise','hotel-only','tour','rail'] as const;
export const offerReference=z.string().regex(/^PBJO-[A-F0-9]{8}$/);
const text=(n=500)=>z.string().trim().max(n);
const date=z.union([z.literal(''),z.iso.date()]);
const timestamp=z.union([z.literal(''),z.iso.datetime({offset:true})]);
const url=z.union([z.literal(''),z.url({protocol:/^https$/})]);
// Public facts only: private permission evidence remains in cms_private.
export const supplierDisclosures=z.object({legal_name:text(200).default(''),business_address:text(1000).default(''),service_address:text(1000).default(''),public_contact:text(500).default(''),official_website:url.default(''),booking_conditions_url:url.default(''),atol_holder:text(200).default(''),atol_number:z.string().regex(/^(?:T?\d{4,5})?$/).default(''),protection_information:text(3000).default(''),atol_artwork:z.string().max(300).regex(/^(?:\/images\/[a-zA-Z0-9/_.-]+)?$/).default('')}).strict();
// Retired permission dates, lookup state and evidence remain in the private database,
// not in the ordinary form or its validation. A known restriction is still honoured.
export const supplierInput=z.object({id:z.uuid().nullable().default(null),revision:z.number().int().nonnegative().default(0),name:text(80).min(1),display_name:text(80).default(''),website:url.default(''),specialism:text(120).default(''),disclosures:supplierDisclosures.default(()=>supplierDisclosures.parse({})),archived:z.boolean().default(false),restricted:z.boolean().default(false),atol_verified:z.boolean().default(false),private_reference:text(15000).default(''),notes:text(10000).default('')}).strict().superRefine((s,c)=>{if(s.atol_verified&&(!s.disclosures.atol_holder||!s.disclosures.atol_number))c.addIssue({code:'custom',message:'Enter the checked ATOL holder and number, or leave ATOL unchecked.'});});
export type SupplierInput=z.input<typeof supplierInput>;
export type Supplier=z.output<typeof supplierInput>&{id:string;revision:number};
export const offerDetails=z.object({flight_inclusive:z.enum(['pending','yes','no']).default('pending'),atol_status:z.enum(['pending','applicable','not-applicable']).default('pending'),classification_reason:text(1000).default(''),nonflight_protection:text(3000).default(''),adults:z.string().regex(/^(?:[1-9][0-9]?)?$/).default(''),children:z.string().regex(/^(?:[0-9]|[1-9][0-9])?$/).default(''),full_price_confirmed:z.enum(['pending','confirmed']).default('pending'),uncalculable_charges:text(2000).default(''),promotion_conditions:text(3000).default(''),booking_conditions:text(3000).default(''),country:text(100).default(''),region:text(120).default(''),accommodation:text(180).default(''),summary:text(500).default(''),description:text(15000).default(''),departure_point:text(150).default(''),departure_date:date.default(''),return_date:date.default(''),nights:z.number().int().min(0).max(365).nullable().default(null),travel_type:z.enum(travelTypes).default('package'),board_basis:text(150).default(''),room_type:text(200).default(''),occupancy:text(500).default(''),inclusions:text(3000).default(''),exclusions:text(3000).default(''),accessibility:text(2000).default(''),unavoidable_charges:text(1500).default(''),optional_extras:text(1500).default(''),price_checked_at:timestamp.default(''),last_verified_at:timestamp.default(''),promotion_expires_at:timestamp.default('')}).strict();
export const offerPrivate=z.object({source_url:url.default(''),agent_reference:text(200).default(''),source_price:text(1000).default(''),original_details:text(15000).default(''),notes:text(10000).default('')}).strict();
export const offerInput=z.object({id:z.uuid().nullable().default(null),revision:z.number().int().nonnegative().default(0),title:text(180).default(''),slug:z.string().max(140).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/).default(''),supplier_id:z.uuid().nullable().default(null),status:z.enum(offerStatuses).default('draft'),holiday_types:z.array(z.enum(['family','cruises','couples','city-breaks','something-different','accessible'])).max(6).refine(v=>new Set(v).size===v.length).default([]),tag_ids:z.array(z.uuid()).max(8).refine(v=>new Set(v).size===v.length).default([]),details:offerDetails.default(()=>offerDetails.parse({})),price_minor:z.number().int().min(1).max(100000000).nullable().default(null),currency:z.enum(['GBP','EUR','USD']).default('GBP'),price_basis:z.enum(['per-person','total-party']).default('per-person'),price_people:z.number().int().min(1).max(99).nullable().default(null),featured_media_id:z.uuid().nullable().default(null),featured_alt:text(300).default(''),gallery:z.array(z.object({media_id:z.uuid(),alt:text(300).min(1)}).strict()).max(8).default([]),featured:z.boolean().default(false),publication_approved:z.boolean().default(false),expires_at:timestamp.default(''),private:offerPrivate.default(()=>offerPrivate.parse({}))}).strict();
export type OfferInput=z.output<typeof offerInput>;
export type AdminOffer=OfferInput&{id:string;reference:string;created_at:string;updated_at:string};
export function emptyOffer(){return offerInput.parse({});}
export function adminOffer(raw:Record<string,unknown>):AdminOffer{const keys=Object.keys(emptyOffer());const selected=Object.fromEntries(keys.map(key=>[key,raw[key]]));return {...offerInput.parse({...selected,slug:raw.slug||'',expires_at:raw.expires_at||''}),reference:String(raw.reference),id:String(raw.id),created_at:String(raw.created_at),updated_at:String(raw.updated_at)};}
export function duplicateOffer(original:OfferInput):OfferInput{const fields=Object.fromEntries(Object.keys(emptyOffer()).map(key=>[key,original[key as keyof OfferInput]]));return offerInput.parse({...fields,id:null,revision:0,status:'draft',slug:'',featured:false,publication_approved:false,expires_at:'',details:{...original.details,price_checked_at:'',last_verified_at:''}});}
export function prepareOffer(value:OfferInput,status:OfferInput['status']):OfferInput{const fields=Object.fromEntries(Object.keys(emptyOffer()).map(k=>[k,value[k as keyof OfferInput]])) as OfferInput;return {...fields,status,slug:value.slug||slugify(value.title),publication_approved:status==='published',price_people:value.details.adults&&value.details.children!==''?Number(value.details.adults)+Number(value.details.children):value.price_people,details:{...value.details,summary:value.details.summary||value.details.description.slice(0,500),occupancy:value.details.occupancy||(value.details.adults&&value.details.children!==''?`${value.details.adults} adults, ${value.details.children} children`:''),atol_status:value.details.flight_inclusive==='yes'?'applicable':value.details.flight_inclusive==='no'?'not-applicable':'pending'}};}
export function publicationIssues(offer:OfferInput,now=Date.now()):string[]{
  if(offer.status!=='published')return [];
  const d=offer.details,issues:string[]=[...disclosureIssues(offer)];
  for(const [name,value] of Object.entries({title:offer.title,slug:offer.slug,supplier:offer.supplier_id,destination:d.country,description:d.description,inclusions:d.inclusions,occupancy:d.occupancy}))if(!value)issues.push(`Complete ${name} before publishing.`);
  for(const [name,missing] of Object.entries({'holiday categories':!offer.holiday_types.length,'advertised full price':!offer.price_minor,'priced party':!offer.price_people,'number of nights':d.nights===null,'featured photograph':!offer.featured_media_id,'photograph description':!offer.featured_alt}))if(missing)issues.push(`Complete ${name} before publishing.`);
  if(!d.departure_date)issues.push('Enter the travel date.');
  if(d.travel_type!=='hotel-only'&&!d.departure_point)issues.push('Enter the departure airport, port or location.');
  if(d.departure_date&&d.departure_date<todayUK(new Date(now)))issues.push('The travel date is in the past.');
  if(d.return_date&&(durationBetween(d.departure_date,d.return_date)===null||durationBetween(d.departure_date,d.return_date)!==d.nights))issues.push('Check the return date and number of nights.');
  const checked=Date.parse(d.price_checked_at);
  if(!Number.isFinite(checked)||d.price_checked_at.slice(0,10)>todayUK(new Date(now)))issues.push('Enter the date the price was checked (not a future date).');
  if(d.promotion_expires_at&&Date.parse(d.promotion_expires_at)<=now)issues.push('The supplier booking deadline has passed.');
  return issues;
}
export function priceLabel(offer:{price_minor:number|null;currency:string;price_basis:string;price_people:number|null}){return `${new Intl.NumberFormat('en-GB',{style:'currency',currency:offer.currency}).format((offer.price_minor||0)/100)} ${offer.price_basis==='per-person'?'per person':'total party'} · based on ${offer.price_people} ${offer.price_people===1?'person':'people'}`;}
// A booking deadline is not a claim of present availability. Historical expiry and
// seven-day check timestamps no longer control public eligibility.
export function isCurrentOffer(offer:{status:string;expires_at?:string|null;details:z.output<typeof offerDetails>},now=Date.now()){const d=offer.details;return offer.status==='published'&&d.departure_date>=todayUK(new Date(now))&&!!d.price_checked_at&&Number.isFinite(Date.parse(d.price_checked_at))&&d.price_checked_at.slice(0,10)<=todayUK(new Date(now))&&(!d.promotion_expires_at||Date.parse(d.promotion_expires_at)>now);}
export function disclosureIssues(offer:OfferInput,supplier?:Supplier):string[]{
  const d=offer.details,issues:string[]=[];
  if(d.flight_inclusive==='pending')issues.push('Choose whether flights are included.');
  if(d.travel_type==='fly-cruise'&&d.flight_inclusive!=='yes')issues.push('Fly-cruise must include flights.');
  if(['cruise-only','hotel-only','rail'].includes(d.travel_type)&&d.flight_inclusive!=='no')issues.push('Use a flight-inclusive travel type if flights are included.');
  if(!d.adults||d.children===''||Number(d.adults)+Number(d.children)!==offer.price_people)issues.push('Check adults, children and priced occupancy.');
  if(supplier){const s=supplier.disclosures;
    if(supplier.archived||supplier.restricted)issues.push('This supplier is archived or restricted. Select another supplier or edit its directory record.');
    if(!s.legal_name||!s.business_address||!s.public_contact)issues.push('Complete the supplier company name, public address and contact details once in Suppliers.');
    if(d.flight_inclusive==='yes'&&(!supplier.atol_verified||!s.atol_holder||!s.atol_number||!s.protection_information))issues.push('Complete the checked ATOL holder/number and applicable protection wording once in Suppliers for this flight-inclusive offer.');
  }
  return issues;
}
export function partyTotal(offer:{price_minor:number|null;currency:string;price_basis:string;price_people:number|null}){return new Intl.NumberFormat('en-GB',{style:'currency',currency:offer.currency}).format((offer.price_minor||0)*(offer.price_basis==='per-person'?(offer.price_people||0):1)/100);}
