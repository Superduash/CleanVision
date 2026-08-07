import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, limit as fsLimit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { api, Notification } from "@/lib/api";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "unread",   label: "Unread" },
  { value: "scans",    label: "Scan Alerts" },
  { value: "requests", label: "Visitor Alerts" },
];

export function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!db) {
      setLoadingLive(false);
      return;
    }

    try {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), fsLimit(100));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const docs: Notification[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type || "alert",
              title: data.title || "Notification",
              message: data.message || "",
              roomId: data.roomId || null,
              is_read: data.is_read ?? data.isRead ?? false,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
            };
          });
          setLiveNotifications(docs);
          setLoadingLive(false);
        },
        () => {
          setLoadingLive(false);
        }
      );
      return unsub;
    } catch {
      setLoadingLive(false);
    }
  }, []);

  const { data: apiData, isLoading: apiLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(100),
    refetchInterval: 15_000,
  });

  const notifications = liveNotifications.length > 0 ? liveNotifications : (apiData?.notifications ?? []);
  const isLoading = liveNotifications.length === 0 && loadingLive && apiLoading;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string | number) => api.markNotificationRead(id),
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
    mutationFn: (id: string | number) => api.deleteNotification(id),
    onSuccess: () => {
      toast.success("Notification deleted.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Failed to delete notification."),
  });

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "scans") return n.type === "scan_result";
    if (filter === "requests") return n.type === "issue_report" || n.type === "cleaning_request";
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications & Alerts
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "You're all caught up!"}
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
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-card overflow-x-auto">
        <Filter className="ml-2 h-3.5 w-3.5 text-text-disabled shrink-0" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
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
        {isLoading && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-surface p-8 shadow-card">
            <Bell className="h-12 w-12 text-text-disabled" />
            <p className="mt-3 text-base font-semibold text-text-primary">No Notifications</p>
            <p className="mt-1 text-sm text-text-muted">
              {filter === "all"
                ? "Notifications will appear here when room scans or alerts occur."
                : `No ${filter} notifications.`}
            </p>
          </div>
        )}

        {filtered.map((item) => {
          const isUnread = !item.is_read;
          const dateObj = new Date(item.createdAt || Date.now());

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 shadow-card transition-all hover:shadow-raised",
                isUnread
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-surface"
              )}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-highlight text-primary">
                {item.type === "scan_result" ? (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                ) : (
                  <ClipboardList className="h-4 w-4 text-primary" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
                  {isUnread && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-xs sm:text-sm text-text-muted">{item.message}</p>
                <div className="flex items-center gap-3 text-[11px] text-text-disabled pt-1">
                  <span>{formatDistanceToNow(dateObj, { addSuffix: true })}</span>
                  <span>·</span>
                  <span>{format(dateObj, "dd MMM yyyy, HH:mm")}</span>
                  {item.roomId && (
                    <>
                      <span>·</span>
                      <Link
                        to={`/dashboard/rooms/${item.roomId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View Room →
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isUnread && (
                  <button
                    onClick={() => markReadMutation.mutate(item.id)}
                    className="rounded-lg p-1.5 text-text-disabled hover:bg-highlight hover:text-primary transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
                  title="Delete"
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
