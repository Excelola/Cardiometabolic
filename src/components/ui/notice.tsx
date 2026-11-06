import type { ReactNode } from "react";

type NoticeProps = Readonly<{
  children: ReactNode;
  title?: string;
  tone?: "info" | "warning" | "critical";
}>;

export function Notice({ children, title, tone = "info" }: NoticeProps) {
  return (
    <aside className={`notice notice--${tone}`} role={tone === "critical" ? "alert" : undefined}>
      {title ? <strong className="notice__title">{title}</strong> : null}
      <div>{children}</div>
    </aside>
  );
}
