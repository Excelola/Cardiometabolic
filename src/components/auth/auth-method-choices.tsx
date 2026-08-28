import { ButtonLink } from "@/components/ui/button-link";

export function AuthMethodChoices() {
  return (
    <div className="choice-grid" role="group" aria-label="Choose how to continue">
      <ButtonLink href="/auth/identifier/phone" variant="secondary">
        Continue with phone
      </ButtonLink>
      <ButtonLink href="/auth/identifier/email" variant="secondary">
        Continue with email
      </ButtonLink>
    </div>
  );
}
