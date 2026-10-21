'use client';
// @refresh reset
// A changed form/schema must get a fresh draft during Fast Refresh. Preserving an
// obsolete useState initializer can mix the old field shape with current validation.
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  enquiryContent as content,
  enquiryOptions as options,
} from '@/content/enquiry';
import {
  enquirySchema,
  fieldErrors,
  initialDraft,
  stepSchemas,
  type EnquiryDraft,
  type FieldErrors,
} from '@/lib/enquiries/schema';
import { optionLabel } from '@/lib/enquiries/email';
import { Field, ChoiceGroup, descriptionIds } from './Fields';
import { Turnstile } from './Turnstile';

/** All question copy: src/content/enquiry.ts. State stays in memory, never localStorage. */
export function EnquiryForm({
  enabled,
  turnstileSiteKey,
}: {
  enabled: boolean;
  turnstileSiteKey?: string;
}) {
  const [draft, setDraft] = useState<EnquiryDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [website, setWebsite] = useState('');
  const [token, setToken] = useState('');
  const [resetChallenge, setResetChallenge] = useState(0);
  const sendingLock = useRef(false);
  const submissionId = useRef<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const errorsRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const attemptedSteps = useRef(new Set<number>());
  const focusErrorSummary = useRef(false);
  const onToken = useCallback((value: string) => setToken(value), []);
  useEffect(() => {
    if (started.current) {
      titleRef.current?.focus({ preventScroll: true });
      titleRef.current?.scrollIntoView?.({ block: 'start' });
    } else started.current = true;
  }, [step]);
  useEffect(() => {
    if (focusErrorSummary.current && (Object.keys(errors).length || message)) {
      errorsRef.current?.focus({ preventScroll: true });
      errorsRef.current?.scrollIntoView?.({ block: 'start' });
      focusErrorSummary.current = false;
    }
  }, [errors, message]);
  useEffect(() => {
    if (reference) successRef.current?.focus();
  }, [reference]);
  // Revalidate only after Continue/Submit was attempted, without stealing input focus.
  const updateDraft = (next: EnquiryDraft) => {
    setDraft(next);
    if (attemptedSteps.current.has(step)) {
      const result = stepSchemas[step].safeParse(next);
      setErrors(result.success ? {} : fieldErrors(result.error));
    }
  };
  const set = <K extends keyof EnquiryDraft>(
    key: K,
    value: EnquiryDraft[K],
  ) => {
    updateDraft({ ...draft, [key]: value });
  };
  const changeStep = (value: number) => {
    setErrors({});
    setMessage('');
    attemptedSteps.current.delete(value);
    setStep(value);
  };
  function validateStage() {
    attemptedSteps.current.add(step);
    const parsed = stepSchemas[step].safeParse(draft);
    if (!parsed.success) {
      focusErrorSummary.current = true;
      setErrors(fieldErrors(parsed.error));
      return false;
    }
    setErrors({});
    return true;
  }
  const input = (
    key: keyof EnquiryDraft,
    label: string,
    settings: {
      type?: string;
      hint?: string;
      placeholder?: string;
      maxLength?: number;
      autoComplete?: string;
      required?: boolean;
    } = {},
  ) => {
    const id = String(key);
    return (
      <Field id={id} label={label} hint={settings.hint} errors={errors}>
        <input
          id={id}
          name={id}
          type={settings.type || 'text'}
          value={String(draft[key])}
          onChange={(event) => set(key, event.target.value as never)}
          min={key === 'adults' ? 1 : undefined}
          max={key === 'adults' ? 50 : undefined}
          step={settings.type === 'number' ? 1 : undefined}
          maxLength={settings.maxLength}
          placeholder={settings.placeholder}
          autoComplete={settings.autoComplete}
          required={settings.required ?? true}
          aria-invalid={!!errors[id]}
          aria-describedby={descriptionIds(id, settings.hint, errors)}
        />
      </Field>
    );
  };
  const select = (
    key: keyof EnquiryDraft,
    label: string,
    list: readonly { value: string; label: string }[],
    hint?: string,
  ) => (
    <Field id={String(key)} label={label} hint={hint} errors={errors}>
      <select
        id={String(key)}
        name={String(key)}
        value={String(draft[key])}
        onChange={(event) => set(key, event.target.value as never)}
        required
        aria-invalid={!!errors[key]}
        aria-describedby={descriptionIds(String(key), hint, errors)}
      >
        <option value="">{content.controls.optional}</option>
        {list.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
  const radios = (
    key: keyof EnquiryDraft,
    label: string,
    list: readonly { value: string; label: string }[],
    hint?: string,
  ) => (
    <ChoiceGroup
      id={String(key)}
      label={label}
      options={list}
      value={String(draft[key])}
      onChange={(value) => set(key, value as never)}
      hint={hint}
      errors={errors}
    />
  );
  const area = (
    key: 'preferences' | 'flexibleNotes',
    label: string,
    hint?: string,
    placeholder?: string,
    maxLength = 2000,
  ) => (
    <Field id={key} label={label} hint={hint} errors={errors}>
      <textarea
        id={key}
        name={key}
        value={draft[key]}
        onChange={(event) => set(key, event.target.value)}
        rows={4}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={!!errors[key]}
        aria-describedby={descriptionIds(key, hint, errors)}
      />
    </Field>
  );
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (sendingLock.current) return;
    if (!validateStage()) return;
    if (step < 2) {
      changeStep(step + 1);
      return;
    }
    const parsed = enquirySchema.safeParse(draft);
    if (!parsed.success) {
      const nextErrors = fieldErrors(parsed.error);
      const failingStep = stepSchemas.findIndex(
        (schema) => !schema.safeParse(draft).success,
      );
      setStep(Math.max(0, failingStep));
      focusErrorSummary.current = true;
      setErrors(nextErrors);
      return;
    }
    focusErrorSummary.current = true;
    if (!enabled) {
      setMessage(content.messages.unavailable);
      return;
    }
    if (turnstileSiteKey && !token) {
      setMessage(content.messages.challenge);
      return;
    }
    sendingLock.current = true;
    focusErrorSummary.current = true;
    setSending(true);
    setMessage('');
    submissionId.current ??= crypto.randomUUID();
    try {
      const session = await fetch('/api/enquiries/session', {
        credentials: 'same-origin',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (!session.ok) {
        setMessage(content.messages.session);
        return;
      }
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          submissionId: submissionId.current,
          brief: draft,
          website,
          turnstileToken: token,
        }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (response.ok && typeof result.reference === 'string') {
        setReference(result.reference);
        return;
      }
      if (
        result.code === 'validation' &&
        result.errors &&
        typeof result.errors === 'object'
      ) {
        setErrors(result.errors);
        const failingStep = stepSchemas.findIndex(
          (schema) => !schema.safeParse(draft).success,
        );
        if (failingStep >= 0) setStep(failingStep);
      } else {
        const safeMessages: Record<string, string> = {
          unavailable: content.messages.unavailable,
          conflict: content.messages.conflict,
          rateLimit: content.messages.rateLimit,
          session: content.messages.session,
          spam: content.messages.spam,
        };
        setMessage(safeMessages[result.code] || content.messages.failure);
      }
    } catch {
      setMessage(content.messages.failure);
    } finally {
      sendingLock.current = false;
      setSending(false);
      setResetChallenge((value) => value + 1);
    }
  }
  function focusField(id: string) {
    const element = document.getElementById(id);
    const focusable = element?.matches('fieldset')
      ? element.querySelector<HTMLElement>('input,select,textarea')
      : element;
    focusable?.focus({ preventScroll: true });
    focusable?.scrollIntoView?.({ block: 'start' });
  }
  function keepFocusBelowHeader(event: React.FocusEvent<HTMLFormElement>) {
    const header = document
      .querySelector('.site-header')
      ?.getBoundingClientRect();
    if (!header?.height) return;
    const top = event.target.getBoundingClientRect().top;
    if (top < header.bottom + 16)
      window.scrollBy({ top: top - header.bottom - 16, behavior: 'auto' });
  }
  const fieldLabel = (key: string) =>
    key.startsWith('childrenAges.')
      ? `${content.fields.agePrefix} ${Number(key.split('.')[1]) + 1} ${content.fields.ageSuffix}`
      : content.fields[key as keyof typeof content.fields] || key;
  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopyStatus(content.messages.referenceCopied);
    } catch {
      setCopyStatus(content.messages.referenceCopyFailed);
    }
  }
  if (reference)
    return (
      <div className="enquiry-success" ref={successRef} tabIndex={-1}>
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <h2>{content.messages.successTitle}</h2>
        <p className="intro">{content.messages.success}</p>
        <p className="eyebrow">{content.controls.reference}</p>
        <p className="enquiry-reference">{reference}</p>
        <p className="reference-note">{content.messages.referenceNote}</p>
        <button
          className="button button-secondary"
          type="button"
          onClick={copyReference}
        >
          {content.messages.copyReference}
        </button>
        <p className="reference-copy-status" role="status">
          {copyStatus}
        </p>
        <Link className="button" href="/">
          {content.messages.successLink}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    );
  return (
    <div className="enquiry-form-wrap">
      <ol className="form-progress" aria-label={content.controls.progress}>
        {content.steps.map((item, index) => (
          <li
            key={item.title}
            aria-current={step === index ? 'step' : undefined}
            className={index <= step ? 'active' : ''}
          >
            <span aria-hidden="true">{index < step ? '✓' : index + 1}</span>
            <span>{item.title}</span>
          </li>
        ))}
      </ol>
      {!enabled && (
        <p className="form-notice" role="status">
          {content.messages.unavailable}
        </p>
      )}
      <form
        onSubmit={send}
        onFocusCapture={keepFocusBelowHeader}
        noValidate
        aria-busy={sending}
      >
        <div className="stage-heading">
          <p className="eyebrow">
            {content.controls.step} {step + 1} {content.controls.of} 3
          </p>
          <h2 ref={titleRef} tabIndex={-1}>
            {content.steps[step].title}
          </h2>
          <p>{content.steps[step].description}</p>
          <small>{content.controls.required}</small>
        </div>
        {(Object.keys(errors).length > 0 || message) && (
          <div
            className="error-summary"
            role="alert"
            tabIndex={-1}
            ref={errorsRef}
          >
            <h3>
              {Object.keys(errors).length
                ? content.messages.errorsTitle
                : message}
            </h3>
            {Object.keys(errors).length > 0 && (
              <ul>
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>
                    <button type="button" onClick={() => focusField(key)}>
                      {fieldLabel(key)}: {error}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <fieldset className="stage-fields" disabled={sending}>
          {step === 0 && (
            <>
              {radios(
                'destinationChoice',
                content.fields.destinationChoice,
                options.destination,
              )}
              {draft.destinationChoice &&
                draft.destinationChoice !== 'open' &&
                input('destinationIdeas', content.fields.destinationIdeas, {
                  maxLength: 500,
                  placeholder: content.placeholders.destination,
                })}
              {select(
                'holidayType',
                content.fields.holidayType,
                options.holiday,
              )}
              <div className="form-field">
                <h3 className="travellers-heading">
                  {content.fields.travellers}
                </h3>
                <div className="form-two-columns">
                  {input('adults', content.fields.adults, { type: 'number' })}
                  <Field
                    id="children"
                    label={content.fields.children}
                    errors={errors}
                  >
                    <input
                      id="children"
                      type="number"
                      min={0}
                      max={20}
                      step={1}
                      value={draft.children}
                      required
                      aria-invalid={!!errors.children}
                      aria-describedby={descriptionIds(
                        'children',
                        undefined,
                        errors,
                      )}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateDraft({
                          ...draft,
                          children: value,
                          childrenAges: Array.from(
                            {
                              length: Math.max(
                                0,
                                Math.min(20, Number(value) || 0),
                              ),
                            },
                            (_, index) => draft.childrenAges[index] ?? '',
                          ),
                        });
                      }}
                    />
                  </Field>
                </div>
              </div>
              {Number(draft.children) > 0 && (
                <fieldset id="childrenAges" className="form-field">
                  <legend>{content.fields.childrenAges}</legend>
                  <p id="childrenAges-hint" className="field-hint">
                    {content.hints.ages}
                  </p>
                  <div className="age-grid">
                    {draft.childrenAges.map((age, index) => {
                      const id = `childrenAges.${index}`;
                      return (
                        <Field
                          key={id}
                          id={id}
                          label={`${content.fields.agePrefix} ${index + 1} ${content.fields.ageSuffix}`}
                          errors={errors}
                        >
                          <input
                            id={id}
                            type="number"
                            min={0}
                            max={17}
                            step={1}
                            required
                            value={age}
                            aria-invalid={!!errors[id]}
                            aria-describedby={`childrenAges-hint ${errors[id] ? `${id}-error` : ''}`}
                            onChange={(event) =>
                              set(
                                'childrenAges',
                                draft.childrenAges.map((item, i) =>
                                  i === index ? event.target.value : item,
                                ),
                              )
                            }
                          />
                        </Field>
                      );
                    })}
                  </div>
                  {errors.childrenAges && (
                    <p className="field-error">{errors.childrenAges}</p>
                  )}
                </fieldset>
              )}
            </>
          )}
          {step === 1 && (
            <>
              {radios(
                'dateChoice',
                content.fields.dateChoice,
                options.dates,
                content.hints.dates,
              )}
              {draft.dateChoice === 'specific' && (
                <div className="form-two-columns">
                  {input('startDate', content.fields.startDate, {
                    type: 'date',
                  })}
                  {input('endDate', content.fields.endDate, { type: 'date' })}
                </div>
              )}
              {draft.dateChoice === 'approximate' &&
                input('travelPeriod', content.fields.travelPeriod, {
                  maxLength: 200,
                  placeholder: content.placeholders.period,
                })}
              {draft.dateChoice === 'flexible' &&
                area(
                  'flexibleNotes',
                  content.fields.flexibleNotes,
                  undefined,
                  undefined,
                  300,
                )}
              {select('duration', content.fields.duration, options.duration)}
              {input(
                'departurePreferences',
                content.fields.departurePreferences,
                {
                  hint: content.hints.departurePreferences,
                  placeholder: content.placeholders.departurePreferences,
                  maxLength: 300,
                  required: false,
                },
              )}
              {select(
                'budget',
                content.fields.budget,
                options.budget,
                content.hints.budget,
              )}
              {area(
                'preferences',
                content.fields.preferences,
                content.hints.preferences,
                content.placeholders.preferences,
              )}
              <div className="requirements-box">
                <label className="check-option">
                  <input
                    type="checkbox"
                    checked={draft.requirementsDiscussion}
                    onChange={(event) =>
                      set('requirementsDiscussion', event.target.checked)
                    }
                    aria-describedby="requirements-hint"
                  />
                  <span>{content.fields.requirementsDiscussion}</span>
                </label>
                <p id="requirements-hint" className="field-hint">
                  {content.hints.requirements}
                </p>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              {input('name', content.fields.name, {
                autoComplete: 'name',
                maxLength: 100,
              })}
              {input('email', content.fields.email, {
                type: 'email',
                autoComplete: 'email',
                maxLength: 254,
              })}
              {radios(
                'contactMethod',
                content.fields.contactMethod,
                options.contact,
              )}
              {input(
                'phone',
                `${content.fields.phone}${draft.contactMethod === 'email' ? ' (optional)' : ''}`,
                {
                  type: 'tel',
                  autoComplete: 'tel',
                  hint: content.hints.phone,
                  maxLength: 40,
                  required: draft.contactMethod === 'telephone',
                },
              )}
              {radios('intention', content.fields.intention, options.intention)}
              <div className="brief-review">
                <h3>{content.controls.review}</h3>
                <div className="review-heading">
                  <strong>{content.steps[0].title}</strong>
                  <button type="button" onClick={() => changeStep(0)}>
                    {content.controls.edit}{' '}
                    <span className="sr-only">{content.steps[0].title}</span>
                  </button>
                </div>
                <p>
                  {optionLabel(options.destination, draft.destinationChoice)}{' '}
                  {draft.destinationChoice !== 'open' && draft.destinationIdeas}
                </p>
                <p>
                  {optionLabel(options.holiday, draft.holidayType)} ·{' '}
                  {content.fields.adults}: {draft.adults} ·{' '}
                  {content.fields.children}: {draft.children}
                  {draft.childrenAges.length > 0 &&
                    ` · ${content.review.ages}: ${draft.childrenAges.join(', ')}`}
                </p>
                <div className="review-heading">
                  <strong>{content.steps[1].title}</strong>
                  <button type="button" onClick={() => changeStep(1)}>
                    {content.controls.edit}{' '}
                    <span className="sr-only">{content.steps[1].title}</span>
                  </button>
                </div>
                <p>
                  {draft.dateChoice === 'specific'
                    ? `${draft.startDate} — ${draft.endDate}`
                    : draft.dateChoice === 'approximate'
                      ? draft.travelPeriod
                      : `${optionLabel(options.dates, draft.dateChoice)} ${draft.flexibleNotes}`}{' '}
                  · {optionLabel(options.duration, draft.duration)}
                </p>
                <p>
                  {draft.departurePreferences.trim() ||
                    content.review.noDeparture}
                </p>
                <p>
                  {content.fields.budget}:{' '}
                  {optionLabel(options.budget, draft.budget)}
                </p>
                {draft.preferences && <p>{draft.preferences}</p>}
                {draft.requirementsDiscussion && (
                  <p>{content.fields.requirementsDiscussion}</p>
                )}
              </div>
              <div className="privacy-note">
                <p>{content.hints.privacy}</p>
                {content.privacyHref ? (
                  <Link href={content.privacyHref}>
                    {content.hints.privacyLink}
                  </Link>
                ) : (
                  <p className="privacy-pending">
                    {content.hints.privacyPending}
                  </p>
                )}
              </div>
              {enabled && turnstileSiteKey && (
                <Turnstile
                  siteKey={turnstileSiteKey}
                  resetKey={resetChallenge}
                  onToken={onToken}
                />
              )}
            </>
          )}
        </fieldset>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">{content.controls.honeypot}</label>
          <input
            id="website"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            maxLength={200}
          />
        </div>
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button button-secondary"
              disabled={sending}
              onClick={() => changeStep(step - 1)}
            >
              {content.controls.back}
            </button>
          )}
          <button
            type="submit"
            className="button"
            disabled={sending || (step === 2 && !enabled)}
          >
            {sending
              ? content.controls.submitting
              : step === 2
                ? content.controls.submit
                : content.controls.next}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
