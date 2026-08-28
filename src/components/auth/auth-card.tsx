import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type AuthCardProps = Readonly<{
  title: string;
  intro: string;
  children: ReactNode;
  eyebrow?: string;
}>;

export function AuthCard({
  title,
  intro,
  children,
  eyebrow = "Secure account access",
}: AuthCardProps) {
  return (
    <main className="centered-page" id="main-content">
      <Card className="flow-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{intro}</p>
        {children}
      </Card>
    </main>
  );
}
