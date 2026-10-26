export type PolicyKey = 'privacy' | 'cookies' | 'booking-information';
export type PolicyLink = { label: string; href: string };
export type StorageTechnology = { name: string; provider: string; purpose: string; duration: string };
export type Policy = {
  title: string;
  approved: boolean;
  updatedAt: string | null;
  // Internal tasks, never rendered. Resolve with evidence before removing and approving.
  reviewRequired: string[];
  sections: { heading: string; paragraphs: string[]; links?: PolicyLink[]; technologies?: StorageTechnology[] }[];
};

// EDIT HERE: Public policy content. Unpublished Privacy/Cookies retain their page shells.
// Do not publish obsolete backend-processing descriptions.
// A document stays 404/unlinked/out of the sitemap until reviewed AND explicitly approved.
export const policies: Record<PolicyKey, Policy> = {
  privacy: {title: 'Privacy Policy', approved: false, updatedAt: null, reviewRequired: [], sections: []},
  cookies: {title: 'Cookie Policy', approved: false, updatedAt: null, reviewRequired: [], sections: []},
  'booking-information': {
    title: 'Booking Information', approved: true, updatedAt: '2026-10-22',
    reviewRequired: [],
    sections: [
      {
        heading: 'How holiday bookings work',
        paragraphs: [
          'Planned by Jay trades on behalf of New Travel Holidays Limited, an ABTA member (P8763). I research suitable holidays, discuss the options with you and help arrange bookings through New Travel Holidays. You deal directly with me about your plans.',
          'When I help you find a holiday, I’ll explain who you’re booking with and which terms and conditions apply.',
          'New Travel Holidays Limited is registered in England and Wales, company number 16135195, VAT number 482 4625 76. Its head office is The Landmark, 1 School Lane, Burnley, BB11 1UF. New Travel Holidays is a member of Advantage Travel Partnership.',
        ],
      },
      {
        heading: 'An enquiry is the starting point',
        paragraphs: [
          'Sending a Holiday Brief asks me to review your requirements and get back to you. It is not a confirmed holiday booking, does not take a payment and does not create a travel contract.',
          'The enquiry reference identifies your enquiry only. It is not a booking confirmation, ticket or guarantee that any holiday is available at a particular price.',
        ],
      },
      {
        heading: 'Existing package holidays',
        paragraphs: [
          'If you choose an existing package holiday from a tour operator, that operator’s applicable booking conditions will normally apply, alongside any relevant agency terms and disclosures. I’ll help you through the process, but responsibility for providing the package remains with the identified package organiser under the applicable arrangements and law.',
          'You’ll receive the relevant conditions before you commit. This page explains the process; it does not replace or override the terms for your particular booking.',
        ],
        links: [{ label: 'Ask Jay about the applicable booking conditions', href: 'mailto:jay@plannedbyjay.com' }],
      },
      {
        heading: 'More specialised itineraries',
        paragraphs: [
          'For itineraries involving several travel services, the booking structure and responsibilities depend on how those arrangements are organised and sold. Researching or coordinating your options does not automatically make me the package organiser.',
          'Not every combination can automatically be booked. Before offering a newly assembled package, the appropriate New Travel approval and booking structure must be established, including who acts as organiser and takes on the applicable obligations. I’ll explain the conditions and financial protection before you commit.',
        ],
      },
      {
        heading: 'ABTA and financial protection',
        paragraphs: [
          'Planned by Jay operates through New Travel Holidays Limited, whose ABTA membership number is P8763.',
          'Financial protection depends on the specific arrangements and the protection scheme that applies. A reference or logo does not mean that every flight, accommodation-only booking, cruise or package has identical protection.',
          'Any applicable protection and supporting documents will be explained for the holiday you choose before you commit. Do not assume that all holidays are ATOL protected; no ATOL licence number is claimed for Planned by Jay on this website.',
        ],
        links: [
          { label: 'Check membership through the official ABTA member search', href: 'https://www.abta.com/abta-member-search' },
          { label: 'Official ABTA help and complaints information', href: 'https://www.abta.com/help-and-complaints' },
        ],
      },
      {
        heading: 'Questions about your arrangements',
        paragraphs: ['Email jay@plannedbyjay.com to discuss an enquiry or ask which booking information applies. If you already have a booking, include its reference so I can help direct your question to the appropriate party. Please do not email payment card details or passport copies with an initial question.'],
        links: [{ label: 'Email Jay about your holiday', href: 'mailto:jay@plannedbyjay.com' }],
      },
    ],
  },
};

export function isPolicyPublished(policy: Policy) {
  return policy.approved && policy.reviewRequired.length === 0 && !!policy.updatedAt && policy.sections.length > 0;
}
export function approvedPolicyHref(key: PolicyKey): string | null {
  return isPolicyPublished(policies[key]) ? `/${key}` : null;
}
export function approvedPolicies() {
  return (Object.keys(policies) as PolicyKey[]).flatMap(key => {
    const href = approvedPolicyHref(key);
    return href ? [{ href, label: policies[key].title }] : [];
  });
}
