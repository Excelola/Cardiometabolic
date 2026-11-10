"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const APP_LINKS = [
  { href: "/app/dashboard", label: "Overview" },
  { href: "/app/measurements/new", label: "Add Health Information" },
  { href: "/app/measurements/history", label: "Past measurements" },
  { href: "/app/trends", label: "Changes over time" },
  { href: "/app/risk-summary", label: "Health risk summary" },
  { href: "/app/education", label: "Health guides" },
] as const;

export function AppNavigation() {
  const pathname = usePathname()?.replace(/\/$/, "");
  const current = APP_LINKS.find((link) => link.href === pathname);
  const links = APP_LINKS.map((link) => {
    const isCurrent = link.href === pathname;

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
  });

  return (
    <nav aria-label="Application navigation" className="app-navigation">
      <p className="eyebrow app-navigation__label">Health journal</p>
      <div className="app-nav app-nav--desktop">{links}</div>
      <details className="app-navigation__mobile" key={pathname}>
        <summary>
          <span className="app-navigation__summary-label">Browse journal</span>
          <span className="app-navigation__current">{current?.label ?? "Sections"}</span>
        </summary>
        <div className="app-nav app-nav--mobile">{links}</div>
      </details>
    </nav>
  );
}
