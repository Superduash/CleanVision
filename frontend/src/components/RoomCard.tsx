import { formatDistanceToNow } from "date-fns";
import { MapPin, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";
import type { Room } from "@/lib/api";

export function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      to={`/dashboard/rooms/${room.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:shadow-raised hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      aria-label={`View details for ${room.name}`}
    >
      <ScoreRing
        score={room.latest_score ?? 0}
        status={room.latest_status ?? undefined}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary">{room.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
          <MapPin className="h-3 w-3" />
          {room.block}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {room.latest_status ? (
          <StatusBadge status={room.latest_status} />
        ) : (
          <span className="text-xs text-text-disabled">Not scanned yet</span>
        )}
        {room.last_scanned && (
          <span className="text-xs text-text-muted">
            {formatDistanceToNow(new Date(room.last_scanned), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-text-disabled" />
    </Link>
  );
}
