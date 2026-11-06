import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="HILERA account access"
      intro="Enter your email address and password to continue."
      note="This frontend preview does not create a session. Account recovery is not available until an approved recovery mechanism is implemented."
      title="Welcome back"
    >
      <AuthCredentialsForm mode="sign-in" />
    </AuthCard>
  );
}
