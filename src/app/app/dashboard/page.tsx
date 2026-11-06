import type { Metadata } from "next";

import { ProductStateList } from "@/components/app/product-state-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { InformationCard } from "@/components/ui/information-card";
import { PageTitle } from "@/components/ui/page-title";
import { StatusCard } from "@/components/ui/status-card";
import { MOCK_CURRENT_PRODUCT_STATE, PRODUCT_STATE_DETAILS } from "@/domain/product-state";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageTitle title="Your health, at a glance">
        <p className="lede">A calm view of what you have completed and what comes next.</p>
      </PageTitle>
      <StatusCard
        action={<ButtonLink href="/onboarding">Continue setup</ButtonLink>}
        status={MOCK_CURRENT_PRODUCT_STATE}
        title="Complete the next part of your setup."
      >
        <p>{PRODUCT_STATE_DETAILS[MOCK_CURRENT_PRODUCT_STATE]}</p>
      </StatusCard>
      <div className="dashboard-grid dashboard-grid--four">
        <InformationCard title="Add information">
          <p>Record a supported measurement when the approved inventory is available.</p>
          <ButtonLink href="/app/measurements/new" variant="text">Add data</ButtonLink>
        </InformationCard>
        <InformationCard title="History">
          <p>Review what you have recorded over time.</p>
          <ButtonLink href="/app/measurements/history" variant="text">View history</ButtonLink>
        </InformationCard>
        <InformationCard title="Trends">
          <p>See longitudinal views when enough supported history exists.</p>
          <ButtonLink href="/app/trends" variant="text">View trends</ButtonLink>
        </InformationCard>
        <InformationCard title="Summary">
          <p>A clinically governed summary appears only when its requirements are met.</p>
          <ButtonLink href="/app/risk-summary" variant="text">View status</ButtonLink>
        </InformationCard>
      </div>
      <section className="section product-states-section" aria-labelledby="states-heading">
        <Card>
          <p className="eyebrow">Approved workflow states</p>
          <h2 id="states-heading">Product-state presentation</h2>
          <p className="muted">
            These states describe product progress only. They do not represent medical status.
          </p>
          <ProductStateList />
        </Card>
      </section>
    </>
  );
}
