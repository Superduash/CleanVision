import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  History,
  Download,
  Filter,
  Trash2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { api, imageUrl, type ScanRecord } from "@/lib/api";
import { useRooms } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

// ── Export CSV Helper ────────────────────────────────────────────────────────
function exportToCSV(data: ScanRecord[], roomName: string) {
  const headers = ["Scan ID", "Room ID", "Score", "Status", "Timestamp"];
  const rows = data.map((s) => [
    s.id,
    s.room_id,
    s.cleanliness_score,
    s.status,
    `"${s.timestamp}"`,
  ]);
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `cleanvision_scans_${roomName.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function HistoryPage() {
  const [searchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string | number>(searchParams.get("room") || 0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingScanId, setDeletingScanId] = useState<string | number | null>(null);

  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const queryClient = useQueryClient();

  const { data: rooms = [] } = useRooms();

  // Fetch history for selected room or all room history
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["history", selectedRoomId],
    queryFn: () => api.getHistory(selectedRoomId),
    enabled: true,
    select: (d) => d.history,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.deleteScan(id),
    onSuccess: () => {
      toast.success("Scan record deleted.");
      queryClient.invalidateQueries({ queryKey: ["history"] });
      setDeletingScanId(null);
    },
    onError: () => toast.error("Failed to delete scan record."),
  });

  const filteredHistory = history.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <History className="h-6 w-6 text-primary" /> Scan History
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Complete audit trail of cleanliness scans across rooms.
          </p>
        </div>

        {filteredHistory.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToCSV(filteredHistory, selectedRoom?.name ?? "all")}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-card">
        {/* Room selector */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="h-4 w-4 text-text-disabled" />
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="h-9 w-full rounded-lg border border-border bg-bg px-3 text-sm font-medium text-text-primary outline-none focus:border-primary"
          >
            <option value={0}>Select a room...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.block})
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {["all", "clean", "needs_attention", "dirty"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                statusFilter === st
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {selectedRoomId === 0 ? (
          <div className="p-12 text-center text-sm text-text-muted">
            Select a room above to view its full scan history audit trail.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg text-left">
                  <th className="px-5 py-3 font-semibold text-text-muted">Image</th>
                  <th className="px-5 py-3 font-semibold text-text-muted">Score</th>
                  <th className="px-5 py-3 font-semibold text-text-muted">Status</th>
                  <th className="px-5 py-3 font-semibold text-text-muted">Timestamp</th>
                  {isAdmin && <th className="px-5 py-3 font-semibold text-text-muted text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: isAdmin ? 5 : 4 }).map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <div className="h-6 skeleton rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-text-muted">
                      No scan records match the current criteria.
                    </td>
                  </tr>
                )}

                {filteredHistory.map((scan) => {
                  const src = imageUrl(scan.image_path);
                  const score = Math.round(scan.cleanliness_score);
                  const scoreColor =
                    scan.status === "clean"
                      ? "text-success"
                      : scan.status === "needs_attention"
                      ? "text-warning"
                      : "text-danger";

                  return (
                    <tr key={scan.id} className="hover:bg-highlight transition-colors">
                      <td className="px-5 py-3">
                        {src ? (
                          <button
                            onClick={() => setPreviewImage(src)}
                            className="group relative h-10 w-14 overflow-hidden rounded-lg border border-border bg-bg"
                          >
                            <img src={src} alt="Scan preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          </button>
                        ) : (
                          <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-border bg-bg text-text-disabled">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-base">
                        <span className={scoreColor}>{score}/100</span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={scan.status} />
                      </td>
                      <td className="px-5 py-3 text-text-muted text-xs">
                        <div>{format(new Date(scan.timestamp), "dd MMM yyyy, HH:mm")}</div>
                        <div className="text-[11px] text-text-disabled">
                          {formatDistanceToNow(new Date(scan.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setDeletingScanId(scan.id)}
                            className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
                            title="Delete scan record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setPreviewImage(null)} />
          <div className="relative max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-raised animate-scale-in">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-ink/50 p-1.5 text-white hover:bg-ink/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={previewImage} alt="Full scan image" className="max-h-[80vh] w-full rounded-xl object-contain" />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingScanId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDeletingScanId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-raised animate-scale-in">
            <h3 className="text-lg font-bold text-text-primary">Delete Scan Record?</h3>
            <p className="mt-1.5 text-sm text-text-muted">
              This will permanently delete this scan record and its associated image.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeletingScanId(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-danger hover:bg-danger/90 shadow-none"
                onClick={() => deleteMutation.mutate(deletingScanId)}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
