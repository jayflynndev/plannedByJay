export const site = {
  name: 'Planned by Jay',
  descriptor: 'Personal travel planning',
  title: 'Planned by Jay | Your holiday. Properly thought through.',
  description: 'Thoughtful, personal holiday planning for families, couples and curious travellers. Explore your options with Planned by Jay, a UK travel consultancy.',
  footerIntro: 'Personal holiday planning with me, Jay. I’ll research the options and help you make sense of the details.',
  contact: {
    // EDIT HERE: Add approved contact details. Null means no inactive or fictional link is shown.
    email: 'jay@plannedbyjay.com' as string | null,
    phone: null as string | null,
    pending: 'Contact details are being finalised. Enquiries are not yet open on this development site.',
  },
  social: [] as { label: string; href: string }[],
  policies: [] as { label: string; href: string }[],
  business: {
    tradingStatement: 'Planned by Jay is trading on behalf of New Travel Holidays.',
    companyDisplayName: 'New Travel Holidays',
    // Verified against Companies House entry 16135195 on 22 October 2026.
    // This confirms the entity name, not the controller/agency relationship.
    legalEntityName: 'New Travel Holidays Limited' as string | null,
    partnership: 'New Travel Holidays is a member of Advantage Travel Partnership.',
    registration: 'Registered in England and Wales',
    companyNumber: '16135195',
    vatNumber: '482 4625 76',
    headOffice: 'The Landmark, 1 School Lane, Burnley, BB11 1UF',
  },
  // Only display original artwork once usage permission and wording are confirmed.
  logos: [
    { name: 'New Travel', src: null as string | null, approvedForDisplay: false },
    { name: 'Advantage Travel Partnership', src: null as string | null, approvedForDisplay: false },
    { name: 'ABTA', src: null as string | null, approvedForDisplay: false },
  ],
  copyright: 'Planned by Jay.',
};
