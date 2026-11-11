import type { Metadata } from "next";

import { HealthEntryChooser } from "@/components/health/health-entry-chooser";
import { ButtonLink } from "@/components/ui/button-link";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";
import { isDevelopmentDocumentUploadEnabled } from "@/server/documents/providers";

export const metadata: Metadata = { title: "Add Health Information" };

export default async function HealthInformationEntryPage() {
  const { sessionId } = await requireSession();
  const csrf = issueSessionCsrf(sessionId, getAuthConfig().csrfSecret);
  const documentUploadEnabled = isDevelopmentDocumentUploadEnabled();
  return (
    <>
      <PageTitle title="Add Health Information">
        <p className="lede">Choose the kind of health information you want to add.</p>
      </PageTitle>
      {process.env.NODE_ENV !== "production" && <Notice title="HILERA test environment"><p>Use fictional health information only.</p></Notice>}
      <HealthEntryChooser csrf={csrf} />
      {documentUploadEnabled && <section className="app-section" aria-labelledby="upload-document-heading">
        <h2 id="upload-document-heading">Have a health document?</h2>
        <p>Upload a supported PDF or image to look for health information you can review before saving.</p>
        <ButtonLink href="/app/documents/upload" variant="secondary">Upload health document</ButtonLink>
      </section>}
    </>
  );
}
