import type { Metadata } from "next";

import { MeasurementEntryForm } from "@/components/health/measurement-entry-form";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MOCK_MEASUREMENT_DEFINITION } from "@/domain/health";

export const metadata: Metadata = { title: "Add information" };

export default function MeasurementEntryPage() {
  return (
    <>
      <PageTitle title="Add health information">
        <p className="lede">
          Record only supported measurements defined by the approved V1 inventory.
        </p>
      </PageTitle>
      <Card>
        <MeasurementEntryForm definition={MOCK_MEASUREMENT_DEFINITION} />
      </Card>
    </>
  );
}
