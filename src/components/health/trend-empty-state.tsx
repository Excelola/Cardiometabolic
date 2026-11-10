import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";

export function TrendEmptyState() {
  return (
    <div className="trend-empty-state">
      <EmptyState
        action={<ButtonLink href="/app/measurements/new">Add Health Information</ButtonLink>}
        title="Changes over time are unavailable"
      >
        <p>Use History to review your entries in their original units.</p>
      </EmptyState>
      <div aria-hidden="true" className="trend-empty-state__canvas" />
    </div>
  );
}
