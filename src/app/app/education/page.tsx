import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

import { requireSession } from "@/server/auth/request-session";

export const metadata: Metadata = { title: "Health guides" };

export default async function EducationPage() {
  await requireSession();
  return (
    <>
      <PageTitle title="Health guides">
        <p className="lede">Learn how to use HILERA to review your health information.</p>
      </PageTitle>
      <Card className="education-guide">
        <p className="eyebrow">Using HILERA</p>
        <h2>How to review past health readings</h2>
        <p className="muted">
          Open a record to see its details and where the information came from.
        </p>
        <div className="page-actions">
          <ButtonLink href="/app/measurements/history">View past health readings</ButtonLink>
        </div>
      </Card>
      <p className="muted app-section">More health guides are unavailable in this preview.</p>
    </>
  );
}
