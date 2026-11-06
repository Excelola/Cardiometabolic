import type { ReactNode } from "react";

import { Badge } from "./badge";
import { Card } from "./card";

type StatusCardProps = Readonly<{
  action?: ReactNode;
  children: ReactNode;
  status: string;
  title: string;
}>;

export function StatusCard({ action, children, status, title }: StatusCardProps) {
  return (
    <Card className="status-card">
      <div className="status-card__content">
        <Badge tone="sage">{status}</Badge>
        <h2>{title}</h2>
        <div className="muted">{children}</div>
      </div>
      {action ? <div className="status-card__action">{action}</div> : null}
    </Card>
  );
}
