import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";

export const metadata: Metadata = { title: "Trends" };

export default function TrendsPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Trend-view shell</p>
        <h1>Trends over time</h1>
        <p className="lede">
          This page reserves a responsive, accessible presentation area for approved data.
        </p>
      </header>
      <StatusBanner>
        No measurements, reference ranges, thresholds, or clinical trends are implemented.
      </StatusBanner>
      <Card>
        <div
          aria-label="Empty trend chart placeholder"
          className="chart-placeholder"
          role="img"
        >
          Trend visualization will appear after approved measurement definitions and data
          services are available.
        </div>
      </Card>
    </>
  );
}
