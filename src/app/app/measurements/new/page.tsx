import type { Metadata } from "next";

import { MeasurementEntryForm } from "@/components/health/measurement-entry-form";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MOCK_MEASUREMENT_DEFINITION } from "@/domain/health";

export const metadata: Metadata = { title: "Add health information" };

export default function MeasurementEntryPage() {
  return (
    <>
      <PageTitle title="Add health information">
        <p className="lede">
          See what a manual entry includes, from the measurement details to its date
          and source.
        </p>
      </PageTitle>
      <Card>
        <MeasurementEntryForm definition={MOCK_MEASUREMENT_DEFINITION} />
      </Card>
    </>
  );
}
