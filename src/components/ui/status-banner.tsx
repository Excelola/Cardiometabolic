import type { ReactNode } from "react";

type StatusBannerProps = Readonly<{
  children: ReactNode;
  tone?: "info" | "warning";
}>;

export function StatusBanner({ children, tone = "info" }: StatusBannerProps) {
  return (
    <div className={`status-banner status-banner--${tone}`} role="status">
      {children}
    </div>
  );
}
