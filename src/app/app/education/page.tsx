import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

export const metadata: Metadata = { title: "Health guides" };

export default function EducationPage() {
  return (
    <>
      <PageTitle title="Health guides">
        <p className="lede">Learn how to use HILERA to review your health information.</p>
      </PageTitle>
      <Card className="education-guide">
        <p className="eyebrow">Using HILERA</p>
        <h2>How to review past measurements</h2>
        <p className="muted">
          Open a record to see its details and where the information came from.
        </p>
        <div className="page-actions">
          <ButtonLink href="/app/measurements/history">View past measurements</ButtonLink>
        </div>
      </Card>
      <p className="muted app-section">More health guides are unavailable in this preview.</p>
    </>
  );
}
