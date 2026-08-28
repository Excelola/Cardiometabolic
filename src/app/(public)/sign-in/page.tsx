import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthMethodChoices } from "@/components/auth/auth-method-choices";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthCard
      intro="Choose the identifier associated with your account. Authentication services are not connected in this foundation."
      title="Welcome back"
    >
      <AuthMethodChoices />
    </AuthCard>
  );
}
