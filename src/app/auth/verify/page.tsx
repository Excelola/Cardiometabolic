import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Legacy verification route" };

export default function VerifyPage() {
  return (
    <AuthCard
      eyebrow="Legacy route"
      intro="This previous verification-code route is retained for review but is not part of the active MVP journey."
      title="Verification codes are deferred"
    >
      <div className="stack">
        <Notice title="No verification code is used in the active MVP flow">
          Phone authentication and network-delivered verification codes require separate approval.
        </Notice>
        <ButtonLink href="/sign-in">Go to sign in</ButtonLink>
        <ButtonLink href="/sign-up" variant="secondary">
          Go to sign up
        </ButtonLink>
      </div>
    </AuthCard>
  );
}
