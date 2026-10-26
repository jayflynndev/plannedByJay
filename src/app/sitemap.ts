import type { MetadataRoute } from "next";
import { publicOrigin } from "@/lib/presentation";
import { holidayTypes } from "@/content/holiday-types";
import { approvedPolicies } from "@/content/policies";
import { publicArticlesClient } from "@/lib/articles/client";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles: MetadataRoute.Sitemap = [];
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
    ...[
      "",
      "/why-jay",
      "/holidays",
      "/travel-advice",
      "/holiday-offers",
      "/plan-my-holiday",
      ...holidayTypes.map((t) => "/holidays/" + t.slug),
      ...approvedPolicies().map((p) => p.href),
    ].map((path) => ({ url: publicOrigin() + path })),
  ];
}
