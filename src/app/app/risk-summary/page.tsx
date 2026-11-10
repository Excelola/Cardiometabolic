import type { Metadata } from "next";

import { RiskSummaryState } from "@/components/health/risk-summary-state";
import { PageTitle } from "@/components/ui/page-title";

import { requireSession } from "@/server/auth/request-session";

export const metadata: Metadata = { title: "Health risk summary" };

export default async function RiskSummaryPage() {
  await requireSession();
  return (
    <>
      <PageTitle title="Health risk summary">
        <p className="lede">
          See whether your health risk summary is available and what information it uses.
        </p>
      </PageTitle>
      <RiskSummaryState />
    </>
  );
}
