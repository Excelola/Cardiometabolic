import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthMethodChoices } from "@/components/auth/auth-method-choices";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="Create your account"
      intro="Choose a phone number or email address to begin the account-access flow. No account is created in this UI preview."
      title="Start with a secure identifier"
    >
      <AuthMethodChoices />
    </AuthCard>
  );
}
