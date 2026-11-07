import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";

export function TrendEmptyState() {
  return (
    <div className="trend-empty-state">
      <div aria-hidden="true" className="trend-empty-state__canvas" />
      <EmptyState
        action={<ButtonLink href="/app/measurements/new">Add health information</ButtonLink>}
        title="Not enough supported history yet"
      >
        <p>
          Trend views need enough supported records over time. This preview does not contain those records.
        </p>
      </EmptyState>
    </div>
  );
}
