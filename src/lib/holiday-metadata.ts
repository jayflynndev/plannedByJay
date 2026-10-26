import type { Metadata } from "next";
import type { HolidayDisplay } from "@/components/holidays/HolidayPages";
import { holidayDiscovery } from "@/content/holiday-types";
/** Metadata remains subject to RootLayout's existing indexing gate. */
export function holidayMetadata(origin: string, holiday?: HolidayDisplay): Metadata {
  const title = holiday?.name || holidayDiscovery.title;
  const description = holiday?.introduction || holidayDiscovery.description;
  const url = `${origin}/holidays${holiday ? `/${holiday.slug}` : ""}`;
  const images = holiday?.photoUrl ? [{url: new URL(holiday.photoUrl, origin).href, alt: holiday.image_alt}] : undefined;
  return {title: `${title} | Planned by Jay`, description, alternates: {canonical: url},
    openGraph: {title, description, url, type: "website", ...(images ? {images} : {})},
    twitter: {card: images ? "summary_large_image" : "summary", title, description, ...(images ? {images: images.map(i => i.url)} : {})},
  };
}
