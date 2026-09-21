import type { ReactNode } from "react";

type BadgeProps = Readonly<{
  children: ReactNode;
  tone?: "neutral" | "sage" | "sand" | "forest";
}>;

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
