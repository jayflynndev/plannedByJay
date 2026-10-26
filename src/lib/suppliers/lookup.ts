import "server-only";
import { bodyText } from "@/lib/articles/html";
import { webUrl, supplierFields, type SupplierField } from "./schema";
import { readPublicPage, lookupUrl } from "./public-page";

export type Suggestion = {field: SupplierField; value: string; url: string; kind: "official" | "suggested"};
export type SupplierMatch = {name: string; suggestions: Suggestion[]};
export type LookupResult = {matches: SupplierMatch[]; message: string};
const website = "https://www.jet2holidays.com";
const terms = website + "/terms-and-conditions";
const contact = website + "/contact-us";
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const text = (html: string) => bodyText(html.replace(/<\/?(?:p|div|br|h[1-6]|li|section|address)\b[^>]*>/gi, " "));
function value(v: unknown, max = 2000) {return typeof v === "string" ? text(v).slice(0, max).trim() : "";}
function link(v: unknown, base: string) {
  try {const url = new URL(String(v), base); return webUrl.safeParse(url.href).success && url.origin === new URL(base).origin ? url.href : "";}
  catch {return "";}
}
function suggestionsForObject(org: Record<string, unknown>, page: string, kind: Suggestion["kind"]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const add = (field: SupplierField, v: string) => {if (v) suggestions.push({field, value: v, url: page, kind});};
  add("website", new URL(page).origin);
  add("legal_name", value(org.legalName, 200));
  const contactPoints = Array.isArray(org.contactPoint) ? org.contactPoint : [org.contactPoint];
  const point = contactPoints.find(p => p && typeof p === "object" && /^(?:customer service|customer support|general|contact)?$/i.test(String(p.contactType || ""))) as Record<string, unknown> | undefined;
  const email = value(org.email || point?.email, 320).replace(/^mailto:/i, "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) add("contact_email", email);
  // An unlabelled Organisation address may just be its registered office. Only
  // an explicit contact-point address is offered as a public contact address.
  const address = point?.address;
  if (address && typeof address === "object" && !Array.isArray(address)) {
    const a = address as Record<string, unknown>;
    if (!/registered/i.test(value(a.name))) add("business_address", [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, a.addressCountry].map(x => value(x)).filter(Boolean).join(", ").slice(0, 1000));
  }
  add("contact_url", point?.url ? link(point.url, page) : "");
  return suggestions;
}
export function structuredMatches(html: string, page: string, kind: Suggestion["kind"] = "suggested"): SupplierMatch[] {
  const organisations: Record<string, unknown>[] = [];
  function collect(node: unknown, depth = 0) {
    if (!node || depth > 8 || organisations.length >= 20) return;
    if (Array.isArray(node)) {for (const child of node.slice(0, 40)) collect(child, depth + 1); return;}
    if (typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
    if (types.some(t => /^(?:Organization|Corporation|TravelAgency|Airline|LocalBusiness)$/i.test(String(t))) && (obj.name || obj.legalName)) organisations.push(obj);
    for (const key of ["@graph", "parentOrganization", "subOrganization", "department"]) collect(obj[key], depth + 1);
  }
  for (const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    if (script[1].length > 250000) continue;
    try {collect(JSON.parse(script[1]));} catch { /* Invalid structured data is ignored. */ }
  }
  const matches: SupplierMatch[] = [];
  for (const org of organisations) {
    const name = value(org.legalName || org.name, 200);
    if (matches.some(m => normalise(m.name) === normalise(name))) continue;
    matches.push({name, suggestions: suggestionsForObject(org, page, kind)});
  }
  const pageLinks: Suggestion[] = [];
  for (const a of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/gi)) {
    const label = text(a[2]), url = link(a[1].replace(/&amp;/g, "&"), page);
    if (!url) continue;
    const field = /^(?:contact(?: us)?|customer services?)$/i.test(label) ? "contact_url" : /^(?:booking (?:conditions|terms)|terms and conditions)$/i.test(label) ? "booking_conditions_url" : null;
    if (field && !pageLinks.some(s => s.field === field)) pageLinks.push({field, value: url, url: page, kind: field === "booking_conditions_url" && !/booking/i.test(label) ? "suggested" : kind});
  }
  // A page with no organisation data can still offer its own website/contact links.
  if (!matches.length) matches.push({name: "Details from supplied website", suggestions: [{field: "website", value: new URL(page).origin, url: page, kind}, ...pageLinks]});
  else for (const match of matches) for (const suggestion of pageLinks) if (!match.suggestions.some(s => s.field === suggestion.field)) match.suggestions.push(suggestion);
  return matches;
}

export async function findSupplierDetails(name: string, suppliedWebsite = "", read = readPublicPage): Promise<LookupResult> {
  const key = normalise(name);
  if (!suppliedWebsite && key === "jet2") return {
    matches: [
      {name: "Jet2holidays (holidays)", suggestions: [{field: "website", value: website, url: website, kind: "suggested"}]},
      {name: "Jet2.com (airline)", suggestions: [{field: "website", value: "https://www.jet2.com", url: "https://www.jet2.com", kind: "suggested"}]},
    ], message: "Jet2 can mean different businesses. Choose the correct website, accept it, then look up that business. No legal entity has been selected.",
  };
  const known = ["jet2holidays", "jet2holidayslimited"].includes(key);
  let input = suppliedWebsite || (known ? website : "");
  if (!input) return {matches: [], message: "No reliable name-only match is available. Enter the supplier's official HTTPS website and try again, or complete the form manually. This lookup has no general internet-search service."};
  const url = lookupUrl(input);
  const officialJet2 = /^(?:www\.)?jet2holidays\.com$/.test(url.hostname) && (known || key === "jet2");
  if (officialJet2) input = terms;
  try {
    const pages = await Promise.allSettled((officialJet2 ? [terms, contact] : [input]).map(read));
    const successful = pages.flatMap(p => p.status === "fulfilled" ? [p.value] : []);
    if (!successful.length) throw new Error("The website could not be read, or it blocked automated access.");
    if (officialJet2) {
      const suggestions: Suggestion[] = [{field: "website", value: website, url: successful[0].url, kind: "official"},
        {field: "specialism", value: "Package Holidays", url: website, kind: "suggested"}];
      const conditions = successful.find(p => p.url === terms);
      const contactPage = successful.find(p => p.url === contact);
      if (conditions) {
        const plain = text(conditions.html);
        const legal = plain.match(/trading names of\s+(Jet2holidays Limited)\b/i)?.[1];
        if (legal) suggestions.push({field: "legal_name", value: legal, url: terms, kind: "official"});
        const number = plain.match(/We hold an Air Travel Organiser[’']s Licence\s*\(ATOL number\s+(\d{4,5})\)/i)?.[1];
        if (legal && number) suggestions.push({field: "atol_holder", value: legal, url: terms, kind: "official"}, {field: "atol_number", value: number, url: terms, kind: "official"});
        if (/booking conditions/i.test(plain)) suggestions.push({field: "booking_conditions_url", value: terms, url: terms, kind: "official"});
      }
      if (contactPage && /get in touch|contact us/i.test(text(contactPage.html))) suggestions.push({field: "contact_url", value: contact, url: contact, kind: "official"});
      return {matches: [{name: "Jet2holidays", suggestions}], message: "Available details were read from Jet2holidays' official pages. Missing address/email fields are left blank. ATOL information is supplier-stated; current CAA licence status has not been checked."};
    }
    const matches = structuredMatches(successful[0].html, successful[0].url);
    return {matches, message: "Suggestions come from the supplied website's structured organisation data and contact/terms links. Confirm that this is the correct official supplier website and legal entity. No authoritative register or current CAA licence status has been checked."};
  } catch {
    return {matches: [{name, suggestions: [{field: "website", value: url.origin, url: url.href, kind: "suggested"}]}], message: "The website could not be read or did not allow this lookup. Only its website address is suggested; legal, contact and regulatory details were not checked. You can complete the form manually."};
  }
}

// Per-process, per-admin throttle. No extra database or research-history infrastructure.
const requests = new Map<string, number[]>();
export function allowSupplierLookup(id: string, now = Date.now()) {
  const recent = (requests.get(id) || []).filter(t => now - t < 60000);
  if (recent.length >= 6) return false;
  requests.set(id, [...recent, now]);
  for (const [key, times] of requests) if (now - times.at(-1)! >= 60000) requests.delete(key);
  return true;
}
export const lookupFields = Object.keys(supplierFields) as SupplierField[];
