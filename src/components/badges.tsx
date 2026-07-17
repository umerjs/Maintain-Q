import { cn } from "@/lib/utils";
import { priorityColor, statusColor, assetStatusColor, type Priority, type IssueStatus, type AssetStatus } from "@/data/mockData";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", priorityColor(priority), className)}>
      {priority === "Critical" && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-destructive" />}
      {priority}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColor(status), className)}>
      {status}
    </span>
  );
}

export function AssetStatusBadge({ status, className }: { status: AssetStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", assetStatusColor(status), className)}>
      {status}
    </span>
  );
}
