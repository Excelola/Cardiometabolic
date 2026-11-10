import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="Sign up"
      intro="Enter your email address and a password."
      title="Create your account"
    >
      <AuthCredentialsForm mode="sign-up" />
    </AuthCard>
  );
}
