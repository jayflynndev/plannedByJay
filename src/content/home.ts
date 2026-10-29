import type { Action } from "@/types/content";

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
    actionLabel: "Explore",
    action: { label: "See more holiday types", href: "/holidays" } satisfies Action,
    // Cards are supplied by the published Holiday Types CMS records.

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
