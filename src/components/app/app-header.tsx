import { BrandLockup } from "@/components/brand/brand-lockup";

export function AppHeader() {
  return (
    <header className="app-header">
      <BrandLockup href="/app/dashboard" priority />
      <div className="app-header__meta">
        <span className="preview-label">Test preview</span>
        <span aria-label="Account area unavailable in preview" className="account-placeholder">
          Account
        </span>
      </div>
    </header>
  );
}
