'use client';
import Link from 'next/link';
import {useRef,useState,useEffect} from 'react';
import {enquiryContent as content,enquiryOptions as options} from '@/content/enquiry';
import {optionLabel} from '@/lib/presentation';
import {Field,ChoiceGroup,descriptionIds} from './Fields';
import {emptyBrief,briefErrors,stageFields,isBespokeReference,type EnquiryDraft} from '@/lib/enquiries/schema';
export function EnquiryForm({privacyHref=null,enabled=false}:{privacyHref?:string|null;enabled?:boolean}){
 const [step,setStep]=useState(0);const titleRef=useRef<HTMLHeadingElement>(null),previousStep=useRef(0);
 const [draft,setDraft]=useState(emptyBrief),[errors,setErrors]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[failure,setFailure]=useState('');
 const [receipt,setReceipt]=useState<{reference:string;notification:string}|null>(null);
 const working=useRef(false),requestId=useRef(''),honeypot=useRef<HTMLInputElement>(null);
 const available=enabled&&!!privacyHref;
 useEffect(()=>{
   titleRef.current?.focus({preventScroll:true});
   if(previousStep.current!==step)titleRef.current?.scrollIntoView?.({block:'start'});
   previousStep.current=step;
 },[step]);
 function changeStep(next:number){if(!working.current){setErrors({});setFailure('');setStep(next);}}
 function update<K extends keyof EnquiryDraft>(key:K,value:EnquiryDraft[K]){requestId.current='';setDraft(current=>({...current,[key]:value}));setErrors({});setFailure('');}
 function focusError(found:Record<string,string>){const first=Object.keys(found)[0],field=document.getElementById(first);const target=field?.matches('input,select,textarea')?field:field?.querySelector<HTMLElement>('input,select,textarea');(target as HTMLElement|null)?.focus();target?.scrollIntoView?.({block:'center'});}
 async function submit(event:React.FormEvent){
   event.preventDefault();if(working.current||receipt)return;
   if(!available){if(step<2)setStep(step+1);return;}
   const found=briefErrors(draft,step<2?step:undefined);setErrors(found);
   if(Object.keys(found).length){
     const invalidStage=stageFields.findIndex(fields=>(fields as readonly string[]).includes(Object.keys(found)[0].split('.')[0]));
     if(invalidStage>=0&&invalidStage!==step)setStep(invalidStage);else focusError(found);return;
   }
   if(step<2){setStep(step+1);return;}
   working.current=true;setBusy(true);setFailure('');
   try{
     requestId.current ||= crypto.randomUUID();
     const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:requestId.current,brief:draft,website:honeypot.current?.value||''})});
     const result=await response.json();
     if(!response.ok||result.accepted!==true||!isBespokeReference(result.reference)||!['accepted','pending'].includes(result.notification)){
       if(result.errors&&typeof result.errors==='object'){
         const safe:Record<string,string>={};for(const [key,value] of Object.entries(result.errors))if(typeof value==='string')safe[key]=value;
         setErrors(safe);const invalidStage=stageFields.findIndex(fields=>(fields as readonly string[]).includes(Object.keys(safe)[0]?.split('.')[0]));if(invalidStage>=0)setStep(invalidStage);
       }
       throw new Error(result.error||'Your holiday brief could not be received. Your answers are retained here; please try again.');
     }
     setReceipt({reference:result.reference,notification:result.notification});
   }catch(error){setFailure(error instanceof Error?error.message:'Your holiday brief could not be received. Your answers are retained here; please try again.');}
   finally{working.current=false;setBusy(false);}
 }
 useEffect(()=>{if(receipt){titleRef.current?.focus({preventScroll:true});titleRef.current?.closest('.enquiry-success')?.scrollIntoView?.({block:'start'});}},[receipt]);
 if(receipt)return <div className="enquiry-success" role="status"><span className="success-mark" aria-hidden="true">✓</span><h2 ref={titleRef} tabIndex={-1}>Your holiday brief has been received.</h2><p className="intro">Jay will review your holiday ideas and get in touch using your contact details.</p><p>Enquiry reference</p><p className="enquiry-reference">{receipt.reference}</p>{receipt.notification==='pending'&&<p className="reference-note">Your brief is saved securely. Jay’s email notification is pending and can be recovered privately. You do not need to submit it again.</p>}<p className="reference-note">This is an enquiry, not a booking or a confirmation of holiday availability or prices.</p></div>;
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
          onChange={event=>update(key,event.target.value as EnquiryDraft[typeof key])}
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
        onChange={event=>update(key,event.target.value as EnquiryDraft[typeof key])}
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
      onChange={value=>update(key,value as EnquiryDraft[typeof key])}
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
        onChange={event=>update(key,event.target.value)}
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
      {!available&&(
        <p className="form-notice" role="status">
          {content.messages.unavailable}
        </p>
      )}
      <form
        onSubmit={submit}
        noValidate
        aria-label={available?'Holiday Brief':'Read-only Holiday Brief preview'}
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
        {failure&&<p className="form-notice" role="alert">{failure}</p>}
        <fieldset className="stage-fields" disabled={!available||busy}>
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
                      onChange={event=>{
                        const value=event.target.value,count=/^\d+$/.test(value)?Math.min(20,Number(value)):0;
                        requestId.current='';setDraft(current=>({...current,children:value,childrenAges:Array.from({length:count},(_,i)=>current.childrenAges[i]??'')}));setErrors({});
                      }}
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
                          <input
                            id={id}
                            type="number"
                            min={0}
                            max={17}
                            step={1}
                            required
                            value={age}
                            onChange={event=>update('childrenAges',draft.childrenAges.map((old,i)=>i===index?event.target.value:old))}
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
                  <input
                    type="checkbox"
                    checked={draft.requirementsDiscussion}
                    onChange={event=>update('requirementsDiscussion',event.target.checked)}
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
        <div className="honeypot" aria-hidden="true"><label htmlFor="brief-website">Leave this blank</label><input id="brief-website" name="website" ref={honeypot} tabIndex={-1} autoComplete="off" disabled={!available||busy}/></div>
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => changeStep(step - 1)}
            >
              {content.controls.back}
            </button>
          )}
          <button
            type="submit"
            className="button"
            disabled={busy||(!available&&step===2)}
          >
            {busy?'Sending your brief…':step===2?(available?'Send holiday brief':'Enquiries unavailable'):'View next stage'}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
