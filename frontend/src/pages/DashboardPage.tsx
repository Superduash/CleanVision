import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, type RoomStatus } from "@/lib/api";
import { useRooms, useSummary } from "@/hooks/useRooms";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";

const STATUS_FILTERS: { value: RoomStatus | "all"; label: string }[] = [
  { value: "all", label: "All rooms" },
  { value: "dirty", label: "Dirty" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "clean", label: "Clean" },
];

export function DashboardPage() {
  const { data: rooms, isLoading, isError } = useRooms();
  const { data: summary } = useSummary();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(search.toLowerCase()) ||
        room.block.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || room.latest_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, search, statusFilter]);

  const sortedRooms = useMemo(() => {
    const rank: Record<string, number> = {
      dirty: 0,
      needs_attention: 1,
      clean: 2,
    };
    return [...filteredRooms].sort((a, b) => {
      const rankA = a.latest_status ? rank[a.latest_status] : 3;
      const rankB = b.latest_status ? rank[b.latest_status] : 3;
      return rankA - rankB;
    });
  }, [filteredRooms]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Facility-wide room status at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add room
          </Button>
          <Link to="/dashboard/scan">
            <Button>
              <ScanLine className="h-4 w-4" /> New scan
            </Button>
          </Link>
        </div>
      </div>

      {/* Facility summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))
        ) : (
          <>
            <SummaryCard label="Total rooms" value={summary?.total_rooms ?? rooms?.length ?? "—"} />
            <SummaryCard
              label="Clean"
              value={summary?.clean_count ?? "—"}
              tone="success"
            />
            <SummaryCard
              label="Needs attention"
              value={summary?.needs_attention_count ?? "—"}
              tone="warning"
            />
            <SummaryCard
              label="Dirty"
              value={summary?.dirty_count ?? "—"}
              tone="danger"
            />
          </>
        )}
      </div>

      {/* Search + filter */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms or blocks"
            aria-label="Search rooms or blocks"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary outline-none focus:border-primary placeholder:text-text-disabled"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (statusFilter === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-muted hover:bg-bg")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Room grid */}
      <div className="mt-5">
        {isLoading && <RoomListSkeleton />}

        {isError && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="font-medium text-text-primary">
              Couldn&apos;t load rooms
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Check that the backend is running and try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && sortedRooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-medium text-text-primary">
              {rooms && rooms.length > 0
                ? "No rooms match your search"
                : "No rooms yet"}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {rooms && rooms.length > 0
                ? "Try a different search term or filter."
                : "Add your first room and upload a baseline photo to start scanning."}
            </p>
            {(!rooms || rooms.length === 0) && (
              <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4" /> Add room
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>

      <AddRoomModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClass = tone
    ? { success: "text-success", warning: "text-warning", danger: "text-danger" }[
        tone
      ]
    : "text-text-primary";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function RoomListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[92px] skeleton rounded-xl" />
      ))}
    </div>
  );
}

function AddRoomModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [block, setBlock] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.createRoom({ name, block }),
    onSuccess: () => {
      toast.success(`"${name}" added successfully`);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      setName("");
      setBlock("");
      onClose();
    },
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't add the room. Try again."),
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      setName("");
      setBlock("");
      onClose();
    }
  };

  return (
    <Modal title="Add room" isOpen={isOpen} onClose={handleClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <Input
          label="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Room 204"
        />
        <Input
          label="Block / Ward"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
          required
          placeholder="e.g. Block A"
        />
        <p className="text-xs text-text-muted">
          You can upload a baseline photo from the room&apos;s detail page once
          it&apos;s added.
        </p>
        <Button type="submit" isLoading={mutation.isPending} className="w-full">
          Add room
        </Button>
      </form>
    </Modal>
  );
}
