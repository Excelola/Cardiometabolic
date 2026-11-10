import type { Metadata } from "next";

import { TrendEmptyState } from "@/components/health/trend-empty-state";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = { title: "Changes over time" };

export default function TrendsPage() {
  return (
    <>
      <PageTitle title="Changes over time">
        <p className="lede">Compare supported health readings over time.</p>
      </PageTitle>
      <TrendEmptyState />
    </>
  );
}
