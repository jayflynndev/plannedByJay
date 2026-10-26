'use client';
import Link from 'next/link';
import {useRef,useState,useEffect} from 'react';
import {enquiryContent as content,enquiryOptions as options} from '@/content/enquiry';
import {optionLabel} from '@/lib/presentation';
import {Field,ChoiceGroup,descriptionIds} from './Fields';
type EnquiryDraft = {
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
const draft: EnquiryDraft = {
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
export function EnquiryForm({privacyHref=null}:{privacyHref?:string|null}){
 const [step,setStep]=useState(0);const titleRef=useRef<HTMLHeadingElement>(null);
 const errors:Record<string,string>={};
 useEffect(()=>{titleRef.current?.focus({preventScroll:true});},[step]);
 function changeStep(next:number){setStep(next);}
 function nextPreviewStage(event:React.FormEvent){event.preventDefault();if(step<2)setStep(step+1);}
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
        <input disabled
          id={id}
          name={id}
          type={settings.type || 'text'}
          value={String(draft[key])}

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
      <select disabled
        id={String(key)}
        name={String(key)}
        value={String(draft[key])}

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
      <textarea disabled
        id={key}
        name={key}
        value={draft[key]}

        rows={4}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={!!errors[key]}
        aria-describedby={descriptionIds(key, hint, errors)}
      />
    </Field>
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
      {(
        <p className="form-notice" role="status">
          {content.messages.unavailable}
        </p>
      )}
      <form
        onSubmit={nextPreviewStage}

        noValidate
        aria-label="Read-only Holiday Brief preview"
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
        <fieldset className="stage-fields" disabled>
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
                    <input disabled
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
                          <input disabled
                            id={id}
                            type="number"
                            min={0}
                            max={17}
                            step={1}
                            required
                            value={age}
                            aria-invalid={!!errors[id]}
                            aria-describedby={`childrenAges-hint ${errors[id] ? `${id}-error` : ''}`}

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
                  <input disabled
                    type="checkbox"
                    checked={draft.requirementsDiscussion}

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
                {privacyHref ? (
                  <Link href={privacyHref}>
                    {content.hints.privacyLink}
                  </Link>
                ) : (
                  <p className="privacy-pending">
                    {content.hints.privacyPending}
                  </p>
                )}
              </div>
            </>
          )}
        </fieldset>
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button button-secondary"
              disabled
              onClick={() => changeStep(step - 1)}
            >
              {content.controls.back}
            </button>
          )}
          <button
            type="submit"
            className="button"
            disabled={step === 2}
          >
            {step===2?'Enquiries unavailable':'View next stage'}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
