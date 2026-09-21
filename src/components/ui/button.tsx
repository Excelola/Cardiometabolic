import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "text";

type ButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

type ButtonLinkProps = Readonly<{
  children: ReactNode;
  className?: string;
  href: string;
  variant?: ButtonVariant;
}>;

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      {...props}
    />
  );
}

export function ButtonLink({
  children,
  className = "",
  href,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link className={`button button--${variant} ${className}`.trim()} href={href}>
      {children}
    </Link>
  );
}
