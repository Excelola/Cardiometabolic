import Link from "next/link";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { productConfig } from "@/config/product";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <BrandLockup />
          <p>Health information, made clearer over time.</p>
        </div>
        <nav aria-label="Footer navigation" className="site-footer__links">
          <Link href="/#privacy" id="privacy">Privacy</Link>
          <Link href="/#terms" id="terms">Terms</Link>
        </nav>
        <div className="site-footer__boundary">
          <p>
            {productConfig.productName} does not replace professional healthcare.
            This frontend preview provides no medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}
