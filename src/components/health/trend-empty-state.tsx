import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";

export function TrendEmptyState() {
  return (
    <div className="trend-empty-state">
      <div aria-hidden="true" className="trend-empty-state__canvas" />
      <EmptyState
        action={<ButtonLink href="/app/measurements/new">Add information</ButtonLink>}
        title="Not enough supported history yet"
      >
        <p>
          HILERA will show a real trend only when enough approved information exists for
          the selected measurement.
        </p>
      </EmptyState>
    </div>
  );
}
