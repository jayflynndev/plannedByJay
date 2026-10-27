export type PolicyKey = "privacy" | "cookies" | "booking-information";
export type PolicyLink = { label: string; href: string };
export type StorageTechnology = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
};
export type Policy = {
  title: string;
  approved: boolean;
  updatedAt: string | null;
  // Internal tasks, never rendered. Resolve with evidence before removing and approving.
  reviewRequired: string[];
  sections: {
    heading: string;
    paragraphs: string[];
    links?: PolicyLink[];
    technologies?: StorageTechnology[];
  }[];
};

// EDIT HERE: Public policy content. Privacy is an owner-review draft; Cookies is unpublished.
// Ready for Jay's final review using the confirmed New Travel trading arrangement.
// A document stays 404/unlinked/out of the sitemap until reviewed AND explicitly approved.
export const policies: Record<PolicyKey, Policy> = {
  privacy: {
    title: "Privacy Policy",
    approved: true,
    updatedAt: null,
    reviewRequired: [
      "Jay: review and approve the complete wording before publication; see docs/PRIVACY-REVIEW.md for the published provider terms, the recorded Vercel Hobby commercial-use issue and the existing delivery-test instructions.",
    ],
    sections: [
      {
        heading: "Who we are and how to contact us",
        paragraphs: [
          "I’m Johnny-James Flynn, known as Jay, a self-employed travel consultant trading as Planned by Jay under an agreement with New Travel Holidays Limited. I personally handle initial website enquiries, customer communications and holiday research, and help arrange bookings through New Travel, on whose behalf Planned by Jay trades. New Travel Holidays Limited is registered in England and Wales, company number 16135195, with its head office at The Landmark, 1 School Lane, Burnley, BB11 1UF.",
          "My agreement with New Travel covers the website customer journey from initial enquiry through booking, including responsibilities for customer information. I manage your initial enquiry, communications and holiday research on New Travel’s behalf. New Travel’s customer and booking information is handled under that trading arrangement. This notice covers the website, holiday-offer enquiries, the Plan My Holiday brief and related correspondence.",
          "I am your first contact for privacy questions and requests, and will coordinate with New Travel so the appropriate organisation deals with your request. You do not need to work out our internal responsibilities before contacting me.",
          "Email jay@plannedbyjay.com to ask about your information or make a privacy request. You can use the same address if you need help identifying the organisation responsible for a New Travel or supplier record.",
        ],
        links: [
          {
            label: "Contact Jay about your information",
            href: "mailto:jay@plannedbyjay.com",
          },
        ],
      },
      {
        heading: "Holiday-offer enquiries",
        paragraphs: [
          "The short offer enquiry asks for your name and email address, with an optional telephone number and message. It also records the holiday you ask about: its offer reference, title, supplier, destination, travel dates, price and currency, priced adults and children, and any saved child-age assumptions, room, board and charge information relevant to that offer.",
          "The holiday details, submission time and internal request reference are recorded automatically. The snapshot keeps the details of your enquiry even if the advertised offer is later edited.",
          "When the form is unavailable, its answer fields are disabled and it does not submit or save your answers. You can still choose to contact me by email.",
        ],
      },
      {
        heading: "The Plan My Holiday brief",
        paragraphs: [
          "Plan My Holiday is currently a read-only preview. It does not submit, store or email your answers. Its existing privacy link uses this same notice.",
          "If enabled, the brief would ask about destinations, holiday style, party size, children’s ages, dates or flexibility, duration, departure preferences, total budget, priorities and how far ahead you are planning. It would also ask for your name, email and preferred contact method, with a telephone number if you want telephone contact. Its data handling will be confirmed under this notice before it accepts answers.",
          "The practical-requirements option is a request for a private discussion, not a request for medical details. Please do not put passport, payment, medical or disability details in either form’s free text. If detailed health information is needed later, we will explain why, who needs it and the additional legal condition or consent required before collecting or sharing it.",
          "If you provide information about other travellers, make sure they know about it and can read this notice. Only children’s ages needed for holiday pricing are requested in an initial enquiry, not their names or dates of birth.",
        ],
      },
      {
        heading: "Why information is used and the lawful bases",
        paragraphs: [
          "Responding to enquiries and discussing suitable holiday options serves our legitimate interests in helping people who contact us and providing the travel assistance they request. We limit the information used to what is needed and balance those interests against your privacy and rights.",
          "An initial enquiry is not a booking contract. Necessary information about other travellers is used under the legitimate interest in researching the party’s requested travel, taking their privacy and rights into account. If you decide to book, the relevant New Travel or supplier privacy information explains the use of passenger and booking details, including steps towards or performance of the applicable contract and any legal duties.",
          "Running a reliable website, preventing spam, keeping necessary enquiry correspondence, sending and recovering notifications, and investigating technical problems serve our legitimate interests in providing and protecting the service. Where a specific legal duty requires particular information, legal obligation is the basis for that limited use.",
          "Sending an enquiry does not subscribe you to marketing. These forms are not a newsletter sign-up or marketing-consent process. They do not make a booking, take payment or make automated booking decisions about you.",
        ],
      },
      {
        heading: "Storage, email notifications and access",
        paragraphs: [
          "Offer enquiries and their holiday snapshots are stored privately in Supabase, with access restricted to the authorised administrator and the protected service handling submissions. They are not public website records.",
          "Resend emails your contact details, message and holiday information to jay@plannedbyjay.com. The business mailbox uses Microsoft 365 through GoDaddy, and notifications use your supplied email as the reply address. Copies and delivery records can therefore exist in Supabase, Resend and the business mailbox.",
          "If email sending fails or is unconfirmed, Jay can review and retry the saved record privately. Older messages are checked before resending. A saved-enquiry confirmation does not promise email arrival. This describes the offer-enquiry system; the read-only Holiday Brief has no active submission connection.",
        ],
      },
      {
        heading: "Sharing with New Travel and travel suppliers",
        paragraphs: [
          "An initial website enquiry is not automatically forwarded to New Travel or the supplier named on a holiday. If you ask me to progress your plans, relevant information may be shared with New Travel and the travel suppliers needed to research a quote or arrange the holiday. I will explain who needs it and share only what is necessary for the step you request.",
          "New Travel and the relevant supplier may have their own responsibilities and privacy information for booking records. If additional passenger details are needed, I will explain what is required and how to provide them through the appropriate booking arrangements. These initial forms do not collect passport copies or payment details.",
          "The website, database, notification and mailbox providers also handle information needed to provide their services, including through their service providers. Information may also need to be disclosed where a specific legal requirement applies.",
        ],
      },
      {
        heading: "Where information is processed",
        paragraphs: [
          "The Supabase project is configured for Western Europe. Vercel hosts the website, with London configured for its functions and a global delivery network. These locations do not mean that all support, security or other provider processing stays in the UK or Europe.",
          "Resend’s Ireland sending region controls where mail is sent from; Resend stores email data in the United States. Microsoft 365 through GoDaddy and other providers may also involve processing outside the UK, depending on the applicable account and service arrangements.",
          "The providers’ published data-processing terms describe safeguards for international processing, including standard contractual clauses with the required UK transfer terms and, where applicable, recognised adequacy arrangements. Supabase and Resend include the UK Addendum to the EU Standard Contractual Clauses in their standard terms. GoDaddy publishes UK transfer terms for its services, and Microsoft publishes data-protection terms for Microsoft 365. Vercel also publishes UK transfer clauses in its data-processing addendum.",
          "These are the providers’ published terms, rather than a claim that separate agreements have been negotiated for every account or that every provider operation stays in Europe. The applicable protection depends on the service and transfer. You can read the terms below or email Jay to ask about the safeguards relevant to your information and how to obtain a copy.",
        ],
        links: [
          {
            label: "Supabase data locations and transfers",
            href: "https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq",
          },
          {
            label: "Resend security and data handling",
            href: "https://resend.com/security",
          },
          {
            label: "Supabase data-processing and UK transfer terms",
            href: "https://supabase.com/legal/customer-resources/data-processing-addendum",
          },
          {
            label: "Resend data-processing and UK transfer terms",
            href: "https://resend.com/legal/dpa",
          },
          {
            label: "Vercel data-processing and UK transfer terms",
            href: "https://vercel.com/legal/dpa",
          },
          {
            label: "GoDaddy data-processing and UK transfer terms",
            href: "https://www.godaddy.com/en-uk/legal/agreements/data-processing-addendum",
          },
          {
            label: "Microsoft 365 data-protection terms",
            href: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
          },
        ],
      },
      {
        heading: "How long information is kept",
        paragraphs: [
          "Inactive enquiries that have not led to a booking are reviewed and normally deleted 12 calendar months after our last meaningful customer contact. Jay carries out a manual review each month. This is a business retention rule, not an automatic deletion timer or a period required by law. Administrative edits and notification retries do not restart that contact period.",
          "An active enquiry, a booking, an unresolved dispute or a specific legal duty may justify keeping limited information longer. The reason and a further review date are recorded rather than keeping everything indefinitely. Booking records follow the applicable New Travel or supplier arrangements, and unnecessary website copies are removed when appropriate.",
          "Reviews include enquiry records, notification and mailbox copies. Provider logs and backups have their own retention arrangements: deleting a live enquiry does not instantly remove every backup or recall an email. Retained backups remain protected until dealt with under the provider’s lifecycle. You can ask Jay to review whether information is still needed.",
        ],
      },
      {
        heading: "Website security, cookies and technical information",
        paragraphs: [
          "Hosting and technical services handle information needed to deliver and secure the website, such as network addresses, request times, requested pages and browser information. Notification-error logs use an internal record reference and error code rather than your question or contact details.",
          "A hidden anti-spam field and a limit on repeated offer submissions help prevent misuse. The enquiry stores a keyed, coded value derived from the network address rather than the raw address. This is not anonymous data and follows the enquiry retention process. No CAPTCHA service is connected to these forms.",
          "The website application does not include advertising pixels, optional analytics or social-media tracking. It does not use localStorage or sessionStorage for enquiry answers. The offer request token is held in page memory for retries. Essential administrator sign-in cookies are used only for administration; visitors do not need an administrator account to browse or enquire.",
          "You can control cookies through your browser, although blocking necessary sign-in cookies can prevent administrator access. If non-essential tracking is introduced, its use and any legally required choices will be explained before it is used.",
        ],
        technologies: [
          {
            name: "Administrator sign-in cookies (sb-…-auth-token and any numbered parts)",
            provider: "Supabase Auth on this website",
            purpose:
              "Keeps the authorised administrator signed in and supports secure session handling.",
            duration:
              "The installed library sets a maximum of 400 days from a cookie write. Browser limits, session expiry or sign-out can end use sooner; this is not a promise of a 400-day login.",
          },
        ],
      },
      {
        heading: "Your choices and privacy rights",
        paragraphs: [
          "You can request access, correction, deletion or restriction of your information, and object to use based on legitimate interests. Where the law provides it, you can request a portable copy. If a separate use relies on consent, you can withdraw it without affecting earlier lawful use.",
          "Email jay@plannedbyjay.com with your request and enough detail to identify the information concerned, such as the email address used and holiday reference. We may need proportionate identity checks to protect your information. We normally respond within one month, subject to the applicable legal rules and any permitted extension, which we will explain.",
          "These rights depend on the circumstances and are not always absolute. If information must be kept for an identified legal obligation or another lawful reason, we will explain what is retained and why. Not providing the contact or travel information needed for a request may mean we cannot respond or research it; optional information can be left out.",
        ],
      },
      {
        heading: "Complaints and changes to this notice",
        paragraphs: [
          "Please contact Jay if you are concerned about how your information is used. You also have the right to complain to the Information Commissioner’s Office, the UK data protection regulator, using its online complaints service.",
          "This notice will be reviewed when the website or its data handling changes. The review date will appear on the published version. A change to this notice does not, by itself, activate an unavailable form.",
        ],
        links: [
          {
            label: "Raise a data protection concern with the ICO",
            href: "https://ico.org.uk/make-a-complaint/",
          },
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    approved: false,
    updatedAt: null,
    reviewRequired: [],
    sections: [],
  },
  "booking-information": {
    title: "Booking Information",
    approved: true,
    updatedAt: "2026-10-22",
    reviewRequired: [],
    sections: [
      {
        heading: "How holiday bookings work",
        paragraphs: [
          "Planned by Jay trades on behalf of New Travel Holidays Limited, an ABTA member (P8763). I research suitable holidays, discuss the options with you and help arrange bookings through New Travel Holidays. You deal directly with me about your plans.",
          "When I help you find a holiday, I’ll explain who you’re booking with and which terms and conditions apply.",
          "New Travel Holidays Limited is registered in England and Wales, company number 16135195, VAT number 482 4625 76. Its head office is The Landmark, 1 School Lane, Burnley, BB11 1UF. New Travel Holidays is a member of Advantage Travel Partnership.",
        ],
      },
      {
        heading: "An enquiry is the starting point",
        paragraphs: [
          "Sending a Holiday Brief asks me to review your requirements and get back to you. It is not a confirmed holiday booking, does not take a payment and does not create a travel contract.",
          "The enquiry reference identifies your enquiry only. It is not a booking confirmation, ticket or guarantee that any holiday is available at a particular price.",
        ],
      },
      {
        heading: "Existing package holidays",
        paragraphs: [
          "If you choose an existing package holiday from a tour operator, that operator’s applicable booking conditions will normally apply, alongside any relevant agency terms and disclosures. I’ll help you through the process, but responsibility for providing the package remains with the identified package organiser under the applicable arrangements and law.",
          "You’ll receive the relevant conditions before you commit. This page explains the process; it does not replace or override the terms for your particular booking.",
        ],
        links: [
          {
            label: "Ask Jay about the applicable booking conditions",
            href: "mailto:jay@plannedbyjay.com",
          },
        ],
      },
      {
        heading: "More specialised itineraries",
        paragraphs: [
          "For itineraries involving several travel services, the booking structure and responsibilities depend on how those arrangements are organised and sold. Researching or coordinating your options does not automatically make me the package organiser.",
          "Not every combination can automatically be booked. Before offering a newly assembled package, the appropriate New Travel approval and booking structure must be established, including who acts as organiser and takes on the applicable obligations. I’ll explain the conditions and financial protection before you commit.",
        ],
      },
      {
        heading: "ABTA and financial protection",
        paragraphs: [
          "Planned by Jay operates through New Travel Holidays Limited, whose ABTA membership number is P8763.",
          "Financial protection depends on the specific arrangements and the protection scheme that applies. A reference or logo does not mean that every flight, accommodation-only booking, cruise or package has identical protection.",
          "Any applicable protection and supporting documents will be explained for the holiday you choose before you commit. Do not assume that all holidays are ATOL protected; no ATOL licence number is claimed for Planned by Jay on this website.",
        ],
        links: [
          {
            label: "Check membership through the official ABTA member search",
            href: "https://www.abta.com/abta-member-search",
          },
          {
            label: "Official ABTA help and complaints information",
            href: "https://www.abta.com/help-and-complaints",
          },
        ],
      },
      {
        heading: "Questions about your arrangements",
        paragraphs: [
          "Email jay@plannedbyjay.com to discuss an enquiry or ask which booking information applies. If you already have a booking, include its reference so I can help direct your question to the appropriate party. Please do not email payment card details or passport copies with an initial question.",
        ],
        links: [
          {
            label: "Email Jay about your holiday",
            href: "mailto:jay@plannedbyjay.com",
          },
        ],
      },
    ],
  },
};

export function isPolicyPublished(policy: Policy) {
  return (
    policy.approved &&
    policy.reviewRequired.length === 0 &&
    !!policy.updatedAt &&
    policy.sections.length > 0
  );
}
export function approvedPolicyHref(key: PolicyKey): string | null {
  return isPolicyPublished(policies[key]) ? `/${key}` : null;
}
export function approvedPolicies() {
  return (Object.keys(policies) as PolicyKey[]).flatMap((key) => {
    const href = approvedPolicyHref(key);
    return href ? [{ href, label: policies[key].title }] : [];
  });
}
