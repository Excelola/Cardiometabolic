import type { Metadata } from "next";

import { DocumentCandidateReview } from "@/components/health/document-candidate-review";
import { cancelHealthDocumentAction } from "@/app/document-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { getOwnedReview } from "@/server/documents/service";
import { isHealthRecordId } from "@/server/health/input";

export const metadata: Metadata = { title: "Review health document" };

export default async function ReviewHealthDocumentPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { userId, sessionId } = await requireSession();
  const { id } = await params;
  const review = isHealthRecordId(id) ? await getOwnedReview(getAuthDb(), userId, id).catch(() => null) : null;
  return <>
    <PageTitle title="Review information found in your document">
      <p className="lede">HILERA found possible health information. Check each item before saving.</p>
    </PageTitle>
    {!review ? <Notice tone="warning">This review is unavailable or has expired. Start a new upload.</Notice>
      : review.upload.status === "empty" ? <>
        <Notice>No supported health information was found. You can cancel this upload and enter information manually.</Notice>
        <form action={cancelHealthDocumentAction}>
          <input type="hidden" name="csrf" value={issueSessionCsrf(sessionId, getAuthConfig().csrfSecret)} />
          <input type="hidden" name="uploadId" value={id} />
          <Button type="submit" variant="secondary">Cancel upload</Button>
        </form>
      </>
        : <Card><DocumentCandidateReview uploadId={id} csrf={issueSessionCsrf(sessionId, getAuthConfig().csrfSecret)} candidates={review.candidates} /></Card>}
  </>;
}
