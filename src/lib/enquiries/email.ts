import { enquiryOptions } from '../../content/enquiry';
import type { Enquiry } from './schema';
export type NotificationEmail = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  html: string;
};
export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!,
  );
}
/** Render once before persistence. The immutable email snapshot keeps provider idempotency stable on retries. */
export function buildNotification(
  brief: Enquiry,
  reference: string,
  receivedAt: string,
  sender: string,
  recipient: string,
): NotificationEmail {
  const holiday = optionLabel(enquiryOptions.holiday, brief.holidayType);
  const period =
    brief.dateChoice === 'specific'
      ? `${brief.startDate} to ${brief.endDate}`
      : brief.dateChoice === 'approximate'
        ? brief.travelPeriod
        : 'Flexible dates';
  const rows: [string, string][] = [
    ['Enquiry reference', reference],
    ['Received (UTC)', receivedAt],
    ['Customer name', brief.name],
    ['Email', brief.email],
    ['Telephone', brief.phone || 'Not supplied'],
    [
      'Preferred contact',
      optionLabel(enquiryOptions.contact, brief.contactMethod),
    ],
    [
      'Destination approach',
      optionLabel(enquiryOptions.destination, brief.destinationChoice),
    ],
    ['Destination ideas', brief.destinationIdeas || 'Open to suggestions'],
    ['Holiday type', holiday],
    ['Adults', String(brief.adults)],
    ['Children', String(brief.children)],
    [
      'Children’s ages at travel',
      brief.childrenAges.join(', ') || 'Not applicable',
    ],
    ['Travel dates / period', period],
    ['Flexible timing preferences', brief.flexibleNotes || 'Not supplied'],
    ['Duration', optionLabel(enquiryOptions.duration, brief.duration)],
    ['Departure preferences', brief.departurePreferences || 'Not specified'],
    ['Total party budget', optionLabel(enquiryOptions.budget, brief.budget)],
    ['Important preferences', brief.preferences || 'Not supplied'],
    [
      'Further private requirements discussion',
      brief.requirementsDiscussion
        ? 'Requested — discuss privately; no medical details collected'
        : 'Not requested',
    ],
    [
      'Planning intention',
      optionLabel(enquiryOptions.intention, brief.intention),
    ],
  ];
  // Subject cannot carry user-supplied line breaks, and is kept short even for free-text periods.
  const subject = `New Holiday Enquiry | ${holiday} | ${period}`
    .replace(/[\r\n]/g, ' ')
    .slice(0, 150);
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n\n');
  const html = `<!doctype html><html lang="en-GB"><body style="font-family:Arial,sans-serif;color:#183e36;background:#f8f6ef;padding:24px"><h1 style="font-family:Georgia,serif;font-weight:normal">New holiday enquiry</h1><p>A holiday brief has been received. Reply to this email to contact the customer.</p><table style="border-collapse:collapse;width:100%;max-width:760px">${rows.map(([label, value]) => `<tr><th scope="row" style="text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #d7dcd2;width:35%">${escapeHtml(label)}</th><td style="padding:12px;border-bottom:1px solid #d7dcd2;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join('')}</table><p>This is an enquiry, not a booking. Provider acceptance is not confirmation of inbox delivery.</p></body></html>`;
  return {
    from: sender,
    to: [recipient],
    reply_to: brief.email,
    subject,
    text,
    html,
  };
}
