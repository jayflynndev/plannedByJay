'use client';
type FieldErrors=Record<string,string>;
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
  hint,
  errors,
}: {
  id: string;
  label: string;
  options: readonly Option[];
  value: string;
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
            <input disabled
              type="radio"
              name={id}
              value={option.value}
              required
              checked={value === option.value}

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
