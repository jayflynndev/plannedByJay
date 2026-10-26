import { z } from "zod";
import { imagePath, slugWords } from "@/lib/articles/schema";
export const sashLabels = {"": "None", "jays-pick": "Jay's Pick", "leaving-soon": "Leaving Soon", "deal-of-month": "Deal of the Month", "family-favourite": "Family Favourite", "adults-only": "Adults Only", "something-different": "Something Different"} as const;
export const travelLabels = {package: "Package holiday", "fly-cruise": "Fly-cruise", "cruise-only": "Cruise only", "hotel-only": "Hotel only", tour: "Tour", rail: "Rail holiday", other: "Other"} as const;
const date = z.union([z.literal(""), z.iso.date()]).default("");
export const offerInput = z.object({
  id: z.uuid().nullable().default(null), version: z.number().int().nonnegative().default(0),
  supplier_id: z.uuid().nullable().default(null),
  title: z.string().trim().max(180).default(""), slug: z.string().max(60).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/).default(""),
  country: z.string().trim().max(100).default(""), resort: z.string().trim().max(160).default(""), accommodation: z.string().trim().max(200).default(""),
  summary: z.string().trim().max(500).default(""), body: z.string().max(150000).default(""), why_jay: z.string().trim().max(500).default(""),
  travel_type: z.enum(["package", "fly-cruise", "cruise-only", "hotel-only", "tour", "rail", "other"]).default("package"),
  flights_included: z.boolean().default(false), departure_point: z.string().trim().max(160).default(""),
  departure_date: date, return_date: date, nights: z.number().int().min(0).max(730).nullable().default(null),
  board_basis: z.string().trim().max(120).default(""), room_type: z.string().trim().max(160).default(""),
  adults: z.number().int().min(0).max(50).default(2), children: z.number().int().min(0).max(20).default(0),
  child_ages: z.array(z.number().int().min(0).max(17)).max(20).default([]),
  inclusions: z.string().trim().max(5000).default(""), exclusions: z.string().trim().max(5000).default(""),
  total_price_minor: z.number().int().min(1).max(1000000000).nullable().default(null),
  currency: z.enum(["GBP", "EUR", "USD"]).default("GBP"), show_per_person: z.boolean().default(false),
  price_checked_on: date, booking_deadline: date, mandatory_charges: z.string().trim().max(2000).default(""),
  featured_image: z.union([z.literal(""), imagePath]).default(""), featured_alt: z.string().trim().max(300).default(""),
  gallery: z.array(z.object({path: imagePath, alt: z.string().trim().max(300)}).strict()).max(8).default([]),
  holiday_type_ids: z.array(z.uuid()).max(30).default([]),
  sash: z.enum(["", "jays-pick", "leaving-soon", "deal-of-month", "family-favourite", "adults-only", "something-different"]).default(""),
  adults_only_confirmed: z.boolean().default(false), featured: z.boolean().default(false),
  protection: z.enum(["", "supplier-atol", "other"]).default(""), protection_note: z.string().trim().max(2000).default(""),
  status: z.enum(["draft", "published"]).default("draft"),
}).strict();
export type OfferInput = z.output<typeof offerInput>;
export type Offer = OfferInput & {id: string; reference: string; archived: boolean; created_at: string; updated_at: string; published_at: string | null};
export type PublicSupplier = {id: string; name: string; website: string; legal_name: string; business_address: string; contact_email: string; contact_url: string; booking_conditions_url: string; atol_holder: string; atol_number: string};
export type PublicOffer = Offer & {supplier: PublicSupplier; image: string | null; galleryImages: {src: string; alt: string}[]};
export const emptyOffer = () => offerInput.parse({});
export const offerSlug = (title: string) => slugWords(title).slice(0, 60).replace(/-$/, "") || "holiday";
export function ukToday(now = new Date()) {return new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit"}).format(now);}
export function duration(start: string, end: string) {return Math.round((Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 86400000);}
export function money(minor: number | null, currency = "GBP") {return new Intl.NumberFormat("en-GB", {style: "currency", currency}).format((minor || 0) / 100);}
export function averagePrice(o: OfferInput) {const count = o.adults + o.children; return o.show_per_person && !o.children && count > 0 && o.total_price_minor && o.total_price_minor % count === 0 ? o.total_price_minor / count : null;}
export function displayedSash(o: OfferInput, today = ukToday()) {
  if (o.sash === "adults-only" && (!o.adults_only_confirmed || o.children > 0)) return "";
  if (o.sash === "leaving-soon" && (!o.departure_date || duration(today, o.departure_date) < 0 || duration(today, o.departure_date) > 30)) return "";
  return sashLabels[o.sash];
}
export type OfferQuery = {destination: string; type: string; month: string; sort: "departure" | "price"; page: number};
export const emptyOfferQuery: OfferQuery = {destination: "", type: "", month: "", sort: "departure", page: 1};
export function offerQuery(raw: Record<string, unknown> = {}): OfferQuery {
  return {destination: typeof raw.destination === "string" ? raw.destination.trim().slice(0,100) : "", type: z.uuid().safeParse(raw.type).success ? String(raw.type) : "", month: typeof raw.month === "string" && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(raw.month) ? raw.month : "", sort: raw.sort === "price" ? "price" : "departure", page: Math.max(1, Math.min(1000, Math.trunc(Number(raw.page) || 1)))};
}
export function offerListHref(query: OfferQuery, page = query.page) {const p = new URLSearchParams(); for (const [k,v] of Object.entries({...query,page})) if (v && !(k === "page" && v === 1) && !(k === "sort" && v === "departure")) p.set(k,String(v)); return "/holiday-offers" + (p.size ? "?" + p : "");}
