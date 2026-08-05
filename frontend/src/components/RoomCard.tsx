import { useState, useRef, useEffect } from "react";
import { safeFormatDistanceToNow } from "@/lib/dateUtils";
import { MapPin, ChevronRight, MoreVertical, Eye, Edit2, ScanLine, Trash2, BellRing } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";
import type { Room } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
  onDelete?: (room: Room) => void;
  onRequestCleaning?: (room: Room) => void;
}

export function RoomCard({ room, onDelete, onRequestCleaning }: RoomCardProps) {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
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
          <p className="truncate font-semibold text-text-primary group-hover:text-primary transition-colors">
            {room.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            {room.block}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {room.latest_status ? (
            <StatusBadge status={room.latest_status} />
          ) : (
            <span className="text-xs text-text-disabled">Not scanned</span>
          )}
          {room.last_scanned && (
            <span className="text-[11px] text-text-muted">
              {safeFormatDistanceToNow(room.last_scanned, { addSuffix: true })}
            </span>
          )}
        </div>
      </Link>

      {/* Action Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="rounded-lg p-1.5 text-text-disabled hover:bg-bg hover:text-text-primary transition-colors"
          aria-label="Room actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-30 w-44 animate-scale-in rounded-xl border border-border bg-surface p-1 shadow-raised glass">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate(`/dashboard/rooms/${room.id}`);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-highlight"
            >
              <Eye className="h-3.5 w-3.5 text-text-muted" /> View Details
            </button>

            {isAdmin ? (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/dashboard/rooms/${room.id}/edit`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-highlight"
                >
                  <Edit2 className="h-3.5 w-3.5 text-text-muted" /> Edit Room
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/dashboard/scan?room=${room.id}`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-primary hover:bg-highlight"
                >
                  <ScanLine className="h-3.5 w-3.5 text-text-muted" /> Scan Now
                </button>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(room);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger-bg"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Room
                </button>
              </>
            ) : (
              (room.latest_status === "dirty" || room.latest_status === "needs_attention") && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRequestCleaning?.(room);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-warning hover:bg-warning-bg"
                >
                  <BellRing className="h-3.5 w-3.5" /> Request Cleaning
                </button>
              )
            )}
          </div>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-text-disabled group-hover:text-primary transition-colors" />
    </div>
  );
}
