import { Hero } from "@/components/home/Hero";
import { HolidayPaths } from "@/components/home/HolidayPaths";
import { WhyJay } from "@/components/home/WhyJay";
import { HolidayExperiences } from "@/components/home/HolidayExperiences";
import { TravelInspiration } from "@/components/home/TravelInspiration";
import { HomeCTA } from "@/components/home/HomeCTA";
import { publicOrigin } from "@/lib/presentation";
import { site } from "@/content/site";
import { OfferSection } from "@/components/offers/OfferViews";
import { offersCopy } from "@/content/offers";
export function generateMetadata() {
  return {
    title: site.title,
    description: site.description,
    alternates: { canonical: publicOrigin() },
    openGraph: {
      title: site.title,
      description: site.description,
      type: "website" as const,
      url: publicOrigin(),
    },
  };
}
export const dynamic = "force-dynamic";
import { publicArticleList, imageUrl } from "@/lib/articles/data";
export default async function Home() {
  let articles: import("@/types/public-content").ArticlePreview[] = [];
  try {
    const r = await publicArticleList({ limit: 3 });
    articles = r.articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content_type:
        r.categories.find((c) => c.id === a.category_id)?.name ||
        "Travel advice",
      image: a.featured_image
        ? {
            src: imageUrl(a.featured_image)!,
            alt: a.featured_alt,
            width: 1200,
            height: 800,
          }
        : null,
    }));
  } catch {
    /* An unavailable article service never breaks the homepage. */
  }
  return (
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <HolidayPaths />
      <WhyJay />
      <HolidayExperiences />
      <OfferSection offers={[]} title={offersCopy.featuredTitle} />
      <TravelInspiration articles={articles} />
      <HomeCTA />
    </main>
  );
}
