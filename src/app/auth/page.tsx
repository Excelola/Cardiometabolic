import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Legacy authentication route" };

export default function AuthPage() {
  return (
    <AuthCard
      eyebrow="Legacy route"
      intro="This route is not part of the current HILERA MVP authentication journey."
      title="Choose an active account route"
    >
      <div className="stack">
        <Notice title="Email and password is the approved MVP model">
          Phone authentication and network-delivered verification codes are deferred.
        </Notice>
        <ButtonLink href="/sign-in">Go to sign in</ButtonLink>
        <ButtonLink href="/sign-up" variant="secondary">
          Go to sign up
        </ButtonLink>
      </div>
    </AuthCard>
  );
}
