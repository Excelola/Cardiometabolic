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
    <NonSubmittingForm aria-labelledby="measurement-entry-title" className="measurement-form">
      <h3 id="measurement-entry-title">Sample measurement form</h3>
      <Notice title="Preview only">
        <p>This form shows how measurement entry could look. The fields and Save action are unavailable. You can view sample records in Past measurements.</p>
      </Notice>
      <div className="measurement-form__grid">
        <SelectField disabled id="measurement-type" label="Measurement type">
          <option>Select measurement type</option>
        </SelectField>
        <FormField
          disabled
          helperText={definition.fields[0]?.helperText}
          id="measurement-value"
          inputMode={definition.fields[0]?.inputMode}
          label="Value and unit"
          placeholder="Select a measurement first"
        />
        <FormField
          disabled
          helperText="This identifies when the measurement was taken."
          id="measurement-time"
          label="Date and time measured"
          placeholder="Date and time"
        />
        <SelectField
          disabled
          helperText="Manual entries appear with this source label in Past measurements."
          id="measurement-source"
          label="Source"
        >
          <option>User Entered</option>
        </SelectField>
      </div>
      <div className="page-actions">
        <ButtonLink href="/app/measurements/history">View past measurements</ButtonLink>
        <Button disabled type="submit" variant="secondary">Save measurement</Button>
      </div>
    </NonSubmittingForm>
  );
}
