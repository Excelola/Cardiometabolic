import type { Metadata } from "next";

import { TrendEmptyState } from "@/components/health/trend-empty-state";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = { title: "Trends" };

export default function TrendsPage() {
  return (
    <>
      <PageTitle title="Trends">
        <p className="lede">
          See supported information over time without adding clinical meaning by design alone.
        </p>
      </PageTitle>
      <Card>
        <p className="eyebrow">Longitudinal view</p>
        <TrendEmptyState />
      </Card>
    </>
  );
}
