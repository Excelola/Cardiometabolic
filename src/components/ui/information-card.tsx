import type { ReactNode } from "react";

import { Card } from "./card";

type InformationCardProps = Readonly<{
  children: ReactNode;
  title: string;
  eyebrow?: string;
}>;

export function InformationCard({ children, eyebrow, title }: InformationCardProps) {
  return (
    <Card className="information-card">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <div className="muted">{children}</div>
    </Card>
  );
}
