import 'server-only';

// EDIT HERE: Public routes and labels. Keep the Holiday Brief CTA canonical.
// RootLayout passes these values into Navbar; never import this config into a client component.
export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Holiday Types', href: '/holidays' },
  { label: 'Holiday Offers', href: '/holiday-offers' },
  { label: 'Travel Advice', href: '/travel-advice' },
  { label: 'Why Book With Jay?', href: '/why-jay' },
];
export const primaryNavigation = {
  label: 'Plan My Holiday',
  href: '/plan-my-holiday',
};
