import type { Metadata } from "next";

import { HealthEntryChooser } from "@/components/health/health-entry-chooser";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";

export const metadata: Metadata = { title: "Add Health Information" };

export default async function HealthInformationEntryPage() {
  const { sessionId } = await requireSession();
  const csrf = issueSessionCsrf(sessionId, getAuthConfig().csrfSecret);
  return (
    <>
      <PageTitle title="Add Health Information">
        <p className="lede">Choose the kind of health information you want to add.</p>
      </PageTitle>
      {process.env.NODE_ENV !== "production" && <Notice title="HILERA test environment"><p>Use fictional health information only.</p></Notice>}
      <HealthEntryChooser csrf={csrf} />
    </>
  );
}
