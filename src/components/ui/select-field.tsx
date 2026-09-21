import type { ReactNode } from "react";

type SelectFieldProps = Readonly<{
  children: ReactNode;
  disabled?: boolean;
  helperText?: string;
  id: string;
  label: string;
  required?: boolean;
}>;

export function SelectField({
  children,
  disabled = false,
  helperText,
  id,
  label,
  required = false,
}: SelectFieldProps) {
  const helperId = helperText ? `${id}-help` : undefined;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <select
        aria-describedby={helperId}
        disabled={disabled}
        id={id}
        name={id}
        required={required}
      >
        {children}
      </select>
      {helperText ? <span className="field__help" id={helperId}>{helperText}</span> : null}
    </div>
  );
}
