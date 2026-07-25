import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  formatDistanceToNow,
  startOfDay,
  isAfter,
  subDays,
} from "date-fns";
import { Filter, ChevronDown, ExternalLink } from "lucide-react";
import { api, type RoomStatus } from "@/lib/api";
import { useRooms } from "@/hooks/useRooms";
import { StatusBadge } from "@/components/StatusBadge";

const DATE_RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "All time", days: 0 },
];

const STATUS_OPTIONS: { value: RoomStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "clean", label: "Clean" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "dirty", label: "Dirty" },
];

interface FlatScan {
  id: number;
  room_id: number;
  roomName: string;
  roomBlock: string;
  cleanliness_score: number;
  status: RoomStatus;
  timestamp: string;
}

/** Fetches history for ALL rooms and merges them into a single flat list. */
function useAllHistory(
  rooms: ReturnType<typeof useRooms>["data"],
  selectedRoomId: number,
) {
  // Always fetch all rooms' history; we filter client-side
  const allRoomIds = useMemo(
    () => rooms?.map((r) => r.id) ?? [],
    [rooms],
  );

  const query = useQuery({
    queryKey: ["history-all", allRoomIds],
    queryFn: async () => {
      if (allRoomIds.length === 0) return [];
      const results = await Promise.all(
        allRoomIds.map((id) => api.getHistory(id, 100)),
      );
      return allRoomIds.flatMap((rid, i) =>
        results[i].history.map((scan) => ({ ...scan, roomId: rid })),
      );
    },
    enabled: allRoomIds.length > 0,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const flat: FlatScan[] = useMemo(() => {
    if (!query.data || !rooms) return [];
    return query.data
      .map((scan) => {
        const room = rooms.find((r) => r.id === scan.room_id);
        return {
          id: scan.id,
          room_id: scan.room_id,
          roomName: room?.name ?? `Room ${scan.room_id}`,
          roomBlock: room?.block ?? "—",
          cleanliness_score: scan.cleanliness_score,
          status: scan.status,
          timestamp: scan.timestamp,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [query.data, rooms]);

  const filtered = useMemo(() => {
    if (selectedRoomId) {
      return flat.filter((s) => s.room_id === selectedRoomId);
    }
    return flat;
  }, [flat, selectedRoomId]);

  return { ...query, flat: filtered };
}

export function HistoryPage() {
  const [searchParams] = useSearchParams();
  const preselectedRoom = searchParams.get("room")
    ? Number(searchParams.get("room"))
    : 0;

  const { data: rooms } = useRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<number>(preselectedRoom);
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [dateRange, setDateRange] = useState<number>(7);

  const { flat, isLoading, isError } = useAllHistory(rooms, selectedRoomId);

  const filteredScans = useMemo(() => {
    return flat.filter((scan) => {
      const matchesStatus =
        statusFilter === "all" || scan.status === statusFilter;
      const cutoff =
        dateRange > 0
          ? startOfDay(subDays(new Date(), dateRange - 1))
          : new Date(0);
      const matchesDate = isAfter(new Date(scan.timestamp), cutoff);
      return matchesStatus && matchesDate;
    });
  }, [flat, statusFilter, dateRange]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Scan history
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          All scans across the facility, filterable by room, status, and date.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 shrink-0 text-text-muted" />

        <div className="relative">
          <select
            id="history-room-filter"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="h-9 appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value={0}>All rooms</option>
            {rooms?.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        </div>

        <div className="relative">
          <select
            id="history-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as RoomStatus | "all")
            }
            className="h-9 appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm text-text-primary outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        </div>

        <div className="relative">
          <select
            id="history-date-filter"
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="h-9 appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm text-text-primary outline-none focus:border-primary"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.days} value={r.days}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        </div>

        <span className="ml-auto text-sm text-text-muted">
          {isLoading
            ? "Loading…"
            : `${filteredScans.length} ${filteredScans.length === 1 ? "scan" : "scans"}`}
        </span>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-text-primary">
              Couldn&apos;t load history
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Check that the backend is running and refresh.
            </p>
          </div>
        )}

        {!isLoading && !isError && filteredScans.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-medium text-text-primary">No scans found</p>
            <p className="mt-1 text-sm text-text-muted">
              Try widening the date range or changing the filters.
            </p>
          </div>
        )}

        {!isLoading && filteredScans.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted sm:table-cell">
                    Room
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted md:table-cell">
                    Block
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    When
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredScans.map((scan) => (
                  <tr
                    key={`${scan.room_id}-${scan.id}`}
                    className="transition-colors hover:bg-bg"
                  >
                    <td className="px-6 py-3 font-mono font-semibold text-text-primary">
                      {Math.round(scan.cleanliness_score)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={scan.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-text-primary sm:table-cell">
                      {scan.roomName}
                    </td>
                    <td className="hidden px-4 py-3 text-text-muted md:table-cell">
                      {scan.roomBlock}
                    </td>
                    <td className="px-6 py-3 text-text-muted">
                      <span
                        title={format(
                          new Date(scan.timestamp),
                          "dd MMM yyyy, HH:mm",
                        )}
                      >
                        {formatDistanceToNow(new Date(scan.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/rooms/${scan.room_id}`}
                        aria-label={`View ${scan.roomName}`}
                        className="rounded p-1 text-text-disabled hover:text-primary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
