import { z } from 'zod';
import { enquiryOptions } from '../../content/enquiry';

const choice = <T extends string>(options: readonly { value: T }[]) =>
  z.enum(
    options.map((option) => option.value),
    { error: 'Please choose an option.' },
  );
const text = (limit: number) =>
  z.string().trim().max(limit, `Please use no more than ${limit} characters.`);
const wholeNumber = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d{1,2}$/, 'Enter a whole number.')
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(min, `Enter at least ${min}.`)
        .max(max, `Enter no more than ${max}.`),
    );
const date = text(10).refine(
  (value) =>
    !value ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value),
  'Enter a valid date.',
);
const telephone = text(40).refine(
  (value) =>
    !value ||
    (/^\+?[\d\s().-]+$/.test(value) &&
      value.replace(/\D/g, '').length >= 7 &&
      value.replace(/\D/g, '').length <= 15),
  'Enter a telephone number with 7–15 digits.',
);

export const holidaySchema = z
  .object({
    destinationChoice: choice(enquiryOptions.destination),
    destinationIdeas: text(500),
    holidayType: choice(enquiryOptions.holiday),
    adults: wholeNumber(1, 50),
    children: wholeNumber(0, 20),
    childrenAges: z.array(wholeNumber(0, 17)).max(20),
  })
  .superRefine((value, context) => {
    if (value.destinationChoice !== 'open' && !value.destinationIdeas)
      context.addIssue({
        code: 'custom',
        path: ['destinationIdeas'],
        message: 'Tell us your destination or a few ideas.',
      });
    if (value.childrenAges.length !== value.children)
      context.addIssue({
        code: 'custom',
        path: ['childrenAges'],
        message: 'Add an age for each child at the time of travel.',
      });
  });
export const detailsSchema = z
  .object({
    dateChoice: choice(enquiryOptions.dates),
    startDate: date,
    endDate: date,
    travelPeriod: text(200),
    flexibleNotes: text(300),
    duration: choice(enquiryOptions.duration),
    departurePreferences: text(300),
    budget: choice(enquiryOptions.budget),
    preferences: text(2000),
    requirementsDiscussion: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.dateChoice === 'specific') {
      if (!value.startDate)
        context.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: 'Choose a departure date.',
        });
      if (!value.endDate)
        context.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'Choose a return date.',
        });
      if (value.endDate && value.startDate && value.endDate < value.startDate)
        context.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'The return date must be on or after departure.',
        });
      // UK date, not the server machine's timezone. Past exact dates cannot form a new brief.
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      if (value.startDate && value.startDate < today)
        context.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: 'Choose today or a future departure date.',
        });
    }
    if (value.dateChoice === 'approximate' && !value.travelPeriod)
      context.addIssue({
        code: 'custom',
        path: ['travelPeriod'],
        message: 'Tell us an approximate month or period.',
      });
  });
export const contactSchema = z
  .object({
    name: text(100).min(2, 'Enter your name.'),
    email: text(254)
      .email('Enter a valid email address.')
      .transform((value) => value.toLowerCase()),
    phone: telephone,
    contactMethod: choice(enquiryOptions.contact),
    intention: choice(enquiryOptions.intention),
  })
  .superRefine((value, context) => {
    if (value.contactMethod === 'telephone' && !value.phone)
      context.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Add a telephone number so Jay can call you.',
      });
  });
export const enquirySchema = z
  .object({
    ...holidaySchema.shape,
    ...detailsSchema.shape,
    ...contactSchema.shape,
  })
  .strict()
  .superRefine((value, context) => {
    // Reuse step validation on the server; no separate rules that can drift from the form.
    const input = {
      ...value,
      adults: String(value.adults),
      children: String(value.children),
      childrenAges: value.childrenAges.map(String),
    };
    for (const schema of [holidaySchema, detailsSchema, contactSchema]) {
      const result = schema.safeParse(input);
      if (!result.success) {
        for (const issue of result.error.issues)
          context.addIssue({
            code: 'custom',
            path: issue.path,
            message: issue.message,
          });
      }
    }
  })
  .transform((value) => ({
    ...value,
    destinationIdeas:
      value.destinationChoice === 'open' ? '' : value.destinationIdeas,
    startDate: value.dateChoice === 'specific' ? value.startDate : '',
    endDate: value.dateChoice === 'specific' ? value.endDate : '',
    travelPeriod: value.dateChoice === 'approximate' ? value.travelPeriod : '',
    flexibleNotes: value.dateChoice === 'flexible' ? value.flexibleNotes : '',
  }));
export const submissionSchema = z
  .object({
    submissionId: z.uuid(),
    brief: enquirySchema,
    website: z.string().max(200),
    turnstileToken: z.string().max(2048).optional(),
  })
  .strict();
export type Enquiry = z.output<typeof enquirySchema>;
export type EnquiryDraft = {
  destinationChoice: string;
  destinationIdeas: string;
  holidayType: string;
  adults: string;
  children: string;
  childrenAges: string[];
  dateChoice: string;
  startDate: string;
  endDate: string;
  travelPeriod: string;
  flexibleNotes: string;
  duration: string;
  departurePreferences: string;
  budget: string;
  preferences: string;
  requirementsDiscussion: boolean;
  name: string;
  email: string;
  phone: string;
  contactMethod: string;
  intention: string;
};
export const initialDraft: EnquiryDraft = {
  destinationChoice: '',
  destinationIdeas: '',
  holidayType: '',
  adults: '1',
  children: '0',
  childrenAges: [],
  dateChoice: '',
  startDate: '',
  endDate: '',
  travelPeriod: '',
  flexibleNotes: '',
  duration: '',
  departurePreferences: '',
  budget: '',
  preferences: '',
  requirementsDiscussion: false,
  name: '',
  email: '',
  phone: '',
  contactMethod: 'email',
  intention: '',
};
export const stepSchemas = [holidaySchema, detailsSchema, contactSchema];
export type FieldErrors = Record<string, string>;
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
