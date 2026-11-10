import type { Metadata } from "next";

import { ProductStateList } from "@/components/app/product-state-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { InformationCard } from "@/components/ui/information-card";
import { PageTitle } from "@/components/ui/page-title";
import { StatusCard } from "@/components/ui/status-card";
import { MOCK_CURRENT_PRODUCT_STATE } from "@/domain/product-state";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  const status = MOCK_CURRENT_PRODUCT_STATE === "Setup In Progress"
    ? "Setup in progress"
    : MOCK_CURRENT_PRODUCT_STATE;

  return (
    <>
      <PageTitle eyebrow="Overview" title="Your health overview">
        <p className="lede">See where you are in setup and find your next step.</p>
      </PageTitle>
      <StatusCard
        action={<ButtonLink href="/onboarding">Continue setup</ButtonLink>}
        status={status}
        title="Finish setting up your profile"
      >
        <p>Continue to review your profile and consent.</p>
      </StatusCard>
      <section className="app-section" aria-labelledby="current-picture-heading">
        <h2 id="current-picture-heading">Review your health information</h2>
        <div className="dashboard-grid">
          <InformationCard title="Past health readings">
            <p>This preview shows sample health reading records.</p>
            <ButtonLink href="/app/measurements/history" variant="text">View past health readings</ButtonLink>
          </InformationCard>
          <InformationCard title="Changes over time">
            <p>This preview has no health readings to compare over time.</p>
            <ButtonLink href="/app/trends" variant="text">See changes over time</ButtonLink>
          </InformationCard>
        </div>
      </section>
      <div className="app-section">
        <Card className="workflow-notes">
          <details>
            <summary className="app-disclosure">What these statuses mean</summary>
            <p className="muted">These eight states describe progress through the product.</p>
            <ProductStateList />
          </details>
        </Card>
      </div>
    </>
  );
}
