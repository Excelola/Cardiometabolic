import type { Metadata } from "next";

import { ProvenanceBadge } from "@/components/health/provenance-badge";
import { Card } from "@/components/ui/card";
import { MOCK_MEASUREMENT_HISTORY } from "@/domain/health";

export const metadata: Metadata = { title: "Measurement history" };

export default function MeasurementHistoryPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Synthetic data</p>
        <h1>Measurement history</h1>
        <p className="lede">
          A generic history surface showing provenance without approved measurement inventory.
        </p>
      </header>
      <Card>
        <ul className="history-list">
          {MOCK_MEASUREMENT_HISTORY.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <div className="muted">{item.recordedAtLabel}</div>
              </div>
              <div>
                <span>{item.value}</span>{" "}
                <ProvenanceBadge provenance={item.provenance} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
