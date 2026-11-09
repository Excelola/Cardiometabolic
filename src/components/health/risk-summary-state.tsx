import { ButtonLink } from "@/components/ui/button-link";
import { InformationCard } from "@/components/ui/information-card";
import { Notice } from "@/components/ui/notice";

export function RiskSummaryState() {
  return (
    <section className="risk-summary-state" aria-labelledby="risk-summary-readiness">
      <h2 className="visually-hidden" id="risk-summary-readiness">Risk summary readiness</h2>
      <Notice title="Your summary is not ready yet">
        The information or approved rules needed for this summary are unavailable in this preview.
      </Notice>
      <div className="risk-summary-grid">
        <InformationCard title="Information used">
          <p>Only approved inputs used by the applicable specification will appear here.</p>
        </InformationCard>
        <InformationCard title="Information still needed">
          <p>HILERA will identify approved missing inputs instead of fabricating a result.</p>
        </InformationCard>
        <InformationCard title="Health guides">
          <p>Find out how to use HILERA to review your health information.</p>
          <ButtonLink href="/app/education" variant="text">Browse health guides</ButtonLink>
        </InformationCard>
        <InformationCard title="Next step">
          <p>An approved action appears only when product or clinical rules authorise it.</p>
        </InformationCard>
      </div>
    </section>
  );
}
