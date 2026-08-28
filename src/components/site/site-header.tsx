import Link from "next/link";

import { productConfig } from "@/config/product";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="wordmark" href="/">
          {productConfig.productName}
        </Link>
        <nav aria-label="Public navigation" className="site-header__nav">
          <Link href="/sign-in">Sign in</Link>
          <Link className="button button--primary button--compact" href="/sign-up">
            Create account
          </Link>
        </nav>
      </div>
    </header>
  );
}
