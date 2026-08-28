import type { DataProvenance } from "@/domain/health";

type ProvenanceBadgeProps = Readonly<{ provenance: DataProvenance }>;

export function ProvenanceBadge({ provenance }: ProvenanceBadgeProps) {
  return (
    <span className="provenance-badge" title={`Data provenance: ${provenance}`}>
      {provenance}
    </span>
  );
}
