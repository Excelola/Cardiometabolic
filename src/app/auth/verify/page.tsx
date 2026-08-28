import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { StatusBanner } from "@/components/ui/status-banner";
import { authPolicyConfig } from "@/config/auth";

export const metadata: Metadata = { title: "Verification" };

export default function VerifyPage() {
  const hasApprovedTimingPolicy =
    authPolicyConfig.otpExpirySeconds !== undefined ||
    authPolicyConfig.resendDelaySeconds !== undefined;

  return (
    <AuthCard
      intro="Enter the verification code sent to your selected identifier. Code delivery is not connected in this preview."
      title="Verify your identifier"
    >
      <StatusBanner tone="warning">
        Expiry, resend timing, attempt limits, rate limits, provider, and fallback
        recovery behavior are awaiting approval and are not enforced here.
      </StatusBanner>
      <form className="stack">
        <FormField
          autoComplete="one-time-code"
          id="verification-code"
          inputMode="numeric"
          label="Verification code"
          required
        />
        <p className="muted">
          {hasApprovedTimingPolicy
            ? "Approved timing configuration is available."
            : "No resend or expiry time is shown because none is approved."}
        </p>
        <ButtonLink href="/onboarding">Continue to onboarding preview</ButtonLink>
      </form>
    </AuthCard>
  );
}
