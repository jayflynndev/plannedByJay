import { z } from "zod";
import { imagePath, slugWords } from "@/lib/articles/schema";

// Existing local photographs remain in place; new photographs use the shared library.
export const holidayImage = z.union([
  z.literal(""),
  imagePath,
  z.enum([
    "/images/destinations/family.jpg", "/images/destinations/cruise.jpg",
    "/images/destinations/couples.jpg", "/images/destinations/city.jpg",
    "/images/destinations/different.jpg", "/images/destinations/accessible.jpg",
  ]),
]);
export const holidayInput = z.object({
  id: z.uuid().nullable().default(null),
  version: z.number().int().nonnegative().default(0),
  name: z.string().trim().max(120).default(""),
  slug: z.string().max(60).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/).default(""),
  introduction: z.string().trim().max(500).default(""),
  heading: z.string().trim().max(180).default(""),
  body: z.string().max(150000).default(""),
  image: holidayImage.default(""),
  image_alt: z.string().trim().max(300).default(""),
  image_position: z.string().regex(/^(?:100|\d{1,2})% (?:100|\d{1,2})%$/).default("50% 50%"),
  closing_heading: z.string().trim().max(180).default("Have a holiday in mind?"),
  closing_body: z.string().trim().max(1000).default("Tell me what you would like from your time away and I can help research the options."),
  status: z.enum(["draft", "published"]).default("draft"),
}).strict();
export type HolidayInput = z.output<typeof holidayInput>;
export type HolidayType = HolidayInput & {
  id: string; is_original: boolean; display_order: number;
  created_at: string; updated_at: string; published_at: string | null;
};
export const emptyHoliday = () => holidayInput.parse({});
export function holidaySlug(name: string) {
  return slugWords(name).replace(/-holidays?$/, "").slice(0, 60).replace(/-$/, "") || "holiday";
}
