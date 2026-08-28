import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";

type IdentifierPageProps = Readonly<{
  params: Promise<{ channel: string }>;
}>;

export const metadata: Metadata = { title: "Enter your identifier" };

export default async function IdentifierPage({ params }: IdentifierPageProps) {
  const { channel } = await params;
  if (channel !== "phone" && channel !== "email") {
    notFound();
  }

  const isPhone = channel === "phone";

  return (
    <AuthCard
      intro={`Enter the ${isPhone ? "phone number" : "email address"} you want to use. This preview does not submit or store the value.`}
      title={`Enter your ${isPhone ? "phone number" : "email address"}`}
    >
      <form className="stack">
        <FormField
          autoComplete={isPhone ? "tel" : "email"}
          id="identifier"
          inputMode={isPhone ? "tel" : "email"}
          label={isPhone ? "Phone number" : "Email address"}
          required
          type={isPhone ? "tel" : "email"}
        />
        <ButtonLink href="/auth/verify">Continue to verification</ButtonLink>
      </form>
    </AuthCard>
  );
}
