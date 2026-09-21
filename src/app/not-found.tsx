import { BrandLockup } from "@/components/brand/brand-lockup";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="centered-page" id="main-content">
      <div className="card flow-card global-state-card">
        <BrandLockup />
        <h1>We can’t find that page</h1>
        <p>The page may have moved, or the address may be incorrect.</p>
        <ButtonLink href="/app/dashboard">Go to dashboard</ButtonLink>
      </div>
    </main>
  );
}
