import type { Action, Holiday } from "@/types/content";

// EDIT HERE: All homepage marketing copy and image paths live in this file.
export const home = {
  hero: {
    eyebrow: "A little less searching. A lot more possibility.",
    headline: "Your holiday. Properly thought through.",
    description:
      "Tell me what you’re looking for and I’ll research suitable holidays, compare the details and help you understand the options. You’ll deal directly with me.",
    primary: {
      label: "Plan My Holiday",
      href: "/plan-my-holiday",
    } satisfies Action,
    secondary: { label: "How I can help", href: "/why-jay" } satisfies Action,
    // Upload replacements to /public/images/home/ and change this path.
    image: "/images/home/hero.jpg",
    imageAlt:
      "Colourful coastal buildings overlooking a calm Mediterranean harbour",
    caption: "Room for a different perspective.",
    note: "Personal planning. Thoughtful details. A real person.",
  },
  paths: {
    eyebrow: "Every holiday starts somewhere",
    title: "Where are you starting from?",
    items: [
      {
        title: "I know where I want to go.",
        description:
          "Tell me where you’re thinking of going and I’ll help work through the details.",
        action: { label: "Talk through your plans", href: "/plan-my-holiday" },
      },
      {
        title: "I have dates and a budget.",
        description:
          "Tell me when you can travel and what you’d like to spend. I’ll research what could fit.",
        action: { label: "Find your starting point", href: "/plan-my-holiday" },
      },
      {
        title: "I’m looking for inspiration.",
        description:
          "Have a browse through the holiday styles below, or read my travel articles for ideas.",
        action: { label: "Explore holiday ideas", href: "/#holidays" },
      },
    ],
  },
  why: {
    eyebrow: "A person, not another search engine",
    title: "Your holiday plans, with someone to help.",
    description:
      "Hi, I’m Jay. I’m here to help make sense of the options, listen to what matters to you and think beyond the headline price.",
    closing:
      "Whether it’s the right room, a workable journey or space for everyone to enjoy themselves, the details deserve a little thought.",
    points: [
      "Less time lost in research",
      "Your priorities, properly understood",
      "A view of the whole holiday",
      "Clear options and a real person to talk to",
    ],
    portraitLabel: "Personal travel planning",
    portraitNote: "Your priorities, properly understood.",
    // Change this path to an approved real photograph of Jay; never substitute a stock person.
    portrait: "/images/jay/jay-portrait.jpg",
    portraitAlt: "Jay, your personal travel consultant",
    portraitPosition: "50% 35%",
    action: { label: "Why book with Jay?", href: "/why-jay" } satisfies Action,
  },
  holidays: {
    eyebrow: "There’s more than one way to get away",
    title: "Find your kind of holiday.",
    description:
      "Browse the styles below for ideas. If you’re planning a trip, tell me which appeals and I’ll research suitable options. These aren’t ready-made offers.",
    actionLabel: "Discuss this kind of holiday",
    actionHref: "/plan-my-holiday",
    items: [
      {
        title: "Family Holidays",
        description: "Time together, with room for everyone.",
        src: "/images/destinations/family.jpg",
        alt: "Sunlit beach and turquoise sea",
      },
      {
        title: "Cruises",
        description: "Compare itineraries, time ashore and what’s included.",
        src: "/images/destinations/cruise.jpg",
        alt: "Gentle ocean waves beneath a pale sky",
      },
      {
        title: "Couples Escapes",
        description: "A little time just for the two of you.",
        src: "/images/destinations/couples.jpg",
        alt: "Modern white villa with a sunlit swimming pool",
      },
      {
        title: "City Breaks",
        description: "Think about location, getting around and time to explore.",
        src: "/images/destinations/city.jpg",
        alt: "Historic European city architecture beside a canal",
      },
      {
        title: "Something Different",
        description: "Touring, several stops or a different way to get away.",
        src: "/images/destinations/different.jpg",
        alt: "Mountain landscape stretching into the distance",
      },
      {
        title: "Accessible Travel",
        description: "Start with what works for you.",
        src: "/images/destinations/accessible.jpg",
        alt: "Open coastal landscape beside calm water; illustrative destination photograph",
      },
    ] satisfies Holiday[],
  },
  inspiration: {
    eyebrow: "The travel notebook",
    title: "A little food for thought.",
    description:
      "My travel articles offer practical advice, comparisons and places to consider. Browse at your own pace before deciding what suits you.",
    action: {
      label: "Browse all travel articles",
      href: "/travel-advice",
    } satisfies Action,
    sampleLabel: "Sample preview · article coming later",
    // Historical sample copy only; TravelInspiration now renders published CMS data.
    items: [
      {
        category: "Practical travel advice",
        title: "The questions to ask before you choose a holiday",
        description:
          "A planned guide to turning your priorities into a useful holiday brief.",
        image: "/images/home/advice.jpg",
        alt: "Coastal town viewed from above",
      },
      {
        category: "Holiday comparisons",
        title: "One destination, different ways to stay",
        description:
          "A planned look at how different styles of holiday could suit different people.",
        image: "/images/home/comparison.jpg",
        alt: "Mediterranean buildings surrounding a harbour",
      },
      {
        category: "Wish You Were Here",
        title: "A window into somewhere new",
        description:
          "Destination guides and video features are planned for this space.",
        image: "/images/home/video.jpg",
        alt: "Dramatic mountain scenery under an open sky",
      },
    ],
  },
  cta: {
    eyebrow: "An idea is enough to begin",
    title: "You don’t need to have it all worked out.",
    description:
      "Planning a trip? Tell me your ideas, dates and budget in the Holiday Brief. I’ll review the details and get back to you using your preferred contact method.",
    button: "Let’s Plan Your Holiday",
    href: "/plan-my-holiday",
    pendingTitle: "Let’s start with a conversation.",
    contactLabel: "Email Jay",
  },
};
