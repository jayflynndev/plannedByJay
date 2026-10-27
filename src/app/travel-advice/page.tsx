import { ArticleDiscovery } from "@/components/articles/ArticleDiscovery";
import { articleCopy } from "@/content/articles";
import { publicOrigin } from "@/lib/presentation";
import { publicArticleList, imageUrl } from "@/lib/articles/data";
export const dynamic = "force-dynamic";
export function generateMetadata() {
  return {
    title: articleCopy.title + " | Planned by Jay",
    description: articleCopy.description,
    alternates: { canonical: publicOrigin() + "/travel-advice" },
  };
}
export default async function TravelAdvice({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string; page?: string }>;
} = {}) {
  const params = (await searchParams) || {};
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const category =
    typeof params.category === "string" &&
    /^[a-f0-9-]{36}$/.test(params.category)
      ? params.category
      : "";
  const page = Math.max(
    1,
    Math.min(1000, Math.trunc(Number(params.page) || 1)),
  );
  let results: import('@/types/public-content').DiscoveryResults|null=null;
  let error:string|undefined;
  try {
    const r=await publicArticleList({q,category,page});
    results={total:r.total,categories:r.categories,tags:[],articles:r.articles.map(a=>({...a,content_type:'Travel advice',image:a.featured_image?{src:imageUrl(a.featured_image)!,width:1200,height:800}:null}))};
  }catch{error='Travel articles are temporarily unavailable. Please try again shortly.';}
  return <ArticleDiscovery query={{q,category,page,type:'',tag:''}} results={results} error={error}/>;
}
