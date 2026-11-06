"use client";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main className="centered-page" id="main-content">
      <div className="card flow-card global-state-card">
        <BrandLockup />
        <h1>Something didn’t load</h1>
        <p>Your information has not been shown as saved unless the action completed successfully.</p>
        <Button onClick={reset} type="button">
          Try again
        </Button>
      </div>
    </main>
  );
}
