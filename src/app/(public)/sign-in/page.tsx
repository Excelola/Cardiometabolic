import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="Account access"
      intro="Enter your email address and password."
      note="Password recovery is unavailable."
      title="Sign in to HILERA"
    >
      <AuthCredentialsForm mode="sign-in" />
    </AuthCard>
  );
}
