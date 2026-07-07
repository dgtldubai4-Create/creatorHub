import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<
  string,
  "success" | "warning" | "destructive" | "info" | "live" | "muted" | "secondary"
> = {
  // decisions
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  // assets
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  LIVE: "live",
  // campaigns
  PLANNING: "secondary",
  CLOSED: "muted",
  // creators
  PROSPECT: "info",
  ACTIVE: "success",
  PAUSED: "muted",
};

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: "Under Review",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>
      {STATUS_LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
