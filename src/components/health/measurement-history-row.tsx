import { ProvenanceBadge } from "./provenance-badge";
import type { MeasurementHistoryItem } from "@/domain/health";

export function MeasurementHistoryRow({ item }: Readonly<{ item: MeasurementHistoryItem }>) {
  return (
    <li className="measurement-history-row">
      <div className="measurement-history-row__summary">
        <strong>{item.label}</strong>
        <span>{item.recordedAtLabel}</span>
      </div>
      <div className="measurement-history-row__meta">
        <span className="visually-hidden">Value: {item.value}</span>
        <ProvenanceBadge provenance={item.provenance} />
        <span aria-hidden="true" className="row-disclosure">View</span>
      </div>
    </li>
  );
}
