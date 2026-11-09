import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = { title: "Education" };

export default function EducationPage() {
  return (
    <>
      <PageTitle title="Education">
        <p className="lede">Learn how to use your HILERA workspace and find the next relevant task.</p>
      </PageTitle>
      <Card>
        <p className="eyebrow">Using HILERA</p>
        <h2>Review your health history</h2>
        <p className="muted">
          History puts records in date order. Open a sample record to see its details and source.
        </p>
        <div className="page-actions">
          <ButtonLink href="/app/measurements/history">Review history</ButtonLink>
        </div>
      </Card>
      <p className="muted app-section">Health education topics will appear here after content approval.</p>
    </>
  );
}
