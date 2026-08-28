import type { Metadata } from "next";

import { MeasurementEntryForm } from "@/components/health/measurement-entry-form";
import { ProvenanceBadge } from "@/components/health/provenance-badge";
import { Card } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { DATA_PROVENANCE, MOCK_MEASUREMENT_DEFINITION } from "@/domain/health";

export const metadata: Metadata = { title: "Add information" };

export default function MeasurementEntryPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">Generic component architecture</p>
        <h1>Add health information</h1>
        <p className="lede">
          This shell demonstrates configurable fields without defining measurement types,
          units, thresholds, or clinical interpretation.
        </p>
      </header>
      <StatusBanner tone="warning">
        No value submitted here is saved, evaluated, scored, or sent anywhere.
      </StatusBanner>
      <Card>
        <MeasurementEntryForm definition={MOCK_MEASUREMENT_DEFINITION} />
      </Card>
      <section className="section" aria-labelledby="provenance-heading">
        <h2 id="provenance-heading">Data provenance presentation</h2>
        <div className="provenance-grid">
          {DATA_PROVENANCE.map((provenance) => (
            <Card key={provenance}>
              <ProvenanceBadge provenance={provenance} />
              <p className="muted">
                Presentation label only. Verification and derivation rules are deferred.
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
