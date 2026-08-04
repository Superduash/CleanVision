import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Building2,
  User2,
  MessageSquare,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { api, type CleaningRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const STATUS_MAP: Record<
  CleaningRequest["status"],
  { label: string; icon: React.ElementType; className: string; nextActions: { status: string; label: string; className: string }[] }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning-bg text-warning border-warning/30",
    nextActions: [
      { status: "in_progress", label: "Accept", className: "text-primary hover:bg-primary/10" },
      { status: "dismissed",   label: "Dismiss", className: "text-text-muted hover:bg-border/50" },
    ],
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    className: "bg-primary/10 text-primary border-primary/20",
    nextActions: [
      { status: "completed", label: "Mark complete", className: "text-success hover:bg-success-bg" },
    ],
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-success-bg text-success border-success/20",
    nextActions: [],
  },
  dismissed: {
    label: "Dismissed",
    icon: XCircle,
    className: "bg-border/50 text-text-muted border-border",
    nextActions: [],
  },
};

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
  { value: "dismissed",   label: "Dismissed" },
];

export function CleaningRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cleaning-requests", statusFilter],
    queryFn: () => api.getCleaningRequests(statusFilter === "all" ? undefined : statusFilter),
    refetchInterval: 30_000,
  });

  const requests = data?.requests ?? [];
  const pendingCount = data?.pending_count ?? 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.updateCleaningRequest(id, status),
    onSuccess: () => {
      toast.success("Request updated.");
      queryClient.invalidateQueries({ queryKey: ["cleaning-requests"] });
    },
    onError: () => toast.error("Failed to update request."),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Cleaning Requests
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage patient and staff cleaning requests across all rooms.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-bg px-4 py-2.5">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-warning">
              {pendingCount} pending
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex items-center gap-1 rounded-xl border border-border bg-surface p-1 w-fit shadow-card">
        <Filter className="ml-2 h-3.5 w-3.5 text-text-disabled shrink-0" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              statusFilter === tab.value
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-5 space-y-3">
        {isLoading && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))
        )}

        {!isLoading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="h-12 w-12 text-text-disabled" />
            <p className="mt-3 text-lg font-semibold text-text-primary">No requests found</p>
            <p className="mt-1 text-sm text-text-muted">
              {statusFilter === "all"
                ? "No cleaning requests have been submitted yet."
                : `No ${statusFilter.replace("_", " ")} requests.`}
            </p>
          </div>
        )}

        {requests.map((req) => {
          const st = STATUS_MAP[req.status];
          const Icon = st.icon;

          return (
            <div
              key={req.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-card transition-all hover:shadow-raised"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-highlight">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/dashboard/rooms/${req.room_id}`}
                      className="font-semibold text-text-primary hover:text-primary hover:underline"
                    >
                      {req.room_name}
                    </Link>
                    <span className="text-text-disabled">·</span>
                    <span className="text-sm text-text-muted">{req.room_block}</span>
                    <span className={cn(
                      "ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      st.className
                    )}>
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <User2 className="h-3.5 w-3.5" />
                      {req.requested_by_name}
                      {req.requested_by_email && (
                        <span className="text-xs text-text-disabled">({req.requested_by_email})</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </span>
                    <span className="hidden sm:block text-xs text-text-disabled">
                      {format(new Date(req.created_at), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>

                  {req.reason && (
                    <p className="flex items-start gap-1.5 rounded-lg bg-highlight px-3 py-2 text-sm text-text-muted">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {req.reason}
                    </p>
                  )}
                </div>
              </div>

              {st.nextActions.length > 0 && (
                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  {st.nextActions.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => updateMutation.mutate({ id: req.id, status: action.status })}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                        action.className
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
