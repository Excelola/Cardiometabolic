import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";

export function TrendEmptyState() {
  return (
    <div className="trend-empty-state">
      <EmptyState
        action={<ButtonLink href="/app/measurements/new">Add Health Information</ButtonLink>}
        title="Not enough health readings to show changes yet"
      >
        <p>This view needs more supported health readings recorded over time.</p>
      </EmptyState>
      <div aria-hidden="true" className="trend-empty-state__canvas" />
    </div>
  );
}
