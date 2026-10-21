// EDIT HERE: Labels and options. Keep option values stable: they are stored in enquiries.
// Adding/removing options here also updates validation. Behaviour changes belong in lib/enquiries/schema.ts.
export const enquiryOptions = {
  destination: [
    { value: 'known', label: 'I know where I want to go.' },
    { value: 'ideas', label: 'I have a few destinations in mind.' },
    { value: 'open', label: 'I’m open to suggestions.' },
  ],
  holiday: [
    { value: 'beach', label: 'Beach or resort holiday' },
    { value: 'family', label: 'Family holiday' },
    { value: 'cruise', label: 'Cruise' },
    { value: 'city', label: 'City break' },
    { value: 'touring', label: 'Touring or multi-centre holiday' },
    { value: 'different', label: 'Something different' },
    { value: 'unsure', label: 'Not sure yet' },
  ],
  dates: [
    { value: 'specific', label: 'Specific dates' },
    { value: 'approximate', label: 'An approximate month or period' },
    { value: 'flexible', label: 'Flexible dates' },
  ],
  duration: [
    { value: 'short', label: 'Short break, 1–4 nights' },
    { value: 'seven', label: 'Around 7 nights' },
    { value: 'ten', label: 'Around 10–11 nights' },
    { value: 'fourteen', label: 'Around 14 nights' },
    { value: 'longer', label: 'Longer or flexible' },
  ],
  budget: [
    { value: 'under-1000', label: 'Under £1,000' },
    { value: '1000-2000', label: '£1,000–£2,000' },
    { value: '2000-3000', label: '£2,000–£3,000' },
    { value: '3000-5000', label: '£3,000–£5,000' },
    { value: '5000-8000', label: '£5,000–£8,000' },
    { value: '8000-plus', label: '£8,000+' },
    { value: 'guidance', label: 'Not sure, I’d like some guidance' },
  ],
  contact: [
    { value: 'email', label: 'Email' },
    { value: 'telephone', label: 'Telephone' },
  ],
  intention: [
    {
      value: 'ready',
      label: 'I’m ready to book when we find the right holiday.',
    },
    { value: 'soon', label: 'I’m planning a holiday for the coming months.' },
    { value: 'future', label: 'I’m exploring ideas for a future trip.' },
  ],
} as const;

