import { useState, useRef, useEffect } from "react";
import { safeFormatDistanceToNow } from "@/lib/dateUtils";
import { MapPin, ChevronRight, MoreVertical, Eye, Edit2, ScanLine, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";
import type { Room } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
  isAdmin?: boolean;
  onDelete?: (room: Room) => void;
}

export function RoomCardSkeleton() {
  return (
    <div className="flex h-24 w-full items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="h-12 w-12 rounded-full skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

export function RoomCard({ room, isAdmin: propIsAdmin, onDelete }: RoomCardProps) {
  const { session } = useAuth();
  const isAdmin = propIsAdmin ?? (session?.role === "admin" || session?.role === "manager");
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const borderClass =
    room.latest_status === "clean"
      ? "border-l-4 border-l-success"
      : room.latest_status === "needs_attention"
      ? "border-l-4 border-l-warning"
      : room.latest_status === "dirty"
      ? "border-l-4 border-l-danger"
      : "border-l-4 border-l-border";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:shadow-raised hover:border-primary/30",
        borderClass
      )}
    >
      <Link
        to={`/dashboard/rooms/${room.id}`}
        className="flex flex-1 items-center gap-4 min-w-0 focus-visible:outline-none"
        aria-label={`View details for ${room.name}`}
      >
        <ScoreRing
          score={room.latest_score ?? 0}
          status={room.latest_status ?? undefined}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-text-primary text-sm group-hover:text-primary transition-colors">
              {room.name}
            </h3>
            {room.latest_status && <StatusBadge status={room.latest_status} />}
          </div>

          <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3 shrink-0 text-text-disabled" />
            <span className="truncate">{room.block}</span>
            {room.last_scanned && (
              <>
                <span className="text-text-disabled">·</span>
                <span>{safeFormatDistanceToNow(room.last_scanned)}</span>
              </>
            )}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="rounded-lg p-1 text-text-disabled hover:bg-highlight hover:text-text-primary transition-colors focus-visible:outline-none"
          aria-label="Room actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-30 w-44 animate-scale-in rounded-xl border border-border bg-surface p-1 shadow-raised">
            <button
              onClick={() => { setMenuOpen(false); navigate(`/dashboard/rooms/${room.id}`); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-highlight"
            >
              <Eye className="h-3.5 w-3.5 text-text-disabled" /> View details
            </button>

            <button
              onClick={() => { setMenuOpen(false); navigate(`/dashboard/scan?room=${room.id}`); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-highlight"
            >
              <ScanLine className="h-3.5 w-3.5 text-text-disabled" /> Scan now
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/dashboard/rooms/${room.id}/edit`); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-highlight"
                >
                  <Edit2 className="h-3.5 w-3.5 text-text-disabled" /> Edit room
                </button>

                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(room); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete room
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
