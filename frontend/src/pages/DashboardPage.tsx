import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ScanLine,
  BellRing,
  ShieldCheck,
  Search,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRooms, useSummary } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { api, type Room } from "@/lib/api";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/Button";

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDeleteModal({
  roomName,
  onConfirm,
  onCancel,
  isLoading,
}: {
  roomName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-bg">
          <Trash2 className="h-5 w-5 text-danger" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-text-primary">Delete "{roomName}"?</h3>
        <p className="mt-1.5 text-sm text-text-muted">
          This will permanently remove the room and all associated scan history. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
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

// ── Quick Cleaning Request Modal ──────────────────────────────────────────────
function PatientCleaningModal({
  room,
  onClose,
}: {
  room: Room;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.createCleaningRequest({
        room_id: room.id,
        requested_by_name: session?.name ?? "Patient",
        requested_by_email: session?.email ?? "",
        reason,
      }),
    onSuccess: () => {
      toast.success("Cleaning request submitted! Staff notified.");
      queryClient.invalidateQueries({ queryKey: ["cleaning-requests"] });
      onClose();
    },
    onError: () => toast.error("Failed to submit request."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-disabled hover:text-text-muted">
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BellRing className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-text-primary">Request Cleaning</h3>
        <p className="mt-1 text-sm text-text-muted">
          Request room service / cleaning for <strong>{room.name}</strong>.
        </p>
        <div className="mt-4">
          <textarea
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:shadow-focus resize-none"
            rows={3}
            placeholder="Details (e.g. spill, trash bin full)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: summary } = useSummary();

  const [search, setSearch] = useState("");
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [requestingRoom, setRequestingRoom] = useState<Room | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingRoom(null);
    },
    onError: () => toast.error("Failed to delete room."),
  });

  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const filteredRooms = safeRooms.filter(
    (r) =>
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.block?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = safeRooms.length;
  const cleanCount = summary?.status_counts?.clean ?? safeRooms.filter((r) => r.latest_status === "clean").length;
  const needsCount = summary?.status_counts?.needs_attention ?? safeRooms.filter((r) => r.latest_status === "needs_attention").length;
  const dirtyCount = summary?.status_counts?.dirty ?? safeRooms.filter((r) => r.latest_status === "dirty").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 page-enter space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <span className="dot-pulse bg-primary" />
            {isAdmin ? "Admin / QA Management" : "Patient / Staff Portal"}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-text-primary">
            Welcome back, {session?.name ?? "User"} 👋
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {isAdmin
              ? "Here's today's cleanliness overview across all hospital rooms."
              : "View room cleanliness statuses and request room service."}
          </p>
        </div>

        {/* Action strip */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <Link to="/dashboard/scan">
                <Button size="sm" className="gap-1.5">
                  <ScanLine className="h-4 w-4" /> New Scan
                </Button>
              </Link>
              <Link to="/dashboard/rooms/new">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Room
                </Button>
              </Link>
              <Link to="/dashboard/admin">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Admin Panel
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/dashboard/notifications">
              <Button size="sm" variant="secondary" className="gap-1.5">
                <BellRing className="h-4 w-4" /> Alerts
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Admin KPI Stats */}
      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Rooms</span>
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-bold text-text-primary">{totalCount}</p>
            <p className="mt-1 text-xs text-text-muted">Registered in system</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Clean Rooms</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <p className="mt-2 text-3xl font-bold text-success">{cleanCount}</p>
            <p className="mt-1 text-xs text-text-muted">
              {totalCount > 0 ? Math.round((cleanCount / totalCount) * 100) : 0}% of facility
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Attention Needed</span>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <p className="mt-2 text-3xl font-bold text-warning">{needsCount + dirtyCount}</p>
            <p className="mt-1 text-xs text-text-muted">
              {dirtyCount} dirty · {needsCount} needs check
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Score Today</span>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {summary && summary.avg_score_today !== undefined ? Math.round(summary.avg_score_today) : "—"}
            </p>
            <p className="mt-1 text-xs text-text-muted">Target: 85+</p>
          </div>
        </div>
      )}

      {/* Room Grid Header & Search */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Facility Rooms</h2>
            <p className="text-sm text-text-muted">
              Showing {filteredRooms.length} of {totalCount} rooms
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
            <input
              type="text"
              placeholder="Filter rooms or blocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-disabled focus:border-primary focus:shadow-focus"
            />
          </div>
        </div>

        {/* Room Cards Grid */}
        {roomsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-text-disabled" />
            <h3 className="mt-3 text-base font-semibold text-text-primary">No rooms found</h3>
            <p className="mt-1 text-sm text-text-muted">
              {search ? "No rooms match your filter." : "Get started by adding your first room."}
            </p>
            {isAdmin && !search && (
              <Link to="/dashboard/rooms/new" className="mt-4 inline-block">
                <Button size="sm">Add Room</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onDelete={(r) => setDeletingRoom(r)}
                onRequestCleaning={(r) => setRequestingRoom(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingRoom && (
        <ConfirmDeleteModal
          roomName={deletingRoom.name}
          onConfirm={() => deleteMutation.mutate(deletingRoom.id)}
          onCancel={() => setDeletingRoom(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Patient Cleaning Modal */}
      {requestingRoom && (
        <PatientCleaningModal
          room={requestingRoom}
          onClose={() => setRequestingRoom(null)}
        />
      )}
    </div>
  );
}
