import {pageAdmin} from '@/lib/cms/client';
import {offerSuppliers} from '@/lib/offers/data';
import {SupplierManager} from '@/components/offers/SupplierEditor';
export default async function Suppliers(){return <SupplierManager initialSuppliers={await offerSuppliers(await pageAdmin())}/>;}
