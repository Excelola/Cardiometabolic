export const healthRecordTypes = [
  "blood_pressure", "blood_glucose", "hba1c", "lipid_panel", "weight",
  "waist_circumference", "physical_activity_duration", "sleep_duration",
] as const;
export type HealthRecordType = (typeof healthRecordTypes)[number];

export const concentrationUnits = ["mmol_l", "mg_dl"] as const;
export const weightUnits = ["kg", "lb"] as const;
export const waistUnits = ["cm", "in"] as const;
export const glucoseContexts = ["fasting", "before_meal", "after_meal", "random_other", "not_specified"] as const;
export const lipidComponents = ["totalCholesterol", "hdl", "ldl", "triglycerides"] as const;
type Lipids = Record<(typeof lipidComponents)[number], string | null>;

export const healthRecordLabels = {
  blood_pressure: "Blood pressure",
  blood_glucose: "Blood glucose",
  hba1c: "HbA1c",
  lipid_panel: "Cholesterol / Lipid panel",
  weight: "Weight",
  waist_circumference: "Waist circumference",
  physical_activity_duration: "Physical activity",
  sleep_duration: "Sleep",
} satisfies Record<HealthRecordType, string>;

export const glucoseContextLabels = {
  fasting: "Fasting", before_meal: "Before meal", after_meal: "After meal",
  random_other: "Random/other", not_specified: "Not specified",
} satisfies Record<(typeof glucoseContexts)[number], string>;

export const lipidLabels = {
  totalCholesterol: "Total cholesterol", hdl: "HDL", ldl: "LDL", triglycerides: "Triglycerides",
} satisfies Record<(typeof lipidComponents)[number], string>;

export const unitLabels = { mmol_l: "mmol/L", mg_dl: "mg/dL", kg: "kg", lb: "lb", cm: "cm", in: "in" } as const;

export type HealthEntry =
  | ({ occurredAt: string } & (
    | { type: "blood_pressure"; systolic: string; diastolic: string }
    | { type: "blood_glucose"; value: string; unit: (typeof concentrationUnits)[number]; context: (typeof glucoseContexts)[number] }
    | { type: "hba1c"; value: string }
    | ({ type: "lipid_panel"; unit: (typeof concentrationUnits)[number] } & Lipids)
    | { type: "weight"; value: string; unit: (typeof weightUnits)[number] }
    | { type: "waist_circumference"; value: string; unit: (typeof waistUnits)[number] }
  ))
  | { type: "physical_activity_duration" | "sleep_duration"; occurredOn: string; durationMinutes: number };

export type HealthHistoryEntry = { id: string; entry: HealthEntry };
export type HealthMutationState = { error: string } | null;
