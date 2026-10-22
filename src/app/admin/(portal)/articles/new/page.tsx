import { pageAdmin } from '@/lib/cms/client';
import { categories, contentTypeNames, mediaList, tags } from '@/lib/cms/data';
import { cmsConfig, publicOrigin } from '@/lib/cms/config';
import { editorValue } from '@/lib/cms/editor';
import { ArticleEditor } from '@/components/cms/ArticleEditor';
export default async function NewArticle() {const client=await pageAdmin();const [cats,media,articleTags,types]=await Promise.all([categories(client),mediaList(client),tags(client),contentTypeNames(client)]);return <ArticleEditor initial={editorValue(null)} categories={cats} initialTags={articleTags} initialTypes={types} initialMedia={media} mediaBase={cmsConfig()!.url} siteOrigin={publicOrigin()}/>;}
