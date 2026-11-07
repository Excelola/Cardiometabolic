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
          Review how supported information changes over time when enough history is available.
        </p>
      </PageTitle>
      <Card>
        <p className="eyebrow">Longitudinal view</p>
        <TrendEmptyState />
      </Card>
    </>
  );
}
