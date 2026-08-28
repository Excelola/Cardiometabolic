import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main className="centered-page" id="main-content">
      <div className="card flow-card">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you requested is not part of this frontend foundation.</p>
        <ButtonLink href="/">Return home</ButtonLink>
      </div>
    </main>
  );
}
