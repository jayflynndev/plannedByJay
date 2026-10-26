import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArticleError } from "@/lib/articles/client";
import { supplierInput, type Supplier } from "./schema";

export const supplierProjection = "id,name,website,legal_name,business_address,contact_email,contact_url,atol_holder,atol_number,booking_conditions_url,specialism,status,archived,created_at,updated_at,version";
export function supplierRecord(raw: Record<string, unknown>): Supplier {
  return {...supplierInput.parse(Object.fromEntries(Object.keys(supplierInput.parse({name: "_"})).map(k => [k, raw[k]]))),
    id: String(raw.id), archived: raw.archived === true, created_at: String(raw.created_at), updated_at: String(raw.updated_at)};
}
export function supplierDatabaseError(error: {code?: string} | null) {
  if (!error) return;
  if (error.code === "23505") throw new ArticleError("A supplier with that name already exists. Search the directory, including archived suppliers, and edit or restore that record.", 409);
  if (error.code === "42501") throw new ArticleError("This account is not authorised to manage suppliers.", 403);
  throw new ArticleError("The supplier could not be saved. Your unsaved entries are retained; check the Suppliers SQL setup or try again.", 503);
}
export async function getSupplier(client: SupabaseClient, id: string) {
  const r = await client.from("suppliers").select(supplierProjection).eq("id", id).maybeSingle();
  supplierDatabaseError(r.error);
  return r.data ? supplierRecord(r.data) : null;
}
export async function supplierDirectory(client: SupabaseClient) {
  const suppliers: Supplier[] = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await client.from("suppliers").select(supplierProjection).order("normalised_name").order("id").range(offset, offset + 999);
    supplierDatabaseError(r.error);
    suppliers.push(...(r.data || []).map(supplierRecord));
    if ((r.data?.length || 0) < 1000) return suppliers;
  }
}
export async function saveSupplier(client: SupabaseClient, input: unknown) {
  const p = supplierInput.safeParse(input);
  if (!p.success) throw new ArticleError(p.error.issues.map(i => i.message).join(" "));
  const {id, version, ...fields} = p.data;
  const query = id ? client.from("suppliers").update(fields).eq("id", id).eq("version", version) : client.from("suppliers").insert(fields);
  const r = await query.select(supplierProjection).maybeSingle();
  supplierDatabaseError(r.error);
  if (!r.data) throw new ArticleError("This supplier changed or was archived in another tab. Copy your edits before reloading.", 409);
  return supplierRecord(r.data);
}
