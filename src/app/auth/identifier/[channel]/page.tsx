import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Notice } from "@/components/ui/notice";

type IdentifierPageProps = Readonly<{
  params: Promise<{ channel: string }>;
}>;

export const metadata: Metadata = { title: "Legacy identifier route" };

export default async function IdentifierPage({ params }: IdentifierPageProps) {
  const { channel } = await params;
  if (channel !== "phone" && channel !== "email") {
    notFound();
  }

  return (
    <AuthCard
      eyebrow="Legacy route"
      intro="This previous identifier-entry route is retained for review but is not part of the active MVP journey."
      title="Identifier selection is no longer required"
    >
      <div className="stack">
        <Notice title="Email and password is the approved MVP model">
          The former {channel} identifier flow is inactive. No identifier entered here is processed or stored.
        </Notice>
        <ButtonLink href="/sign-in">Go to sign in</ButtonLink>
        <ButtonLink href="/sign-up" variant="secondary">
          Go to sign up
        </ButtonLink>
      </div>
    </AuthCard>
  );
}
