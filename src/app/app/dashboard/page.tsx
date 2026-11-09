import type { Metadata } from "next";

import { ProductStateList } from "@/components/app/product-state-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { InformationCard } from "@/components/ui/information-card";
import { PageTitle } from "@/components/ui/page-title";
import { StatusCard } from "@/components/ui/status-card";
import { MOCK_CURRENT_PRODUCT_STATE } from "@/domain/product-state";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageTitle eyebrow="Dashboard" title="Your health, at a glance">
        <p className="lede">See where you are in setup and where to go next.</p>
      </PageTitle>
      <StatusCard
        action={<ButtonLink href="/onboarding">Continue setup</ButtonLink>}
        status={MOCK_CURRENT_PRODUCT_STATE}
        title="Profile and consent"
      >
        <p>This sample state shows setup progress. Open setup to review the profile and consent steps.</p>
      </StatusCard>
      <section className="app-section" aria-labelledby="current-picture-heading">
        <h2 id="current-picture-heading">Your current picture</h2>
        <div className="dashboard-grid">
          <InformationCard title="Recent information">
            <p>History contains sample records so you can see how entries are organised.</p>
            <ButtonLink href="/app/measurements/history" variant="text">Review history</ButtonLink>
          </InformationCard>
          <InformationCard title="Monitoring activity">
            <p>Trends need a record of supported information over time. This preview has no trend data.</p>
            <ButtonLink href="/app/trends" variant="text">Review trends</ButtonLink>
          </InformationCard>
        </div>
      </section>
      <div className="app-section">
        <Card>
          <details>
            <summary className="app-disclosure">About HILERA workflow states</summary>
            <p className="muted">These eight states describe progress through the product.</p>
            <ProductStateList />
          </details>
        </Card>
      </div>
    </>
  );
}
