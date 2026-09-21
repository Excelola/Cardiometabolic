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
      helperText: "Measurement definitions and units are awaiting approval.",
    },
  ],
};

export const MOCK_MEASUREMENT_HISTORY: readonly MeasurementHistoryItem[] = [
  {
    id: "synthetic-record-1",
    label: "Sample record A",
    value: "—",
    recordedAtLabel: "Synthetic preview date",
    provenance: "User Entered",
  },
  {
    id: "synthetic-record-2",
    label: "Sample record B",
    value: "—",
    recordedAtLabel: "Synthetic preview date",
    provenance: "Imported",
  },
  {
    id: "synthetic-record-3",
    label: "Sample record C",
    value: "—",
    recordedAtLabel: "Synthetic preview date",
    provenance: "Verified",
  },
  {
    id: "synthetic-record-4",
    label: "Sample derived item",
    value: "—",
    recordedAtLabel: "Synthetic preview date",
    provenance: "System Derived",
  },
];
