"use client";

import { FormField } from "@/components/ui/form-field";
import type { MeasurementDefinition } from "@/domain/health";

type MeasurementEntryFormProps = Readonly<{
  definition: MeasurementDefinition;
}>;

export function MeasurementEntryForm({ definition }: MeasurementEntryFormProps) {
  return (
    <form className="stack" onSubmit={(event) => event.preventDefault()}>
      <fieldset>
        <legend>{definition.displayName}</legend>
        {definition.fields.map((field) => (
          <FormField
            helperText={field.helperText}
            id={field.id}
            inputMode={field.inputMode}
            key={field.id}
            label={field.label}
          />
        ))}
      </fieldset>
      <button className="button button--primary" disabled type="submit">
        Save unavailable in preview
      </button>
    </form>
  );
}
