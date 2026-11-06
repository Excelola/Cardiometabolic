import Link from "next/link";

import { BrandLockup } from "@/components/brand/brand-lockup";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <BrandLockup priority />
        <nav aria-label="Public navigation" className="site-header__nav">
          <div className="site-header__info-links">
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#why-hilera">Why HILERA</Link>
            <Link href="/#learn">Learn</Link>
          </div>
          <Link className="site-header__sign-in" href="/sign-in">Sign in</Link>
          <Link className="button button--primary button--compact" href="/sign-up">
            Create account
          </Link>
        </nav>
      </div>
    </header>
  );
}
