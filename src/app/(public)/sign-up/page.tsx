import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="Create your HILERA account"
      intro="Use your email address and a password to begin."
      note="This frontend preview does not create an account or store your email address or password."
      title="Create your account"
    >
      <AuthCredentialsForm mode="sign-up" />
    </AuthCard>
  );
}
