import type { HTMLInputTypeAttribute } from "react";

type FormFieldProps = Readonly<{
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: "decimal" | "email" | "numeric" | "search" | "tel" | "text";
  autoComplete?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}>;

export function FormField({
  id,
  label,
  type = "text",
  inputMode,
  autoComplete,
  helperText,
  placeholder,
  required = false,
  disabled = false,
}: FormFieldProps) {
  const helperId = helperText ? `${id}-help` : undefined;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        aria-describedby={helperId}
        autoComplete={autoComplete}
        disabled={disabled}
        id={id}
        inputMode={inputMode}
        name={id}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {helperText ? (
        <span className="field__help" id={helperId}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
