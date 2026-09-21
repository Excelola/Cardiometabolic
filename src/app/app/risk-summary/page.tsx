import type { Metadata } from "next";

import { RiskSummaryState } from "@/components/health/risk-summary-state";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = { title: "Risk Awareness Summary" };

export default function RiskSummaryPage() {
  return (
    <>
      <PageTitle title="Health summary">
        <p className="lede">
          A clinically governed summary appears only when approved requirements are satisfied.
        </p>
      </PageTitle>
      <Card>
        <p className="eyebrow">Cardiometabolic Risk Awareness Summary</p>
        <RiskSummaryState />
      </Card>
    </>
  );
}
