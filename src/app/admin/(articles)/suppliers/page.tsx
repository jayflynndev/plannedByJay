import { pageAdmin } from "@/lib/articles/client";
import { supplierDirectory } from "@/lib/suppliers/data";
import { SupplierDirectory } from "@/components/suppliers/SupplierDirectory";
export default async function Suppliers() {
  const client = await pageAdmin();
  return <SupplierDirectory initial={await supplierDirectory(client)}/>;
}
