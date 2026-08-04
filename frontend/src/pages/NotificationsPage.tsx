import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { api, type Notification } from "@/lib/api";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all",    label: "All" },
  { value: "unread", label: "Unread" },
  { value: "scans",  label: "Scan Alerts" },
  { value: "requests", label: "Cleaning Requests" },
];

export function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(100),
    refetchInterval: 15_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Failed to mark all as read."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteNotification(id),
    onSuccess: () => {
      toast.success("Notification deleted.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Failed to delete notification."),
  });

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return n.is_read === 0;
    if (filter === "scans") return n.type === "scan_result";
    if (filter === "requests") return n.type === "cleaning_request";
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications & Alerts
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Stay updated on room cleanliness scans and service requests.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            isLoading={markAllReadMutation.isPending}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4 text-primary" /> Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 w-fit shadow-card">
        <Filter className="ml-2 h-3.5 w-3.5 text-text-disabled shrink-0" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              filter === tab.value
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h3 className="mt-3 text-base font-semibold text-text-primary">All caught up!</h3>
            <p className="mt-1 text-sm text-text-muted">
              {filter === "unread" ? "No unread notifications." : "No notifications in this category."}
            </p>
          </div>
        )}

        {filtered.map((item: Notification) => {
          const isUnread = item.is_read === 0;
          const isScan = item.type === "scan_result";

          return (
            <div
              key={item.id}
              className={cn(
                "group relative flex items-start gap-4 rounded-xl border p-4 shadow-card transition-all hover:shadow-raised",
                isUnread
                  ? "border-primary/40 bg-highlight/60 border-l-4 border-l-primary"
                  : "border-border bg-surface"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isScan ? "bg-warning-bg text-warning" : "bg-primary/10 text-primary"
                )}
              >
                {isScan ? <AlertTriangle className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
                  {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-text-muted">{item.message}</p>
                <div className="flex items-center gap-3 text-xs text-text-disabled pt-1">
                  <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  <span>·</span>
                  <span>{format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}</span>
                  {item.room_id && (
                    <>
                      <span>·</span>
                      <Link
                        to={`/dashboard/rooms/${item.room_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View Room →
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {isUnread && (
                  <button
                    onClick={() => markReadMutation.mutate(item.id)}
                    className="rounded-lg p-1.5 text-text-disabled hover:bg-bg hover:text-primary transition-colors"
                    title="Mark read"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
