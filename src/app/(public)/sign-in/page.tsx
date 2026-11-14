import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { AuthCredentialsForm } from "@/components/auth/auth-credentials-form";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: Readonly<{ searchParams: Promise<{ reset?: string }> }>) {
  const params = await searchParams;
  return (
    <AuthCard
      eyebrow="Account access"
      intro="Enter your email address and password."
      title="Sign in to HILERA"
    >
      {params.reset === "complete" && <Notice>Your password was reset. Sign in with your new password.</Notice>}
      <AuthCredentialsForm mode="sign-in" />
      <p><Link href="/forgot-password">Forgot password?</Link></p>
    </AuthCard>
  );
}
