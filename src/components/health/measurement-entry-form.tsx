import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { NonSubmittingForm } from "@/components/ui/non-submitting-form";
import { Notice } from "@/components/ui/notice";
import { SelectField } from "@/components/ui/select-field";
import type { MeasurementDefinition } from "@/domain/health";

type MeasurementEntryFormProps = Readonly<{
  definition: MeasurementDefinition;
}>;

export function MeasurementEntryForm({ definition }: MeasurementEntryFormProps) {
  return (
    <NonSubmittingForm className="measurement-form">
      <p className="eyebrow">Manual entry foundation</p>
      <div className="measurement-form__grid">
        <SelectField disabled id="measurement-type" label="Measurement type">
          <option>Choose a supported measurement</option>
        </SelectField>
        <FormField
          disabled
          helperText={definition.fields[0]?.helperText}
          id="measurement-value"
          label="Value and unit"
          placeholder="Available after measurement selection"
        />
        <FormField
          disabled
          id="measurement-time"
          label="When was it measured?"
          placeholder="Date and time"
        />
        <SelectField disabled id="measurement-source" label="Source">
          <option>User Entered</option>
        </SelectField>
      </div>
      <Notice title="Measurement specification required">
        Names, units, validation, context, and clinical meaning must come from the approved
        measurement and clinical specifications.
      </Notice>
      <div className="page-actions">
        <Button disabled type="submit">Save information</Button>
        <ButtonLink href="/app/dashboard" variant="secondary">Cancel</ButtonLink>
      </div>
    </NonSubmittingForm>
  );
}
