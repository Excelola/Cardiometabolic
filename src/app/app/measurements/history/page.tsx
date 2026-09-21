import type { Metadata } from "next";

import { MeasurementHistoryRow } from "@/components/health/measurement-history-row";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MOCK_MEASUREMENT_HISTORY } from "@/domain/health";

export const metadata: Metadata = { title: "Measurement history" };

export default function MeasurementHistoryPage() {
  return (
    <>
      <PageTitle title="Measurement history">
        <p className="lede">
          Review supported information chronologically, including where it came from.
        </p>
      </PageTitle>
      <Card>
        <p className="eyebrow">Synthetic preview records</p>
        <ul className="history-list">
          {MOCK_MEASUREMENT_HISTORY.map((item) => (
            <MeasurementHistoryRow item={item} key={item.id} />
          ))}
        </ul>
        <p className="muted history-disclaimer">
          Synthetic examples demonstrate layout only. Provenance labels do not imply an
          approved integration or verification process.
        </p>
      </Card>
    </>
  );
}
