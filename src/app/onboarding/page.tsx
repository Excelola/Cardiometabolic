import type { Metadata } from "next";

import { ProgressSteps } from "@/components/onboarding/progress-steps";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { MediaFrame } from "@/components/ui/media-frame";
import { NonSubmittingForm } from "@/components/ui/non-submitting-form";
import { Notice } from "@/components/ui/notice";
import { SelectField } from "@/components/ui/select-field";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return (
    <main className="onboarding-page" id="main-content">
      <div className="container">
        <header className="onboarding-page__heading">
          <p className="eyebrow">Progressive onboarding</p>
          <h1>A few essentials first.</h1>
          <p className="lede">Complete what is needed now. You can return to the rest later.</p>
        </header>
        <ProgressSteps currentStep={2} />
        <div className="onboarding-layout">
          <Card className="onboarding-card">
            <h2>About you</h2>
            <p className="muted">These are the approved basic profile fields for the V1 foundation.</p>
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
          <MediaFrame ariaLabel="Image-ready HILERA onboarding media area" className="onboarding-media">
            <p className="eyebrow">Consent flow shell</p>
            <h2>Clear choices, at the right time.</h2>
            <p>Approved consent information, versions, jurisdiction rules, and withdrawal behavior will appear in the dedicated consent step.</p>
            <Notice>Nothing entered in this visual preview is submitted or stored.</Notice>
          </MediaFrame>
        </div>
      </div>
    </main>
  );
}
