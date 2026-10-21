import { pageAdmin } from '@/lib/cms/client';
import { categories } from '@/lib/cms/data';
import { CategoryManager } from '@/components/cms/CategoryManager';
export default async function CategoriesPage() {const client=await pageAdmin();return <><h1>Article categories</h1><CategoryManager initial={await categories(client)}/></>;}
