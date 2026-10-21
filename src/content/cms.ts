// EDIT HERE: available editorial formats. Keep matching database CHECK values.
export const contentTypes = ['Travel advice', 'Destination guide', 'Holiday comparison', 'Blog', 'Wish You Were Here', 'Inspiration'] as const;
export const articleStatuses = ['draft', 'published', 'archived'] as const;
export const cmsCopy = {
  title: 'Travel advice & inspiration',
  description: 'Ideas and practical reading to help you plan your next holiday.',
  empty: 'New travel articles will appear here when they are published.',
  ctaTitle: 'Let’s plan your next holiday',
  ctaBody: 'Tell me what you have in mind and I’ll help you explore your options.',
};
