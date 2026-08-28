import { AuthCard } from "@/components/auth/auth-card";
import { AuthMethodChoices } from "@/components/auth/auth-method-choices";

export default function AuthPage() {
  return (
    <AuthCard
      intro="Select the identifier you want to use. Provider and recovery behavior remain intentionally unconfigured."
      title="Choose phone or email"
    >
      <AuthMethodChoices />
    </AuthCard>
  );
}
