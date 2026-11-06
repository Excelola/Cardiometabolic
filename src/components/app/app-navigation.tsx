"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const APP_LINKS = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/measurements/new", label: "Add data" },
  { href: "/app/measurements/history", label: "History" },
  { href: "/app/trends", label: "Trends" },
  { href: "/app/risk-summary", label: "Summary" },
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Application navigation" className="app-nav">
      {APP_LINKS.map((link) => {
        const isCurrent = pathname === link.href;
        return (
          <Link
            aria-current={isCurrent ? "page" : undefined}
            className={isCurrent ? "is-current" : undefined}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
