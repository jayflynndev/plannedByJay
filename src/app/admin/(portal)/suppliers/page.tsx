import {pageAdmin} from '@/lib/cms/client';
import {offerSuppliers} from '@/lib/offers/data';
import {mediaList} from '@/lib/cms/data';
import {cmsConfig} from '@/lib/cms/config';
import {SupplierManager} from '@/components/offers/SupplierEditor';
export default async function Suppliers(){const client=await pageAdmin();const [suppliers,media]=await Promise.all([offerSuppliers(client),mediaList(client)]);return <SupplierManager initialSuppliers={suppliers} media={media} mediaBase={cmsConfig()!.url}/>;}
