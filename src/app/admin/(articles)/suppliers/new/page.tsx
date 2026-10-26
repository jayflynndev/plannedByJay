import { pageAdmin } from "@/lib/articles/client";
import { SupplierEditor } from "@/components/suppliers/SupplierEditor";
export default async function NewSupplier() {
  await pageAdmin();
  return <SupplierEditor/>;
}
