import 'server-only';

// EDIT HERE: Replace homepage anchors with real routes as each future page is built.
// RootLayout passes these values into Navbar; never import this config into a client component.
export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Explore Holidays', href: '/#holidays' },
  { label: 'Travel Advice', href: '/travel-advice' },
  { label: 'Why Book With Jay?', href: '/why-jay' },
];
export const primaryNavigation = {
  label: 'Plan My Holiday',
  href: '/plan-my-holiday',
};
