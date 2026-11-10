import type { Metadata } from "next";

import { MeasurementHistoryRow } from "@/components/health/measurement-history-row";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { listHealthHistory } from "@/server/health/repository";

export const metadata: Metadata = { title: "Past health readings" };

export default async function MeasurementHistoryPage() {
  const { userId, sessionId } = await requireSession();
  const csrf = issueSessionCsrf(sessionId, getAuthConfig().csrfSecret);
  const records = await listHealthHistory(getAuthDb(), userId).catch(() => null);
  return (
    <>
      <PageTitle title="Past health readings">
        <p className="lede">See the readings, measurements and daily habits you’ve recorded.</p>
        <div className="page-actions"><ButtonLink href="/app/measurements/new">Add Health Information</ButtonLink></div>
      </PageTitle>
      <Card className="history-surface">
        <header className="history-surface__heading"><h2>Your entries</h2><p className="muted">Newest first</p></header>
        {records === null ? <Notice tone="critical">History is temporarily unavailable. Please try again.</Notice>
          : records.length === 0 ? <p>No health information has been added yet.</p>
          : <ol className="history-list" role="list">
            {records.map((record) => <MeasurementHistoryRow record={record} csrf={csrf} key={record.id} />)}
          </ol>}
      </Card>
    </>
  );
}
