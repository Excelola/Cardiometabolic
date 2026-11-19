import type { Metadata } from "next";

import { ProgressSteps } from "@/components/onboarding/progress-steps";
import { SessionActivity } from "@/components/auth/session-activity";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { Notice } from "@/components/ui/notice";
import { ProfileForm } from "@/components/onboarding/profile-form";
import { getProfile } from "@/server/profile/repository";
import { getAuthDb } from "@/server/db/auth-db";

import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";

export const metadata: Metadata = { title: "Set up your health profile" };

export default async function OnboardingPage() {
  const { sessionId, userId } = await requireSession();
  const csrf = issueSessionCsrf(sessionId, getAuthConfig().csrfSecret);
  const profile = await getProfile(getAuthDb(), userId);
  return (
    <main className="onboarding-page" id="main-content">
      <SessionActivity csrf={csrf} />
      <div className="container">
        <header className="onboarding-page__heading">
          <p className="eyebrow">Profile setup</p>
          <h1>Set up your health profile</h1>
          <p className="lede">Review the profile fields for this step before you continue.</p>
        </header>
        <ProgressSteps currentStep={2} />
        <div className="onboarding-layout">
          <Card className="onboarding-card">
            <h2>About you</h2>
            <Notice>Save for later keeps valid partial information. Consent is not yet available.</Notice>
            <ProfileForm csrf={csrf} profile={profile && { preferredName: profile.preferredName, dateOfBirth: profile.dateOfBirth, market: profile.market }} />
          </Card>
          <MediaFrame ariaLabel="Consent information" className="onboarding-media">
            <p className="eyebrow">Consent</p>
            <h2>Clear choices, at the right time.</h2>
            <p>Approved consent information, versions, jurisdiction rules, and withdrawal behavior will appear in the dedicated consent step.</p>
          </MediaFrame>
        </div>
      </div>
    </main>
  );
}
