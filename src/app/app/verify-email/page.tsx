import { eq } from "drizzle-orm";
import Link from "next/link";

import { VerificationForms } from "@/components/auth/email-security-forms";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { Notice } from "@/components/ui/notice";
import { getAuthConfig } from "@/server/auth/config";
import { configuredEmailDelivery } from "@/server/auth/email-delivery";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { users } from "@/server/db/schema";

export default async function VerifyEmailPage() {
  const principal = await requireSession();
  const csrf = issueSessionCsrf(principal.sessionId, getAuthConfig().csrfSecret);
  let user: { emailVerifiedAt: Date | null; legacyRecoveryRestricted: boolean } | undefined;
  try {
    [user] = await getAuthDb().select({ emailVerifiedAt: users.emailVerifiedAt, legacyRecoveryRestricted: users.legacyRecoveryRestricted })
      .from(users).where(eq(users.id, principal.userId)).limit(1);
  } catch { /* Keep database and identity details out of the response and ordinary logs. */ }
  return <><PageTitle title="Verify your email"><p>Verify your registered email before saving health information.</p></PageTitle>
    <Card>{!user ? <Notice tone="warning">Email verification is currently unavailable. Please try again later.</Notice>
      : user.emailVerifiedAt ? <Notice>Your email is verified. {user.legacyRecoveryRestricted && "Email-only recovery is not yet available for this account. "}<Link href="/app/measurements/new">Add Health Information</Link></Notice>
      : configuredEmailDelivery() ? <><Notice title="Synthetic testing only">No real email is sent. Use fictional accounts for this test environment.</Notice><VerificationForms csrf={csrf} /></>
        : <Notice tone="warning">Email verification is currently unavailable. Please try again later.</Notice>}</Card></>;
}
