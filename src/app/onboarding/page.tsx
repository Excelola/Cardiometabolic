import type { Metadata } from "next";

import { ProgressSteps } from "@/components/onboarding/progress-steps";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { MediaFrame } from "@/components/ui/media-frame";
import { NonSubmittingForm } from "@/components/ui/non-submitting-form";
import { Notice } from "@/components/ui/notice";
import { SelectField } from "@/components/ui/select-field";

import { requireSession } from "@/server/auth/request-session";

export const metadata: Metadata = { title: "Set up your health profile" };

export default async function OnboardingPage() {
  await requireSession();
  return (
    <main className="onboarding-page" id="main-content">
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
            <Notice>This preview does not save or submit your answers.</Notice>
            <NonSubmittingForm className="onboarding-form">
              <FormField
                autoComplete="nickname"
                id="preferred-name"
                label="Preferred name"
                placeholder="What should HILERA call you?"
                required
              />
              <FormField
                autoComplete="bday"
                helperText="Used as the source for age where an approved capability requires it."
                id="date-of-birth"
                label="Date of birth"
                required
                type="date"
              />
              <SelectField
                helperText="Approved market options and market-specific behavior remain deferred."
                id="market-context"
                label="Country or market"
                required
              >
                <option value="">Choose country or market</option>
              </SelectField>
              <div className="page-actions">
                <ButtonLink href="/app/dashboard">Continue</ButtonLink>
                <ButtonLink href="/app/dashboard" variant="secondary">Save for later</ButtonLink>
              </div>
            </NonSubmittingForm>
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
