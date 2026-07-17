import { cn } from "@/lib/utils";
import { urgencyColor, statusColor, type Urgency, type RequestStatus } from "@/data/mockData";

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", urgencyColor(urgency), className)}>
      {urgency === "Critical" && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-destructive" />}
      {urgency}
    </span>
  );
}

/** @deprecated Prefer UrgencyBadge */
export function PriorityBadge({ priority, className }: { priority: Urgency; className?: string }) {
  return <UrgencyBadge urgency={priority} className={className} />;
}

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColor(status), className)}>
      {status}
    </span>
  );
}
