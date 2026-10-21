'use client';
import type { FieldErrors } from '@/lib/enquiries/schema';
type Option = { value: string; label: string };
export function Field({
  id,
  label,
  hint,
  errors,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  errors: FieldErrors;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {children}
      {errors[id] && (
        <p className="field-error" id={`${id}-error`}>
          {errors[id]}
        </p>
      )}
    </div>
  );
}
export function descriptionIds(
  id: string,
  hint: string | undefined,
  errors: FieldErrors,
) {
  return (
    [hint && `${id}-hint`, errors[id] && `${id}-error`]
      .filter(Boolean)
      .join(' ') || undefined
  );
}
export function ChoiceGroup({
  id,
  label,
  options,
  value,
  onChange,
  hint,
  errors,
}: {
  id: string;
  label: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  errors: FieldErrors;
}) {
  return (
    <fieldset
      id={id}
      className="form-field choice-group"
      aria-describedby={descriptionIds(id, hint, errors)}
      aria-invalid={!!errors[id]}
    >
      <legend>{label}</legend>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <div className="choice-options">
        {options.map((option) => (
          <label
            key={option.value}
            className={`choice-option ${value === option.value ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              required
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {errors[id] && (
        <p className="field-error" id={`${id}-error`}>
          {errors[id]}
        </p>
      )}
    </fieldset>
  );
}
