import { Check, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type RoomStatus } from "@/lib/api";

const STYLES: Record<RoomStatus, string> = {
  clean: "bg-success-bg text-success",
  needs_attention: "bg-warning-bg text-warning",
  dirty: "bg-danger-bg text-danger",
};

const ICONS: Record<RoomStatus, typeof Check> = {
  clean: Check,
  needs_attention: AlertTriangle,
  dirty: X,
};

export function StatusBadge({ status, className }: { status: RoomStatus; className?: string }) {
  const Icon = ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        STYLES[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {STATUS_LABEL[status]}
    </span>
  );
}
