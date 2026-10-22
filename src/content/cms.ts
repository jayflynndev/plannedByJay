// EDIT HERE: available editorial formats. Keep matching database CHECK values.
export const contentTypes = ['Travel advice', 'Destination guide', 'Holiday comparison', 'Blog', 'Wish You Were Here', 'Inspiration'] as const;
export const articleStatuses = ['draft', 'published', 'archived'] as const;
// EDIT HERE: discovery labels/help. Tag names themselves are managed in the CMS.
export const discoveryCopy = {
  heading: 'Discovery & Placement',
  tags: 'Article tags', tagHint: 'Choose up to eight useful tags. Destinations and regions can be tags too. Removing a selection does not delete the article or tag.',
  newTag: 'New tag name', createTag: 'Create & select tag',
  featured: 'Featured on Homepage', featuredHint: 'Show this published article in the homepage preview. Up to three featured articles appear, newest published first. If none are featured, the latest published articles appear.',
  pinned: 'Pinned in Travel Advice', pinnedHint: 'Place this published article above ordinary results, only when it matches the visitor’s search and filters.',
  search: 'Search articles', searchHint: 'Search titles, descriptions, article text and tags.',
  allTypes: 'All content types', allCategories: 'All categories', allTags: 'All tags / destinations',
  apply: 'Search & filter', reset: 'Reset filters', noResults: 'No articles match these filters. Try a different search or reset the filters.',
  unavailable: 'Travel articles are temporarily unavailable. Please try again shortly.',
  invalid: 'Please use a search of up to 120 characters and choose the filters again.',
};
export const cmsCopy = {
  title: 'Travel advice & inspiration',
  description: 'My travel articles bring together ideas, comparisons and practical details to help you decide what might suit your next holiday.',
  empty: 'New travel articles will appear here when they are published.',
  ctaTitle: 'Let’s plan your next holiday',
  ctaBody: 'Tell me what you have in mind and I’ll help you explore your options.',
};
