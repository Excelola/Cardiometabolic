import Link from "next/link";
import type { ReactNode } from "react";

import { productConfig } from "@/config/product";

type AppShellProps = Readonly<{ children: ReactNode }>;

const APP_LINKS = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/measurements/new", label: "Add data" },
  { href: "/app/measurements/history", label: "History" },
  { href: "/app/trends", label: "Trends" },
  { href: "/app/risk-summary", label: "Summary" },
] as const;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-frame">
      <header className="app-header">
        <Link className="wordmark" href="/app/dashboard">
          {productConfig.productName}
        </Link>
        <span className="preview-label">Synthetic preview</span>
      </header>
      <div className="app-frame__body">
        <nav aria-label="Application navigation" className="app-nav">
          {APP_LINKS.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="app-main" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
