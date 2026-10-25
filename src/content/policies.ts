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

// EDIT HERE: Original application-specific drafts, last edited 22 October 2026.
// Historical application text is preserved, not newly approved by demolition.
// Previous research/checklists are retained in the private recovery archive.
// A document stays 404/unlinked/out of the sitemap until reviewed AND explicitly approved.
export const policies: Record<PolicyKey, Policy> = {
  privacy: {
    title: 'Privacy Policy', approved: false, updatedAt: '2026-10-22',
    reviewRequired: ['processing-role-allocation', 'lawful-bases-and-lia', 'provider-retention-and-erasure-approval', 'processors-and-transfers', 'production-storage-verification', 'owner-text-approval'],
    sections: [
      {
        heading: 'About this notice and how to contact me',
        paragraphs: [
          'I’m Jay, the person behind Planned by Jay. I research holidays, discuss the options with you and help arrange bookings through New Travel Holidays Limited, on whose behalf Planned by Jay trades. This notice covers this website, your initial enquiry and the information needed if you decide to take a booking forward.',
          'New Travel Holidays Limited is registered in England and Wales, company number 16135195, VAT number 482 4625 76. Its head office is The Landmark, 1 School Lane, Burnley, BB11 1UF. It is a member of Advantage Travel Partnership. New Travel Holidays Limited’s ICO registration number is ZB868696.',
          'For questions about this website’s use of your information, or to make a privacy request, email jay@plannedbyjay.com. If your question concerns information used in arranging a booking through New Travel Holidays or a supplier, I can help direct it to the appropriate organisation.',
          'I handle your initial website enquiry and the discussion about your plans. If you decide to progress towards a booking, the relevant information is handled through New Travel Holidays’ authorised booking arrangements, with the privacy information for that stage explained to you.',
          'My agreement with New Travel Holidays covers GDPR responsibilities for customer information collected through this Planned by Jay website. I handle website enquiries and am your first contact for privacy requests, coordinating with New Travel Holidays where the request involves its responsibilities or booking systems.',
        ],
        links: [{ label: 'Email Jay about privacy', href: 'mailto:jay@plannedbyjay.com' }],
      },
      {
        heading: 'Information collected in the initial Holiday Brief',
        paragraphs: [
          'The Holiday Brief asks for your name, email address, preferred contact method and, where supplied or needed for a telephone response, telephone number. It also asks about destinations, holiday style, dates or flexibility, duration, departure preferences, the number of adults and children, children’s ages at travel, your total budget, holiday preferences and how far along you are in planning.',
          'You can ask for a private discussion about accessibility or other practical requirements. The initial Holiday Brief does not ask for passport details, full passenger identity documents, booking payment details, children’s names or dates of birth, or detailed medical information. Please do not put these in the free-text boxes.',
          'You choose whether to enquire. Some answers and contact details are needed to understand your plans and respond; without these, the form cannot be submitted. Optional fields can be left blank. Submitting the form does not create a booking or a marketing subscription.',
          'If you contact me directly, I receive the contact details and information you include in that correspondence. If you provide information about other travellers, please make them aware of this notice and share only what is needed for the enquiry.',
        ],
      },
      {
        heading: 'Additional information when arranging a booking',
        paragraphs: [
          'If your enquiry progresses to arranging or confirming a booking, I may need additional passenger information for the particular holiday. This can include full legal names, dates of birth, passport information and other details required by New Travel Holidays or the relevant travel suppliers.',
          'I’ll explain what is needed and how to provide it through a secure, approved New Travel Holidays workflow and its authorised systems, including VHUB where appropriate. Only information necessary for the booking will be requested, with the relevant privacy information provided at that stage. An initial enquiry is not automatically transferred into VHUB.',
          'This later booking-stage collection is separate from the public Holiday Brief. This website does not provide customer passport or identity-document uploads or booking payment collection. Please do not send these details through the Holiday Brief or ordinary email; use the approved secure workflow when requested.',
        ],
      },
      {
        heading: 'How your enquiry is handled',
        paragraphs: [
          'I use the information to review your requirements, research suitable options, ask any follow-up questions and respond using your preferred contact method. If you decide to take things further, relevant information can be shared through New Travel Holidays and with the travel suppliers involved. Further booking information and any additional privacy information will be provided at that stage.',
          'Your enquiry is saved in Supabase, the database service used for this website. Resend sends a summary to the business inbox so I can respond. The summary contains your contact details and holiday requirements, and replies can be directed to your email address. A saved copy allows the notification to be retried if sending fails. Copies are also held in the business mailbox and any later correspondence.',
          'The on-screen confirmation means your enquiry has been received. It is not a booking confirmation. There is no separate customer receipt email.',
        ],
      },
      {
        heading: 'Why your information is used',
        // Final wording is held unpublished until the activity/basis map and LIA in
        // docs/POLICY-APPROVAL-CHECKLIST.md are signed off under the agreed arrangement.
        paragraphs: [
          'I use your enquiry details to understand your requirements, research suitable options, answer your questions and keep a record of the discussion. If you progress towards a booking, the relevant details are used through New Travel Holidays’ approved arrangements to help take it forward.',
          'Information is also used to protect the website from spam and repeated submissions and to keep the administrator area secure. Submitting a Holiday Brief does not give permission for unrelated marketing.',
        ],
      },
      {
        heading: 'Website and email services',
        paragraphs: [
          'Supabase stores enquiries and related notification and security records. It also provides administrator sign-in and storage for website articles and photographs. You do not need a customer account to enquire.',
          'Vercel hosts the website. Hosting and security services handle the technical information needed to load and protect it, such as IP addresses, browser information, request times and error records. Resend handles enquiry notification emails; the Microsoft 365 business mailbox, managed through GoDaddy, holds messages and replies.',
          'Where the form uses Cloudflare Turnstile, Cloudflare checks browser and device signals to help prevent automated spam. It runs only when configured on an enabled form. There is no advertising tracking, analytics or newsletter sign-up built into this website.',
        ],
        links: [{ label: 'Cloudflare Turnstile privacy information', href: 'https://www.cloudflare.com/turnstile-privacy-policy/' }],
      },
      {
        heading: 'Where information is processed',
        // Do not approve until actual account arrangements and safeguards are inserted/verified.
        paragraphs: [
          'Your information is handled by the website, database and email services described above and, when appropriate, through New Travel Holidays’ booking arrangements. Contact me at jay@plannedbyjay.com if you have a question about where your information is processed.',
          'These services can involve processing outside the UK, including in the United States. Resend documents US storage of email data; choosing an email sending region does not change that storage location. A UK or European database or hosting region does not by itself mean all support, logs or service-provider processing stays there.',
          'The website’s Supabase project is in West EU, Resend uses an Ireland sending region, and London is selected for Vercel server functions. These selections do not establish the location of every copy or the business mailbox.',
          'International processing must be covered by an applicable UK adequacy arrangement or appropriate safeguards, such as approved contractual clauses with the UK Addendum, with any required transfer assessment. You can ask jay@plannedbyjay.com for information about the safeguards applying to your information and how to obtain a copy.',
        ],
      },
      {
        heading: 'How long information is kept',
        // Adopted monthly manual procedure: docs/ENQUIRY-DATA-RETENTION.md.
        paragraphs: [
          'For inactive enquiries that have not led to a booking, my policy is to review and normally delete the information 12 months after our last meaningful customer contact. I carry out a manual review each month. This is a business retention policy, not a period required by law; this website does not automatically delete an enquiry when that date is reached.',
          'The review covers the enquiry record, saved notification copies and related emails. Information may need to be kept longer for an active enquiry, a booking, an unresolved question or dispute, or an applicable legal duty. Booking records are handled under the relevant New Travel Holidays or supplier retention arrangements.',
          'A deletion request also needs to take account of copies held by email and service providers and in backups. I’ll explain any information that needs to be retained and why. A separate record of the enquiry reference is kept to prevent reuse; it does not contain your contact details or holiday requirements.',
        ],
      },
      {
        heading: 'Your choices and rights',
        paragraphs: [
          'You can ask to see the personal information held about you and ask for inaccurate details to be corrected. Depending on the circumstances and applicable basis, you can also request deletion, restriction of use or a portable copy. Rights are subject to the conditions and exceptions in data protection law.',
          'You have the right to object to processing based on legitimate interests. Email jay@plannedbyjay.com to explain your objection or make another privacy request. Enough information may be needed to verify your identity and locate the relevant records; please do not send passport or payment details with an initial request.',
          'Where a separate activity relies on consent, you can withdraw that consent by contacting me. This does not affect processing that was lawful before withdrawal. The Holiday Brief does not subscribe you to marketing.',
          'The website uses automated validation, duplicate checks, rate limits and, if enabled, anti-spam checks. These can stop a submission; you can contact me by email if you cannot use the form. They do not decide your eligibility for a holiday, credit or a booking.',
        ],
        links: [{ label: 'Contact Jay about your information', href: 'mailto:jay@plannedbyjay.com' }],
      },
      {
        heading: 'Complaints and updates',
        paragraphs: [
          'Please contact me if you have a concern about how your information has been used. You also have the right to complain to the Information Commissioner’s Office (ICO), the UK data protection regulator.',
          'This notice will be reviewed when the website’s services or processing arrangements change. The date above records the latest edit to this document.',
        ],
        links: [{ label: 'Make a data protection complaint to the ICO', href: 'https://ico.org.uk/make-a-complaint/' }],
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy', approved: false, updatedAt: '2026-10-22',
    reviewRequired: ['production-storage-verification', 'administrator-persistence-assessment', 'owner-text-approval'],
    sections: [
      {
        heading: 'What this website uses storage for',
        paragraphs: [
          'Cookies are small values stored by your browser and sent with relevant requests. Similar technologies include browser storage and scripts that access information on your device. This website uses security and administrator sign-in technologies to provide the functions you request.',
          'There are no analytics or advertising-tracking features built into this website. Your unsent Holiday Brief answers stay in the page while you complete it; they are not saved in your browser’s persistent storage.',
        ],
      },
      {
        heading: 'Enquiry security',
        paragraphs: ['When you try to send an enabled Holiday Brief, a security cookie helps protect the form against spam and repeated submissions. It contains a random identifier and issue time, not your contact details or holiday answers. It is not created by simply viewing the disabled form.', 'This host-only cookie is HttpOnly, SameSite=Strict and scoped to /api/enquiries. Secure is set for the configured HTTPS website. A valid existing cookie is not renewed by the session endpoint.'],
        technologies: [{ name: 'pbj-enquiry-session', provider: 'Planned by Jay website', purpose: 'Protects Holiday Brief submissions against abuse.', duration: '24 hours from issue.' }],
      },
      {
        heading: 'Administrator sign-in and recovery',
        paragraphs: ['Supabase provides sign-in for the website’s administrator area. Its cookies keep administrators signed in and support password recovery. You do not need an administrator account or these sign-in cookies to browse articles or send an enquiry. Cookie names vary with the Supabase project and may have numbered parts, such as .0 and .1.', 'The application sets these cookies as HttpOnly, SameSite=Lax, host-only and scoped to /. Secure is set for the configured HTTPS website. Refreshing an authentication token can write the cookie again; sign-out expires the authentication cookie. Cookie persistence is separate from the validity of a login session or recovery link.'],
        technologies: [
          { name: 'sb-<project-ref>-auth-token (including numbered parts)', provider: 'Supabase Auth, on this website', purpose: 'Maintains an administrator’s sign-in session.', duration: 'Up to 400 days from a cookie write under the installed library. Login validity can end sooner through expiry or sign-out.' },
          { name: 'sb-<project-ref>-auth-token-code-verifier; sb-<project-ref>-auth-token-flow-<flowId>-code-verifier; sb-<project-ref>-auth-token-flows-code-verifier', provider: 'Supabase Auth, on this website', purpose: 'Verifies password-recovery requests and keeps an index of recovery flows.', duration: 'Maximum 400 days from a library write. Recovery processing has removal paths, but abandoned entries can remain until removed or expired. This does not make a recovery link valid for 400 days.' },
        ],
      },
      {
        heading: 'Anti-spam and hosting protection',
        paragraphs: [
          'Where enabled, Cloudflare Turnstile checks browser and device signals on the final stage of the form to help prevent automated spam. It runs only on a configured, enabled form and is used for security rather than advertising.',
          'Cloudflare can also use a cookie called cf_clearance when its additional clearance feature is enabled. It is not an always-present cookie on this website; its use and duration depend on the Cloudflare settings.',
          'Vercel hosts this website. Any additional hosting technology that stores or accesses information on your device will be described here when its use is established.',
        ],
        links: [{ label: 'Cloudflare Turnstile privacy information', href: 'https://www.cloudflare.com/turnstile-privacy-policy/' }],
      },
      {
        heading: 'Consent and your browser choices',
        paragraphs: [
          'The security and administrator sign-in cookies described here are used to provide and protect those functions, rather than to follow your activity for advertising.',
          'No advertising or analytics tracker has been identified on this website. No general cookie-consent banner is currently provided for the identified functions. This position will be reviewed before non-essential storage or tracking is introduced.',
          'If an optional feature needs your consent to use cookies or similar technology, you will be offered a choice before it runs. There is no advertising-cookie choice to make for the features currently implemented on this website.',
          'You can block or delete cookies using your browser’s controls. Blocking necessary security or sign-in cookies can stop an enquiry being sent or prevent administrator access. You can still contact me at jay@plannedbyjay.com about your holiday.',
        ],
      },
      {
        heading: 'Questions and changes',
        paragraphs: ['Email jay@plannedbyjay.com if you have a question about cookies. This policy will be updated when the website’s use of cookies changes; the date above records the latest edit.'],
        links: [{ label: 'Email Jay about cookies', href: 'mailto:jay@plannedbyjay.com' }],
      },
    ],
  },
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
