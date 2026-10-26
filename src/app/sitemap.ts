import type { MetadataRoute } from "next";
import { publicOrigin } from "@/lib/presentation";
import { publicHolidayTypes } from "@/lib/holiday-types/data";
import { approvedPolicies } from "@/content/policies";
import { publicArticlesClient } from "@/lib/articles/client";
import { publicOffers } from "@/lib/offers/data";
import { emptyOfferQuery } from "@/lib/offers/schema";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let holidays: MetadataRoute.Sitemap = [];
  try { holidays = (await publicHolidayTypes()).map(h => ({url: publicOrigin() + "/holidays/" + h.slug, lastModified: h.updated_at})); }
  catch { /* Never fall back to unpublished or hard-coded Holiday Type URLs. */ }
  const articles: MetadataRoute.Sitemap = [];
  const offers:MetadataRoute.Sitemap=[];
  try {for(let page=1;;page++){const r=await publicOffers({...emptyOfferQuery,page},{limit:100});offers.push(...r.offers.map(o=>({url:publicOrigin()+"/holiday-offers/"+o.slug,lastModified:o.updated_at})));if(page*100>=r.total)break;}}
  catch { /* Unavailable offer data never adds stale/draft URLs. */ }
  const c = publicArticlesClient();
  if (c) {
    for (let offset = 0; ; offset += 1000) {
      const r = await c
        .from("articles")
        .select("slug,updated_at")
        .eq("status", "published")
        .order("id")
        .range(offset, offset + 999);
      if (r.error) break;
      for (const a of r.data || [])
        articles.push({
          url: publicOrigin() + "/travel-advice/" + a.slug,
          lastModified: a.updated_at,
        });
      if ((r.data?.length || 0) < 1000) break;
    }
  }
  return [
    ...articles,
    ...offers,
    ...holidays,
    ...[
      "",
      "/why-jay",
      "/holidays",
      "/travel-advice",
      "/holiday-offers",
      "/plan-my-holiday",
      ...approvedPolicies().map((p) => p.href),
    ].map((path) => ({ url: publicOrigin() + path })),
  ];
}
