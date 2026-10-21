import { pageAdmin } from '@/lib/cms/client';
import { categories, mediaList } from '@/lib/cms/data';
import { cmsConfig, publicOrigin } from '@/lib/cms/config';
import { editorValue } from '@/lib/cms/editor';
import { ArticleEditor } from '@/components/cms/ArticleEditor';
export default async function NewArticle() {const client=await pageAdmin();const [cats,media]=await Promise.all([categories(client),mediaList(client)]);return <ArticleEditor initial={editorValue(null)} categories={cats} initialMedia={media} mediaBase={cmsConfig()!.url} siteOrigin={publicOrigin()}/>;}
