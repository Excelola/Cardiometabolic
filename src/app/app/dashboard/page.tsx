import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { ProductStateList } from "@/components/app/product-state-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { InformationCard } from "@/components/ui/information-card";
import { PageTitle } from "@/components/ui/page-title";
import { StatusCard } from "@/components/ui/status-card";
import { Notice } from "@/components/ui/notice";

import { requireSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { users } from "@/server/db/schema";
import { getProfile } from "@/server/profile/repository";
import { isProfileComplete } from "@/server/profile/input";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const principal = await requireSession();
  let user: { verified: Date | null; required: boolean } | undefined;
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    [user] = await getAuthDb().select({ verified: users.emailVerifiedAt, required: users.verificationRequiredForHealth })
      .from(users).where(eq(users.id, principal.userId)).limit(1);
    profile = await getProfile(getAuthDb(), principal.userId);
  } catch { /* Do not expose database or identity details. */ }

  return (
    <>
      <PageTitle eyebrow="Overview" title={profile?.preferredName ? `Welcome back, ${profile.preferredName}` : "Welcome back"}>
        <p className="lede">See where you are in setup and find your next step.</p>
      </PageTitle>
      {user && !user.verified && <Notice title="Verify your email">
        <p>{user.required ? "Verify your email before saving health information." : "You can verify your registered email address."}</p>
        <ButtonLink href="/app/verify-email" variant="text">Verify your email</ButtonLink>
      </Notice>}
      {!isProfileComplete(profile) && <StatusCard
        action={<ButtonLink href="/onboarding">Continue setup</ButtonLink>}
        status="Profile incomplete"
        title="Finish setting up your profile"
      >
        <p>Continue to review your profile and consent.</p>
      </StatusCard>}
      <section className="app-section" aria-labelledby="current-picture-heading">
        <h2 id="current-picture-heading">Review your health information</h2>
        <div className="dashboard-grid">
          <InformationCard title="Past health readings">
            <p>Review the health information you’ve added.</p>
            <ButtonLink href="/app/measurements/history" variant="text">View past health readings</ButtonLink>
          </InformationCard>
          <InformationCard title="Changes over time">
            <p>Comparisons over time are unavailable in this phase.</p>
            <ButtonLink href="/app/trends" variant="text">See changes over time</ButtonLink>
          </InformationCard>
        </div>
      </section>
      <div className="app-section">
        <Card className="workflow-notes">
          <details>
            <summary className="app-disclosure">What these statuses mean</summary>
            <p className="muted">These states describe possible product stages; they do not show your current consent or clinical status.</p>
            <ProductStateList />
          </details>
        </Card>
      </div>
    </>
  );
}
