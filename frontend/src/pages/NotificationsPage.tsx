import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useRooms } from "@/hooks/useRooms";
import type { RoomStatus } from "@/lib/api";

interface Notification {
  id: string;
  type: RoomStatus;
  roomId: number;
  roomName: string;
  roomBlock: string;
  score: number;
  timestamp: string;
}

const TYPE_ICONS = {
  dirty: XCircle,
  needs_attention: AlertTriangle,
  clean: CheckCircle,
};

const TYPE_COLORS = {
  dirty: "text-danger bg-danger-bg",
  needs_attention: "text-warning bg-warning-bg",
  clean: "text-success bg-success-bg",
};

const TYPE_MESSAGES = {
  dirty: (name: string, score: number) =>
    `${name} scored ${score} — requires immediate attention.`,
  needs_attention: (name: string, score: number) =>
    `${name} scored ${score} — schedule a cleaning check soon.`,
  clean: (name: string, score: number) =>
    `${name} scored ${score} — meets cleanliness standards.`,
};

export function NotificationsPage() {
  const { data: rooms, isLoading } = useRooms();

  // Derive notifications from the latest scan status of each room
  const notifications: Notification[] = useMemo(() => {
    if (!rooms) return [];
    return rooms
      .filter((r) => r.latest_status && r.last_scanned)
      .map((r) => ({
        id: `room-${r.id}`,
        type: r.latest_status!,
        roomId: r.id,
        roomName: r.name,
        roomBlock: r.block,
        score: Math.round(r.latest_score ?? 0),
        timestamp: r.last_scanned!,
      }))
      .sort((a, b) => {
        // Dirty first, then needs_attention, then clean
        const rank: Record<RoomStatus, number> = {
          dirty: 0,
          needs_attention: 1,
          clean: 2,
        };
        const rankDiff = rank[a.type] - rank[b.type];
        if (rankDiff !== 0) return rankDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [rooms]);

  const alertNotifications = notifications.filter(
    (n) => n.type === "dirty" || n.type === "needs_attention",
  );
  const cleanNotifications = notifications.filter((n) => n.type === "clean");

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 page-enter">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-text-primary">
          Notifications
        </h1>
        {alertNotifications.length > 0 && (
          <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">
            {alertNotifications.length}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-text-muted">
        Latest status alerts based on most recent scans.
      </p>
      <p className="mt-2 text-xs text-text-disabled">
        ⚠️ Notifications are derived from the current room list — no push
        notifications until the backend adds a notifications endpoint.
      </p>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-bg">
            <Bell className="h-7 w-7 text-text-disabled" />
          </div>
          <p className="font-medium text-text-primary">No notifications yet</p>
          <p className="text-sm text-text-muted">
            Scan some rooms to see alerts here.
          </p>
        </div>
      )}

      {alertNotifications.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-danger">
            Action required ({alertNotifications.length})
          </h2>
          <div className="space-y-2">
            {alertNotifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        </div>
      )}

      {cleanNotifications.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            All clear ({cleanNotifications.length})
          </h2>
          <div className="space-y-2">
            {cleanNotifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationCard({ notification: n }: { notification: Notification }) {
  const Icon = TYPE_ICONS[n.type];
  const colorClass = TYPE_COLORS[n.type];
  const message = TYPE_MESSAGES[n.type](n.roomName, n.score);

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-card">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{message}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {n.roomBlock} ·{" "}
          {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
        </p>
      </div>
      <Link
        to={`/dashboard/rooms/${n.roomId}`}
        aria-label={`View ${n.roomName}`}
        className="rounded p-1 text-text-disabled hover:text-primary"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}
