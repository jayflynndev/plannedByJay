import { pageAdmin } from '@/lib/cms/client';
import { mediaList } from '@/lib/cms/data';
import { cmsConfig } from '@/lib/cms/config';
import { MediaLibrary } from '@/components/cms/MediaLibrary';
export default async function MediaPage() {const client=await pageAdmin();return <><h1>Your photographs</h1><MediaLibrary initialMedia={await mediaList(client)} mediaBase={cmsConfig()!.url} allowDelete/></>;}
