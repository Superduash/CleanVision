import { useState, useDeferredValue } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ScanLine,
  LayoutGrid,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useRooms, useSummary } from "@/hooks/useRooms";
import { useHospitalConfig } from "@/hooks/useHospitalConfig";
import { api, Room } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { RoomCard, RoomCardSkeleton } from "@/components/RoomCard";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

function ConfirmDeleteModal({
  roomName,
  onConfirm,
  onCancel,
  isLoading,
}: {
  roomName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised">
        <h3 className="text-lg font-bold text-text-primary">Delete Room?</h3>
        <p className="mt-2 text-sm text-text-muted">
          Are you sure you want to delete <strong>{roomName}</strong>? All scan history will be permanently deleted.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-danger hover:bg-danger/90 shadow-none"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Delete Room
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const { config } = useHospitalConfig();
  const queryClient = useQueryClient();

  const isManagerOrAdmin = session?.role === "admin" || session?.role === "manager";

  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: summary } = useSummary();

  const { data: reportsData } = useQuery({
    queryKey: ["issue-reports-open"],
    queryFn: () => api.getIssueReports("open"),
    refetchInterval: 15_000,
  });

  const openIssuesCount = reportsData?.open_count ?? 0;

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>("all");
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.deleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingRoom(null);
    },
    onError: () => toast.error("Failed to delete room."),
  });

  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const filteredRooms = safeRooms.filter((r) => {
    if (selectedBlockFilter !== "all" && r.block !== selectedBlockFilter) return false;
    if (
      deferredSearch &&
      !r.name?.toLowerCase().includes(deferredSearch.toLowerCase()) &&
      !r.block?.toLowerCase().includes(deferredSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalCount = safeRooms.length;
  const cleanCount = summary?.status_counts?.clean ?? safeRooms.filter((r) => r.latest_status === "clean").length;
  const needsCount = summary?.status_counts?.needs_attention ?? safeRooms.filter((r) => r.latest_status === "needs_attention").length;
  const dirtyCount = summary?.status_counts?.dirty ?? safeRooms.filter((r) => r.latest_status === "dirty").length;
  const avgScore = summary?.avg_score_today ?? 85.4;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 page-enter space-y-6 sm:space-y-8">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {config.hospitalName} · {session?.role.toUpperCase()} OPERATIONAL DASHBOARD
          </div>
          <h1 className="mt-2 text-2xl font-bold text-text-primary">
            Welcome back, {session?.name ?? "Staff"} 👋
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {session?.role === "inspector"
              ? `Assigned to ${session.assignedBlocks.join(", ") || "All Blocks"}. Perform room scans or respond to visitor alerts.`
              : "Facility cleanliness overview, room audits, and visitor alert dispatches."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {openIssuesCount > 0 && (
            <Link to="/dashboard/cleaning-requests">
              <div className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger-bg px-4 py-2.5 shadow-sm hover:border-danger transition-colors">
                <Flame className="h-4 w-4 text-danger animate-bounce" />
                <span className="text-xs font-bold text-danger">
                  {openIssuesCount} Visitor Alerts
                </span>
              </div>
            </Link>
          )}

          <Link to="/dashboard/scan">
            <Button size="lg" className="gap-2 font-bold shadow-raised">
              <ScanLine className="h-5 w-5" /> Start Bathroom Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Supporting Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase text-text-muted">Total Rooms</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase text-text-muted">Clean Rooms</p>
          <p className="mt-1 text-2xl font-bold text-success flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5" /> {cleanCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase text-text-muted">Attention / Dirty</p>
          <p className="mt-1 text-2xl font-bold text-warning flex items-center gap-1.5">
            <AlertTriangle className="h-5 w-5" /> {needsCount + dirtyCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase text-text-muted">Avg Cleanliness Score</p>
          <p className="mt-1 text-2xl font-mono font-bold text-primary">{avgScore}/100</p>
        </div>
      </div>

      {/* Controls Bar: Block Filter + Search + Add Room */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedBlockFilter("all")}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
              selectedBlockFilter === "all" ? "border-primary bg-primary text-white shadow-sm" : "border-border bg-surface text-text-muted hover:text-text-primary"
            )}
          >
            All Blocks ({safeRooms.length})
          </button>
          {config.blocks.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBlockFilter(b)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                selectedBlockFilter === b ? "border-primary bg-primary text-white shadow-sm" : "border-border bg-surface text-text-muted hover:text-text-primary"
              )}
            >
              {b} ({safeRooms.filter((r) => r.block === b).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
            <input
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-xs sm:text-sm text-text-primary outline-none focus:border-primary focus:shadow-focus"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isManagerOrAdmin && (
            <Link to="/dashboard/rooms/new">
              <Button size="sm" className="gap-1.5 whitespace-nowrap">
                <Plus className="h-4 w-4" /> Add Room
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roomsLoading && Array.from({ length: 6 }).map((_, i) => <RoomCardSkeleton key={i} />)}

        {!roomsLoading && filteredRooms.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl border border-border bg-surface p-8 shadow-card">
            <LayoutGrid className="mx-auto h-12 w-12 text-text-disabled" />
            <p className="mt-3 text-base font-semibold text-text-primary">No rooms found</p>
            <p className="mt-1 text-sm text-text-muted">
              {search ? "No rooms match your search query." : "No rooms registered for this block filter."}
            </p>
          </div>
        )}

        {filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isAdmin={isManagerOrAdmin}
            onDelete={(r) => setDeletingRoom(r)}
          />
        ))}
      </div>

      {deletingRoom && (
        <ConfirmDeleteModal
          roomName={deletingRoom.name}
          onConfirm={() => deleteMutation.mutate(deletingRoom.id)}
          onCancel={() => setDeletingRoom(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
