"use client";

import { useActionState, useEffect, useId, useState } from "react";

import { correctHealthRecordAction, createHealthRecordAction } from "@/app/health-actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import {
  concentrationUnits, glucoseContexts, glucoseContextLabels, healthRecordLabels, lipidComponents, lipidLabels,
  unitLabels, waistUnits, weightUnits, type HealthHistoryEntry, type HealthRecordType,
} from "@/domain/health-records";

type EntryFormProps = { type: HealthRecordType; csrf: string; correction?: HealthHistoryEntry };

export function MeasurementEntryForm({ type, csrf, correction }: Readonly<EntryFormProps>) {
  const title = healthRecordLabels[type];
  const id = useId();
  const [state, action, pending] = useActionState(correction ? correctHealthRecordAction : createHealthRecordAction, null);
  const initial = correction?.entry;
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!initial) return {};
    const fields = Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, value == null ? "" : String(value)]));
    if ("occurredAt" in initial) fields.occurredAt = initial.occurredAt;
    return fields;
  });
  useEffect(() => {
    if (!initial || !("occurredAt" in initial)) return;
    const instant = new Date(initial.occurredAt);
    const local = new Date(instant.getTime() - instant.getTimezoneOffset() * 60_000);
    // Browser timezone is unavailable during server rendering.
    setValues((previous) => ({ ...previous, occurredLocal: local.toISOString().slice(0, 23) }));
  }, [initial]);
  const habit = type === "physical_activity_duration" || type === "sleep_duration";
  const update = (name: string, value: string) => setValues((previous) => ({ ...previous, [name]: value }));
  const updateOccurredLocal = (value: string) => {
    const instant = new Date(value);
    setValues((previous) => ({
      ...previous,
      occurredLocal: value,
      occurredAt: Number.isFinite(instant.getTime()) ? instant.toISOString() : "",
    }));
  };

  function field(name: string, label: string, options: { kind?: "date" | "datetime-local"; optional?: boolean; integer?: boolean } = {}) {
    return (
      <div className="field" key={name}>
        <label htmlFor={`${id}-${name}`}>{label}</label>
        <input
          id={`${id}-${name}`} name={name} type={options.kind ?? "text"}
          step={options.kind === "datetime-local" ? "0.001" : undefined}
          inputMode={options.kind ? undefined : options.integer ? "numeric" : "decimal"}
          required={!options.optional} value={values[name] ?? ""}
          onChange={(event) => update(name, event.currentTarget.value)}
        />
      </div>
    );
  }

  function select<T extends string>(name: string, label: string, options: readonly T[], labels: Record<T, string>) {
    return (
      <div className="field">
        <label htmlFor={`${id}-${name}`}>{label}</label>
        <select id={`${id}-${name}`} name={name} required value={values[name] ?? ""}
          onChange={(event) => update(name, event.currentTarget.value)}>
          <option value="" disabled>Choose {label.toLowerCase()}</option>
          {options.map((option) => <option key={option} value={option}>{labels[option]}</option>)}
        </select>
      </div>
    );
  }

  return (
    <form action={action} className="measurement-form" aria-labelledby={`${id}-title`} aria-busy={pending}>
      <h3 id={`${id}-title`}>{correction ? `Correct ${title}` : title}</h3>
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="type" value={type} />
      {correction && <input type="hidden" name="recordId" value={correction.id} />}
      {state?.error && <Notice tone="critical">{state.error}</Notice>}
      {type === "lipid_panel" && <p>Enter at least one lipid result. Use the same unit for all results in this entry.</p>}
      <div className="measurement-form__grid">
        {type === "blood_pressure" && <>{field("systolic", "Systolic (mmHg)")}{field("diastolic", "Diastolic (mmHg)")}</>}
        {type === "blood_glucose" && <>
          {field("value", "Glucose value")}{select("unit", "Unit", concentrationUnits, unitLabels)}
          {select("context", "Glucose context", glucoseContexts, glucoseContextLabels)}
        </>}
        {type === "hba1c" && field("value", "HbA1c (%)")}
        {type === "lipid_panel" && <>
          {select("unit", "Unit", concentrationUnits, unitLabels)}
          {lipidComponents.map((component) => field(component, lipidLabels[component], { optional: true }))}
        </>}
        {type === "weight" && <>{field("value", "Weight")}{select("unit", "Unit", weightUnits, unitLabels)}</>}
        {type === "waist_circumference" && <>{field("value", "Waist circumference")}{select("unit", "Unit", waistUnits, unitLabels)}</>}
        {habit ? <>
          {field("durationMinutes", "Total duration (whole minutes)", { integer: true })}
          {field("occurredOn", type === "sleep_duration" ? "Day of sleep period" : "Day of activity", { kind: "date" })}
        </> : <div className="field">
          <label htmlFor={`${id}-occurred-local`}>Date and time taken</label>
          <input
            id={`${id}-occurred-local`}
            type="datetime-local"
            step="0.001"
            required
            value={values.occurredLocal ?? ""}
            onChange={(event) => updateOccurredLocal(event.currentTarget.value)}
          />
          <input type="hidden" name="occurredAt" value={values.occurredAt ?? ""} />
          <p className="muted">Enter the time shown on your device. HILERA stores the equivalent instant securely.</p>
        </div>}
      </div>
      <p className="muted">{correction ? "The corrected entry will replace the current version in History." : "After saving, your entry will appear in History."}</p>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : correction ? "Save correction" : "Save health information"}</Button>
    </form>
  );
}
