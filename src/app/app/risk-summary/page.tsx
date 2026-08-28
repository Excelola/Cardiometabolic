import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";

export const metadata: Metadata = { title: "Risk Awareness Summary" };

export default function RiskSummaryPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Summary shell</p>
        <h1>Risk Awareness Summary</h1>
        <p className="lede">
          A reserved surface for approved deterministic results and permitted explanations.
        </p>
      </header>
      <StatusBanner tone="warning">
        No risk formula, score, threshold, diagnosis, recommendation, or escalation logic is
        present in this foundation.
      </StatusBanner>
      <div className="dashboard-grid">
        <Card>
          <h2>Inputs</h2>
          <div className="empty-state">Awaiting approved input specifications.</div>
        </Card>
        <Card>
          <h2>Summary</h2>
          <div className="empty-state">Awaiting approved deterministic clinical specification.</div>
        </Card>
        <Card>
          <h2>Provenance</h2>
          <div className="empty-state">Awaiting approved derivation and verification rules.</div>
        </Card>
      </div>
    </>
  );
}
