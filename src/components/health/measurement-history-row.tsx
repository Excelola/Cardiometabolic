import { ProvenanceBadge } from "./provenance-badge";
import type { MeasurementHistoryItem } from "@/domain/health";

export function MeasurementHistoryRow({ item }: Readonly<{ item: MeasurementHistoryItem }>) {
  const value = item.value.trim();

  return (
    <li className="measurement-history-row">
      <div className="measurement-history-row__summary">
        <div className="measurement-history-row__identity">
          <span>{item.recordedAtLabel}</span>
          <strong>{item.label}</strong>
        </div>
        <ProvenanceBadge provenance={item.provenance} />
      </div>
      <details className="measurement-history-row__details">
        <summary>
          View details<span className="visually-hidden"> for {item.label}</span>
        </summary>
        <dl>
          <dt>Recorded value</dt>
          <dd>{value && value !== "—" ? value : "Unavailable in this preview"}</dd>
        </dl>
      </details>
    </li>
  );
}
