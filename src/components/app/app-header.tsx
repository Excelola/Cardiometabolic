import { SignOutForm } from "@/components/auth/sign-out-form";
import { BrandLockup } from "@/components/brand/brand-lockup";

export function AppHeader({ csrf }: Readonly<{ csrf: string }>) {
  return (
    <header className="app-header">
      <BrandLockup href="/app/dashboard" priority />
      <div className="app-header__meta">
        <span className="preview-label">Test preview</span>
        <SignOutForm csrf={csrf} />
      </div>
    </header>
  );
}
