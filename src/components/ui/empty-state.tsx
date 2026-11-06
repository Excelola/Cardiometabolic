import type { ReactNode } from "react";

type EmptyStateProps = Readonly<{
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  title: string;
}>;

export function EmptyState({ action, children, eyebrow, title }: EmptyStateProps) {
  return (
    <section className="empty-state">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      <div className="muted empty-state__copy">{children}</div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </section>
  );
}