export const enquiryContent = {
  metadata: {
    title: 'Plan My Holiday | Planned by Jay',
    description:
      'Tell Jay about your holiday ideas, dates, travellers and priorities in a simple three-stage holiday brief.',
  },
  eyebrow: 'Your next holiday starts with a conversation',
  title: 'Let’s plan your holiday.',
  description:
    'Tell me a little about the holiday you’re planning. You don’t need to have everything worked out, but the more you can tell me about what matters to you, the better I can help.',
  asideTitle: 'A brief, not a booking.',
  asidePoints: [
    'A destination in mind — or an open mind.',
    'A budget that works for your whole party.',
    'The details that make a holiday right for you.',
  ],
  asideNote:
    'No payment, passport details or commitment to book. Just a useful starting point.',
  steps: [
    {
      title: 'Your holiday',
      description: 'The big picture: where, what and who.',
    },
    {
      title: 'The details',
      description: 'Dates, departure options and what matters most.',
    },
    {
      title: 'About you',
      description: 'How to get in touch and where you are in your planning.',
    },
  ],
  fields: {
    destinationChoice: 'Where would you like to go?',
    destinationIdeas: 'Tell me your destination or ideas',
    holidayType: 'What type of holiday are you considering?',
    adults: 'Number of adults',
    children: 'Number of children',
    childrenAges: 'Children’s ages at the time of travel',
    agePrefix: 'Child',
    ageSuffix: 'age at travel',
    dateChoice: 'When would you like to travel?',
    startDate: 'Preferred departure date',
    endDate: 'Preferred return date',
    travelPeriod: 'Approximate month or period',
    flexibleNotes: 'Any timing preferences? (optional)',
    duration: 'How long would you like to go for?',
    departurePreferences: 'Where would you prefer to travel from?',
    travellers: "Who's travelling?",
    budget: 'Approximate total holiday budget',
    preferences: 'What matters most to you? (optional)',
    requirementsDiscussion:
      'I have accessibility or other practical requirements I’d like to discuss.',
    name: 'Your name',
    email: 'Email address',
    phone: 'Telephone number',
    contactMethod: 'Preferred contact method',
    intention: 'Where are you in your holiday planning?',
  },
  hints: {
    ages: 'Age in whole years at departure; use 0 for a baby under one. No names or dates of birth needed.',
    dates:
      'Choose the option that best fits your plans. Exact dates aren’t needed for approximate or flexible travel.',
    departurePreferences:
      "Include any airports or ports you're happy to use. Leave blank if unsure.",
    budget:
      'This is the total budget for everyone travelling, not a per-person amount. There is no minimum budget.',
    preferences:
      'Please keep this to holiday preferences. Don’t include passport, payment or detailed medical information.',
    requirements:
      'This simply asks Jay to arrange a further private discussion. Please don’t share medical or disability details here.',
    phone:
      'Optional unless you prefer a telephone conversation. Include the country code for a non-UK number.',
    privacy:
      'Your holiday brief and contact details will be stored securely for Jay to review, and a summary will be emailed to the business so Jay can respond to your enquiry. This form does not subscribe you to marketing.',
    privacyPending:
      'Privacy policy: awaiting the approved page. This is a launch dependency.',
    privacyLink: 'Read the privacy policy',
  },
  // Set only after the approved privacy page exists. This phase does not create that page.
  privacyHref: null as string | null,
  placeholders: {
    departurePreferences: 'e.g. Manchester, Liverpool or flexible',
    destination: 'For example, Italy or a few ideas in Europe',
    period: 'For example, August 2027 or the autumn school holidays',
    preferences:
      'All-inclusive accommodation, children’s activities, a quieter resort, short transfers or particular facilities…',
  },
  review: {
    noDeparture: 'Departure options not specified',
    ages: 'Ages at travel',
  },
  controls: {
    back: 'Back',
    next: 'Continue',
    submit: 'Send My Holiday Brief',
    submitting: 'Sending your brief…',
    optional: 'Choose an option',
    required: 'Required unless marked optional',
    progress: 'Holiday brief progress',
    step: 'Stage',
    of: 'of',
    review: 'Review your answers',
    edit: 'Edit',
    reference: 'Your enquiry reference',
    honeypot: 'Leave this field empty',
  },
  messages: {
    unavailable:
      'You can explore the holiday brief, but submissions aren’t open yet. Contact details and the privacy policy will be confirmed before launch.',
    errorsTitle: 'Please check the following details.',
    failure:
      'We couldn’t confirm receipt of your brief. Your answers are still here. Please try again with the same details; this won’t create a second enquiry if the first attempt was received.',
    conflict:
      'An earlier version of this brief may already have been received. Please restore your previous answers and retry, or contact Jay before sending another enquiry.',
    rateLimit:
      'There have been several enquiries from this session or email address recently. Please wait an hour before trying again.',
    session:
      'We couldn’t prepare a secure submission. Check that cookies are allowed, then try again.',
    spam: 'We couldn’t verify this submission. Please refresh the page and try again.',
    successTitle: 'Thank you, your holiday enquiry has been received.',
    success:
      "I'll review the details you've provided and get back to you using your preferred contact method.",
    referenceNote:
      "You don't need to remember this number, but it's useful if you contact me about your enquiry.",
    copyReference: 'Copy reference',
    referenceCopied: 'Reference copied',
    referenceCopyFailed:
      'Copy was unavailable. You can select and copy the reference above.',
    successLink: 'Back to the homepage',
    challenge: 'Please complete the verification before sending your brief.',
    challengeFailure: 'Verification is unavailable. Please try again later.',
  },
};
