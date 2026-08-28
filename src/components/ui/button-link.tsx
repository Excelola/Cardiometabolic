import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = Readonly<{
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "text";
}>;

export function ButtonLink({
  children,
  href,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link className={`button button--${variant}`} href={href}>
      {children}
    </Link>
  );
}
