import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type AuthCardProps = Readonly<{
  title: string;
  intro: string;
  children: ReactNode;
  eyebrow?: string;
  note?: ReactNode;
}>;

export function AuthCard({
  title,
  intro,
  children,
  eyebrow = "Account access",
  note,
}: AuthCardProps) {
  return (
    <main className="auth-page" id="main-content">
      <div className="container auth-page__inner">
        <header className="auth-page__heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{intro}</p>
        </header>
        <Card className="auth-card">
          {note ? <div className="auth-card__note muted">{note}</div> : null}
          {children}
        </Card>
      </div>
    </main>
  );
}
