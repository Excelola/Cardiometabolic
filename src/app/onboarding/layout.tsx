import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function OnboardingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="public-frame">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
