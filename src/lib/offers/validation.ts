import { offerInput, offerSlug, duration, ukToday } from "./schema";
import type { PublicSupplier } from "./schema";
import { cleanHtml } from "@/lib/articles/html";
import { ArticleError } from "@/lib/articles/client";
export function prepareOffer(input: unknown, today = ukToday()) {
  const p = offerInput.safeParse(input);
  if (!p.success) throw new ArticleError(p.error.issues.map(i => i.message).join(" "));
  const o = p.data;
  o.slug ||= o.title ? offerSlug(o.title) : "holiday-"+crypto.randomUUID().slice(0,8); o.body = cleanHtml(o.body);
  o.holiday_type_ids = [...new Set(o.holiday_type_ids)];
  if (o.departure_date && o.return_date) {
    o.nights = duration(o.departure_date, o.return_date);
    if (o.nights < 0 || o.nights > 730) throw new ArticleError("Check the departure and return dates.");
  }
  if (o.status === "published") {
    const missing = [];
    if (!o.title) missing.push("holiday title"); if (!o.supplier_id) missing.push("Approved supplier");
    if (!o.country) missing.push("destination country"); if (!o.summary) missing.push("short description");
    if (!o.departure_date || o.departure_date < today) missing.push("current/future departure date");
    if (o.nights === null || o.nights < 0) missing.push("return date or number of nights"); if (o.adults < 1) missing.push("at least one adult");
    if (o.child_ages.length && o.children !== o.child_ages.length) missing.push("an age for each priced child");
    if (!o.total_price_minor) missing.push("total party price");
    if (!o.price_checked_on || o.price_checked_on > today) missing.push("price-check date (today or earlier)");
    if (o.flights_included && !o.departure_point) missing.push("departure airport");
    if (!o.inclusions) missing.push("what is included");
    if (o.booking_deadline && o.booking_deadline < today) missing.push("a promotion deadline that has not passed");
    if (o.sash === "adults-only" && (!o.adults_only_confirmed || o.children)) missing.push("confirmed adults-only arrangements with no children in the priced party");
    if (o.protection === "supplier-atol" && !o.flights_included) missing.push("flights included for the claimed ATOL arrangements");
    if (o.protection === "other" && !o.protection_note) missing.push("the confirmed protection arrangements");
    if (missing.length) throw new ArticleError("Before publishing, add/check: " + missing.join(", ") + ".");
  }
  return o;
}
export function supplierPublicationIssue(s: PublicSupplier & {status?: string; archived?: boolean}, atol = false) {
  const missing = [!s.legal_name && "legal/trading name", !s.business_address && "public business address", !(s.contact_email || s.contact_url) && "public contact details", !s.booking_conditions_url && "booking conditions URL", atol && !(s.atol_holder && s.atol_number) && "applicable ATOL holder/number"].filter(Boolean);
  return s.status !== "approved" || s.archived ? "Choose an active Approved supplier." : missing.length ? "Complete the supplier record's " + missing.join(", ") + "; the details are reused automatically." : "";
}
