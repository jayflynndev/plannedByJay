import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supplierDirectory } from "@/lib/suppliers/data";
import { offerError } from "./data";
export async function offerEditorChoices(client:SupabaseClient,currentSupplier?:string|null) {
  const suppliers=(await supplierDirectory(client)).filter(s=>(s.status==="approved"&&!s.archived)||s.id===currentSupplier);
  const r=await client.from("holiday_types").select("id,name").eq("status","published").order("display_order").order("created_at");offerError(r.error);
  return {suppliers,holidayTypes:(r.data||[]) as {id:string;name:string}[]};
}
