import { eq } from "drizzle-orm";
import Link from "next/link";

import { VerificationForms } from "@/components/auth/email-security-forms";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { Notice } from "@/components/ui/notice";
import { getAuthConfig } from "@/server/auth/config";
import { verificationDeliveryStatus } from "@/server/auth/email-delivery";
import { readChallengeSecret } from "@/server/auth/email-challenge-service";
import { verificationReadiness } from "@/server/auth/verification-readiness";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { users } from "@/server/db/schema";

export default async function VerifyEmailPage() {
  const principal = await requireSession();
  const auth = getAuthConfig();
  const csrf = issueSessionCsrf(principal.sessionId, auth.csrfSecret);
  const secret = readChallengeSecret(process.env.HILERA_AUTH_EMAIL_CODE_SECRET);
  const challengeReady = secret && !secret.equals(auth.csrfSecret) && !secret.equals(auth.throttleSecret);
  let user: { emailVerifiedAt: Date | null; legacyRecoveryRestricted: boolean; email: string } | undefined;
  try {
    [user] = await getAuthDb().select({ emailVerifiedAt: users.emailVerifiedAt, legacyRecoveryRestricted: users.legacyRecoveryRestricted, email: users.normalizedEmail })
      .from(users).where(eq(users.id, principal.userId)).limit(1);
  } catch { /* Keep database and identity details out of the response and ordinary logs. */ }
  const readiness = user ? verificationReadiness(Boolean(challengeReady), verificationDeliveryStatus(user.email)) : "not_configured";
  return <><PageTitle title="Verify your email"><p>Verify your registered email before saving health information.</p></PageTitle>
    <Card>{!user ? <Notice tone="warning">Email verification is currently unavailable. Please try again later.</Notice>
      : user.emailVerifiedAt ? <Notice>Your email is verified. {user.legacyRecoveryRestricted && "Email-only recovery is not yet available for this account. "}<Link href="/app/measurements/new">Add Health Information</Link></Notice>
      : readiness === "available" ? <><Notice title="Development testing">Delivery is limited to configured test accounts.</Notice><VerificationForms csrf={csrf} /></>
        : readiness === "not_authorized" ? <Notice tone="warning">This account is not authorized for development test delivery. Contact the test administrator.</Notice>
        : <Notice tone="warning">Email delivery is not configured for this environment. Contact the test administrator before requesting a code.</Notice>}</Card></>;
}
