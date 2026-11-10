import {
  glucoseContextLabels, healthRecordLabels, lipidComponents, lipidLabels, unitLabels,
  type HealthEntry, type HealthHistoryEntry,
} from "@/domain/health-records";
import { MeasurementEntryForm } from "./measurement-entry-form";
import { LocalOccurrenceTime } from "./local-occurrence-time";

function recordedValue(entry: HealthEntry) {
  switch (entry.type) {
    case "blood_pressure": return `${entry.systolic} / ${entry.diastolic} mmHg (systolic / diastolic)`;
    case "blood_glucose": return `${entry.value} ${unitLabels[entry.unit]} · ${glucoseContextLabels[entry.context]}`;
    case "hba1c": return `${entry.value}%`;
    case "lipid_panel": return lipidComponents.flatMap((part) => entry[part] === null ? [] : [`${lipidLabels[part]} ${entry[part]} ${unitLabels[entry.unit]}`]).join(" · ");
    case "weight":
    case "waist_circumference": return `${entry.value} ${unitLabels[entry.unit]}`;
    case "physical_activity_duration":
    case "sleep_duration": return `${entry.durationMinutes} min`;
  }
}

export function MeasurementHistoryRow({ record, csrf }: Readonly<{ record: HealthHistoryEntry; csrf: string }>) {
  const { entry } = record;
  const label = healthRecordLabels[entry.type];
  const occurrence = "occurredAt" in entry ? entry.occurredAt : entry.occurredOn;
  return (
    <li className="measurement-history-row">
      <div className="measurement-history-row__summary">
        <div className="measurement-history-row__identity">
          <span><LocalOccurrenceTime value={occurrence} dayOnly={! ("occurredAt" in entry)} /></span>
          <strong>{label}</strong>
        </div>
        <span>Added by you</span>
      </div>
      <p className="health-history-value">{recordedValue(entry)}</p>
      <details className="measurement-history-row__details">
        <summary>Correct entry<span className="visually-hidden"> for {label}</span></summary>
        <MeasurementEntryForm key={record.id} type={entry.type} correction={record} csrf={csrf} />
      </details>
    </li>
  );
}
