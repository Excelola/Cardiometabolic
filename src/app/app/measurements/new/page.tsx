import type { Metadata } from "next";

import { MeasurementEntryForm } from "@/components/health/measurement-entry-form";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MOCK_MEASUREMENT_DEFINITION } from "@/domain/health";

export const metadata: Metadata = { title: "Add a measurement" };

export default function MeasurementEntryPage() {
  return (
    <>
      <PageTitle title="Add a measurement">
        <p className="lede">Enter the measurement, when it was taken, and its source.</p>
      </PageTitle>
      <Card className="measurement-entry-surface">
        <MeasurementEntryForm definition={MOCK_MEASUREMENT_DEFINITION} />
      </Card>
    </>
  );
}
