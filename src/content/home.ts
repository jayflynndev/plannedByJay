import type { Action, Holiday } from '@/types/content';

// EDIT HERE: All homepage marketing copy and image paths live in this file.
export const home = {
  hero: {
    eyebrow: 'A little less searching. A lot more possibility.',
    headline: 'Your holiday. Properly thought through.',
    description: 'From your first idea to the finer details, I help research, find and arrange a holiday that makes sense for you. Your priorities, your pace, your kind of escape.',
    primary: { label: 'Plan My Holiday', href: '/plan-my-holiday' } satisfies Action,
    secondary: { label: 'Explore Holidays', href: '/#holidays' } satisfies Action,
    // Upload replacements to /public/images/home/ and change this path.
    image: '/images/home/hero.jpg',
    imageAlt: 'Colourful coastal buildings overlooking a calm Mediterranean harbour',
    caption: 'Room for a different perspective.',
    note: 'Personal planning. Thoughtful details. A real person.',
  },
  paths: {
    eyebrow: 'Every holiday starts somewhere',
    title: 'Where are you starting from?',
    items: [
      { title: 'I know where I want to go.', description: 'A place in mind? Let’s work out the details that make it your holiday.', action: { label: 'Talk through your plans', href: '/plan-my-holiday' } },
      { title: 'I have dates and a budget.', description: 'Start with the practical bits. We can explore the possibilities together.', action: { label: 'Find your starting point', href: '/plan-my-holiday' } },
      { title: 'I’m looking for inspiration.', description: 'No fixed destination yet? There’s plenty of room to be curious.', action: { label: 'Explore holiday ideas', href: '/#holidays' } },
    ],
  },
  why: {
    eyebrow: 'A person, not another search engine',
    title: 'Good holidays start with a good conversation.',
    description: 'Hi, I’m Jay. I’m here to help make sense of the options, listen to what matters to you and think beyond the headline price.',
    closing: 'Whether it’s the right room, a workable journey or space for everyone to enjoy themselves, the details deserve a little thought.',
    points: ['Less time lost in research', 'Your priorities, properly understood', 'A view of the whole holiday', 'Clear options and a real person to talk to'],
    portraitLabel: 'A hello from Jay',
    portraitPlaceholder: 'Your photograph here',
    portraitNote: 'Development placeholder · add an approved portrait',
    // Set a local image path when Jay’s portrait is available; never substitute a stock person.
    portrait: null as string | null,
    portraitAlt: 'Jay, your personal travel consultant',
  },
  holidays: {
    eyebrow: 'There’s more than one way to get away',
    title: 'Find your kind of holiday.',
    description: 'Big adventures, small escapes and everything in between. These are starting points for a conversation, not a list of ready-made offers.',
    actionLabel: 'Discuss this kind of holiday',
    actionHref: '/plan-my-holiday',
    items: [
      { title: 'Family Holidays', description: 'Time together, with room for everyone.', src: '/images/destinations/family.jpg', alt: 'Sunlit beach and turquoise sea' },
      { title: 'Cruises', description: 'A new view beyond the horizon.', src: '/images/destinations/cruise.jpg', alt: 'Gentle ocean waves beneath a pale sky' },
      { title: 'Couples Escapes', description: 'A little time just for the two of you.', src: '/images/destinations/couples.jpg', alt: 'Modern white villa with a sunlit swimming pool' },
      { title: 'City Breaks', description: 'New streets. A different rhythm.', src: '/images/destinations/city.jpg', alt: 'Historic European city architecture beside a canal' },
      { title: 'Something Different', description: 'For the curious and the open-minded.', src: '/images/destinations/different.jpg', alt: 'Mountain landscape stretching into the distance' },
      { title: 'Accessible Travel', description: 'Start with what works for you.', src: '/images/destinations/accessible.jpg', alt: 'Open coastal landscape beside calm water; illustrative destination photograph' },
    ] satisfies Holiday[],
  },
  inspiration: {
    eyebrow: 'The travel notebook',
    title: 'A little food for thought.',
    description: 'A future home for practical advice, thoughtful comparisons and places worth exploring.',
    sampleLabel: 'Sample preview · article coming later',
    items: [
      { category: 'Practical travel advice', title: 'The questions to ask before you choose a holiday', description: 'A planned guide to turning your priorities into a useful holiday brief.', image: '/images/home/advice.jpg', alt: 'Coastal town viewed from above' },
      { category: 'Holiday comparisons', title: 'One destination, different ways to stay', description: 'A planned look at how different styles of holiday could suit different people.', image: '/images/home/comparison.jpg', alt: 'Mediterranean buildings surrounding a harbour' },
      { category: 'Wish You Were Here', title: 'A window into somewhere new', description: 'Destination guides and video features are planned for this space.', image: '/images/home/video.jpg', alt: 'Dramatic mountain scenery under an open sky' },
    ],
  },
  cta: {
    eyebrow: 'An idea is enough to begin',
    title: 'You don’t need to have it all worked out.',
    description: 'A destination, a date, a wish list — or simply the feeling that it’s time for a holiday. We can start there.',
    button: 'Let’s Plan Your Holiday',
    href: '/plan-my-holiday',
    pendingTitle: 'Let’s start with a conversation.',
    contactLabel: 'Email Jay',
  },
};
