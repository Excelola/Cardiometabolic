import type { ReactNode } from "react";

type CardProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function Card({ children, className = "" }: CardProps) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}
