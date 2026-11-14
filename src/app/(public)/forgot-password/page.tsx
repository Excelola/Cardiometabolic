import { AuthCard } from "@/components/auth/auth-card";
import { RecoveryForms } from "@/components/auth/email-security-forms";
import { Notice } from "@/components/ui/notice";
import { configuredEmailDelivery } from "@/server/auth/email-delivery";

export default function ForgotPasswordPage() {
  return <AuthCard eyebrow="Account access" title="Recover your account" intro="Recovery is available for eligible accounts with a verified email address."
    note="If you cannot access your registered email or your account is not eligible, an alternative recovery method is not yet available.">
    {configuredEmailDelivery() ? <><Notice title="Synthetic testing only">No real email is sent. Use fictional accounts for this test environment.</Notice><RecoveryForms /></>
      : <Notice tone="warning">Password recovery is currently unavailable. Please try again later.</Notice>}
  </AuthCard>;
}
