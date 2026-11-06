import { InformationCard } from "@/components/ui/information-card";
import { Notice } from "@/components/ui/notice";

export function RiskSummaryState() {
  return (
    <section className="risk-summary-state" aria-labelledby="risk-summary-readiness">
      <Notice title="Your summary is not ready yet.">
        Required information or approved clinical logic is still unavailable.
      </Notice>
      <div className="risk-summary-grid">
        <InformationCard title="Information considered">
          <p>Only approved inputs used by the applicable specification will appear here.</p>
        </InformationCard>
        <InformationCard title="Missing information">
          <p>HILERA will identify approved missing inputs instead of fabricating a result.</p>
        </InformationCard>
        <InformationCard title="Education">
          <p>Approved explanations can help you understand the information shown.</p>
        </InformationCard>
        <InformationCard title="Next step">
          <p>An approved action appears only when product or clinical rules authorise it.</p>
        </InformationCard>
      </div>
      <h2 className="visually-hidden" id="risk-summary-readiness">Risk summary readiness</h2>
    </section>
  );
}
