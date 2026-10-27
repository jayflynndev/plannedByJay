import type { Action } from "@/types/content";

// Shared public labels only. Holiday Type records are edited through Admin.
export const holidayDiscovery = {
  catalogue: {
    label: "View All Holiday Offers",
    href: "/holiday-offers",
  } satisfies Action,
  catalogueBody:
    "Browse all current holiday offers, or explore the holiday styles below for inspiration.",
  title: "Holiday Types",
  headline: "Not sure where to go? Start with how you’d like to travel.",
  description:
    "Whether you’re dreaming of sunshine by the pool, exploring a new city, setting sail on a cruise or heading off on a completely different adventure, there's a holiday out there for you. Explore the holiday styles below for inspiration, or browse my latest holiday offers to see what catches your eye. Finding the right holiday often starts with what you want from your time away. Explore these styles, compare the practical details and read a little more before deciding what suits you.",
  serviceTitle: "A starting point, without a finished itinerary.",
  serviceBody:
    "I can help research and compare the options around your priorities. Browse at your own pace; when you are ready, the Holiday Brief gives me a useful starting point.",
  browseLabel: "Explore",
  imageFallback: "Illustrative photograph unavailable",
  backLabel: "All holiday styles",
  considerationsTitle: "Things worth thinking through",
  ideasTitle: "Styles to explore",
  readingTitle: "Useful reading for this kind of holiday",
  readingBody: "Published guides and advice to help you explore the details.",
  readingLink: "Browse the Travel Advice library",
  readLabel: "Read article",
  alsoTitle: "You might also explore",
  action: {
    label: "Plan My Holiday",
    href: "/plan-my-holiday",
  } satisfies Action,
};
