export const DATA_PROVENANCE = [
  "User Entered",
  "Imported",
  "Verified",
  "System Derived",
] as const;

export type DataProvenance = (typeof DATA_PROVENANCE)[number];

export type MeasurementFieldDefinition = Readonly<{
  id: string;
  label: string;
  inputMode: "decimal" | "numeric" | "text";
  unitLabel?: string;
  helperText?: string;
}>;

export type MeasurementDefinition = Readonly<{
  id: string;
  displayName: string;
  fields: readonly MeasurementFieldDefinition[];
}>;

export type MeasurementHistoryItem = Readonly<{
  id: string;
  label: string;
  value: string;
  recordedAtLabel: string;
  provenance: DataProvenance;
}>;

/** Synthetic placeholders only; they do not represent approved measurements. */
export const MOCK_MEASUREMENT_DEFINITION: MeasurementDefinition = {
  id: "placeholder-measurement",
  displayName: "Measurement placeholder",
  fields: [
    {
      id: "placeholder-value",
      label: "Value",
      inputMode: "decimal",
      helperText: "Health reading definitions and units are awaiting approval.",
    },
  ],
};

/** Display-only examples ordered from the most recent preview day and time. */
export const MOCK_MEASUREMENT_HISTORY: readonly MeasurementHistoryItem[] = [
  {
    id: "synthetic-record-1",
    label: "Sample record A",
    value: "—",
    recordedAtLabel: "Preview day 3, 16:20",
    provenance: "User Entered",
  },
  {
    id: "synthetic-record-2",
    label: "Sample record B",
    value: "—",
    recordedAtLabel: "Preview day 2, 14:10",
    provenance: "Imported",
  },
  {
    id: "synthetic-record-3",
    label: "Sample record C",
    value: "—",
    recordedAtLabel: "Preview day 2, 09:30",
    provenance: "Verified",
  },
  {
    id: "synthetic-record-4",
    label: "Sample derived item",
    value: "—",
    recordedAtLabel: "Preview day 1, 11:45",
    provenance: "System Derived",
  },
];
