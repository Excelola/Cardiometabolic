import type { Metadata } from "next";

import { DocumentUploadForm } from "@/components/health/document-upload-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";

export const metadata: Metadata = { title: "Upload health document" };

export default async function UploadHealthDocumentPage() {
  const { sessionId } = await requireSession();
  const csrf = issueSessionCsrf(sessionId, getAuthConfig().csrfSecret);
  return <>
    <PageTitle title="Upload health document"><p className="lede">Review possible information from a health document before adding it to your History.</p></PageTitle>
    {process.env.NODE_ENV !== "production" && <Notice title="Development testing only">Use fictional documents only. This flow uses a synthetic extraction adapter when explicitly configured.</Notice>}
    <Card><DocumentUploadForm csrf={csrf} /></Card>
    <p><ButtonLink href="/app/measurements/new" variant="text">Back to Add Health Information</ButtonLink></p>
  </>;
}
