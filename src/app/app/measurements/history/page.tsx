import type { Metadata } from "next";

import { MeasurementHistoryRow } from "@/components/health/measurement-history-row";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MOCK_MEASUREMENT_HISTORY } from "@/domain/health";

export const metadata: Metadata = { title: "Measurement history" };

export default function MeasurementHistoryPage() {
  return (
    <>
      <PageTitle title="Measurement history">
        <p className="lede">
          See what was recorded, when it was recorded, and where it came from.
        </p>
        <div className="page-actions">
          <ButtonLink href="/app/measurements/new">Add health information</ButtonLink>
        </div>
      </PageTitle>
      <Card>
        <p className="eyebrow">Preview records</p>
        <h2>Recorded information</h2>
        <p className="muted">Newest first. These examples use sample dates and sources.</p>
        <ol className="history-list" role="list">
          {MOCK_MEASUREMENT_HISTORY.map((item) => (
            <MeasurementHistoryRow item={item} key={item.id} />
          ))}
        </ol>
        <p className="muted history-disclaimer">
          Source labels describe where a record came from. The preview illustrates how
          each source appears in History.
        </p>
      </Card>
    </>
  );
}
