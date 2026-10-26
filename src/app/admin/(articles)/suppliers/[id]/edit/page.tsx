import { notFound } from "next/navigation";
import { z } from "zod";
import { pageAdmin } from "@/lib/articles/client";
import { getSupplier } from "@/lib/suppliers/data";
import { SupplierEditor } from "@/components/suppliers/SupplierEditor";
export default async function EditSupplier({params}: {params: Promise<{id: string}>}) {
  const client = await pageAdmin(), {id} = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supplier = await getSupplier(client, id);
  if (!supplier) notFound();
  return <SupplierEditor initial={supplier}/>;
}
