import type { Metadata } from "next";

import { ProgressSteps } from "@/components/onboarding/progress-steps";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { StatusBanner } from "@/components/ui/status-banner";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return (
    <main className="centered-page" id="main-content">
      <Card className="flow-card">
        <p className="eyebrow">Progressive onboarding preview</p>
        <h1>Set up your profile</h1>
        <ProgressSteps currentStep={1} />
        <StatusBanner>
          This single preview displays approved field categories together. A production
          flow will reveal them progressively and persist them only through approved services.
        </StatusBanner>
        <form className="stack">
          <fieldset>
            <legend>Profile details</legend>
            <FormField
              autoComplete="nickname"
              id="preferred-name"
              label="Preferred or display name"
              required
            />
            <FormField
              autoComplete="bday"
              helperText="Enter your exact date of birth."
              id="date-of-birth"
              label="Date of birth"
              required
              type="date"
            />
            <div className="field">
              <label htmlFor="market-context">Country or market context *</label>
              <select id="market-context" name="market-context" required>
                <option value="">Choose an option</option>
                <option value="synthetic-market">Synthetic example market</option>
              </select>
              <span className="field__help">
                The approved country/market inventory and behavior are not yet configured.
              </span>
            </div>
          </fieldset>
          <fieldset>
            <legend>Consent</legend>
            <p className="muted">
              Approved consent documents, versions, jurisdictional rules, and withdrawal
              behavior must be supplied before this control can become functional.
            </p>
            <label className="consent-option">
              <input disabled name="consent-placeholder" type="checkbox" />
              <span>I have reviewed the approved consent information (preview unavailable).</span>
            </label>
          </fieldset>
          <ButtonLink href="/app/dashboard">View authenticated shell</ButtonLink>
        </form>
      </Card>
    </main>
  );
}
