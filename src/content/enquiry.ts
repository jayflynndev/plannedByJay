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
  eyebrow: 'Tell me what you’re planning',
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
      'This simply asks me to arrange a further private discussion. Please don’t share medical or disability details here.',
    phone:
      'Optional unless you prefer a telephone conversation. Include the country code for a non-UK number.',
    privacy:
      'Your details will be used to review and respond to your holiday enquiry and, where appropriate, help arrange your holiday through New Travel Holidays. You can find more information in the Privacy Policy. Sending an enquiry does not subscribe you to marketing.',
    privacyPending:
      'Privacy policy: awaiting the approved page. This is a launch dependency.',
    privacyLink: 'Read the privacy policy',
  },
  // The server supplies the privacy link only when the central policy is reviewed and published.
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
    optional: 'Choose an option',
    required: 'Required unless marked optional',
    progress: 'Holiday brief progress',
    step: 'Stage',
    of: 'of',
    review: 'Review your answers',
    edit: 'Edit',
  },
  messages:{unavailable:'Holiday enquiries are temporarily unavailable. This is a read-only preview: these fields cannot collect or send your information.'},
};
