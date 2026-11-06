import type { DataProvenance } from "@/domain/health";
import { Badge } from "@/components/ui/badge";

type ProvenanceBadgeProps = Readonly<{ provenance: DataProvenance }>;

export function ProvenanceBadge({ provenance }: ProvenanceBadgeProps) {
  const tone = provenance === "Imported" ? "sand" : provenance === "Verified" ? "sage" : "neutral";

  return (
    <span title={`Data provenance: ${provenance}`}>
      <Badge tone={tone}>{provenance}</Badge>
    </span>
  );
}
