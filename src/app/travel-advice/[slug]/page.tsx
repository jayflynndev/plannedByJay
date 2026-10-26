import { notFound } from "next/navigation";
import Link from "next/link";
import {
  publicArticle,
  categories,
  imageUrl,
  displayArticle,
} from "@/lib/articles/data";
import { publicArticlesClient } from "@/lib/articles/client";
import { publicOrigin } from "@/lib/presentation";
import { ArticleView } from "@/components/articles/ArticleView";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
async function find(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) notFound();
  const a = await publicArticle(slug);
  if (!a) notFound();
  return a;
}
export async function generateMetadata({ params }: Props) {
  const a = await find((await params).slug);
  const url = publicOrigin() + "/travel-advice/" + a.slug;
  const image = imageUrl(a.featured_image);
  return {
    title: a.title + " | Planned by Jay",
    description: a.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.excerpt,
      url,
      publishedTime: a.published_at || undefined,
      modifiedTime: a.updated_at,
      authors: a.author ? [a.author] : undefined,
      images: image ? [{ url: image, alt: a.featured_alt }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: a.title,
      description: a.excerpt,
      images: image ? [image] : [],
    },
  };
}
export default async function ArticlePage({ params }: Props) {
  const a = await find((await params).slug);
  const c = publicArticlesClient()!;
  const cats = await categories(c);
  const image = imageUrl(a.featured_image);
  const structured = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    author: a.author ? { "@type": "Person", name: a.author } : undefined,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    mainEntityOfPage: publicOrigin() + "/travel-advice/" + a.slug,
    image: image || undefined,
  };
  return (
    <main id="main-content" tabIndex={-1} className="article-page">
      <p className="article-back">
        <Link href="/travel-advice">All travel articles</Link>
      </p>
      <ArticleView
        article={displayArticle(a)}
        category={
          cats.find((c) => c.id === a.category_id)?.name || "Travel advice"
        }
        media={image ? { src: image, width: 1200, height: 800 } : null}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
