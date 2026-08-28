import type { Metadata } from "next";

import { ProductStateList } from "@/components/app/product-state-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { MOCK_CURRENT_PRODUCT_STATE } from "@/domain/product-state";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Limited dashboard</p>
        <h1>Your health information workspace</h1>
        <p className="lede">
          This authenticated shell uses synthetic content and does not establish a real session.
        </p>
      </header>
      <StatusBanner>
        Mock current product state: <strong>{MOCK_CURRENT_PRODUCT_STATE}</strong>
      </StatusBanner>
      <div className="dashboard-grid">
        <Card>
          <h2>Continue setup</h2>
          <p>Review the progressive onboarding structure and pending dependencies.</p>
          <ButtonLink href="/onboarding" variant="secondary">
            Review setup
          </ButtonLink>
        </Card>
        <Card>
          <h2>Add information</h2>
          <p>Preview a generic measurement-entry architecture without clinical fields.</p>
          <ButtonLink href="/app/measurements/new" variant="secondary">
            Open entry shell
          </ButtonLink>
        </Card>
        <Card>
          <h2>Risk Awareness Summary</h2>
          <p>See the summary shell while inputs and approved calculations remain deferred.</p>
          <ButtonLink href="/app/risk-summary" variant="secondary">
            View summary shell
          </ButtonLink>
        </Card>
      </div>
      <section className="section" aria-labelledby="states-heading">
        <Card>
          <h2 id="states-heading">Approved product-state model</h2>
          <p className="muted">
            The list presents workflow states only; it does not represent medical status.
          </p>
          <ProductStateList />
        </Card>
      </section>
    </>
  );
}
