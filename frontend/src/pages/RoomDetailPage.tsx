import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Edit2,
  ScanLine,
  Trash2,
  MapPin,
  History as HistoryIcon,
  Building,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { useRoom, useRoomHistory } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { useHospitalConfig } from "@/hooks/useHospitalConfig";
import { api, imageUrl, STATUS_LABEL, ScanRecord } from "@/lib/api";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { RoomQRCode } from "@/components/RoomQRCode";

function RoomDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <div className="h-8 w-48 skeleton rounded" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-64 skeleton rounded-2xl md:col-span-1" />
        <div className="h-64 skeleton rounded-2xl md:col-span-2" />
      </div>
    </div>
  );
}

export function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId) || roomId || "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { config } = useHospitalConfig();
  const isAdmin = session?.role === "admin" || session?.role === "manager";

  const [showQR, setShowQR] = useState(false);

  const { data: room, isLoading: roomLoading, isError: roomError } = useRoom(id);
  const { data: history, isLoading: historyLoading } = useRoomHistory(id);

  const [baselinePreview, setBaselinePreview] = useState<string | null>(null);

  // Baseline upload
  const baselineMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => api.uploadBaseline(id, file),
    onSuccess: () => {
      toast.success("Baseline photo updated.");
      queryClient.invalidateQueries({ queryKey: ["room", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setBaselinePreview(null);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't upload baseline photo."),
  });

  // Delete room
  const deleteRoomMutation = useMutation({
    mutationFn: () => api.deleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/dashboard", { replace: true });
    },
    onError: () => toast.error("Failed to delete room."),
  });

  // Delete scan
  const deleteScanMutation = useMutation({
    mutationFn: (scanId: string | number) => api.deleteScan(scanId),
    onSuccess: () => {
      toast.success("Scan deleted.");
      queryClient.invalidateQueries({ queryKey: ["history", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["room", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      toast.error("Failed to delete scan.");
    },
  });

  const handleBaselineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      e.target.value = "";
      return;
    }
    setBaselinePreview(URL.createObjectURL(file));
    baselineMutation.mutate({ file });
  };

  if (roomLoading) return <RoomDetailSkeleton />;

  if (roomError || !room) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h2 className="text-xl font-bold text-text-primary">Room Not Found</h2>
        <p className="mt-2 text-sm text-text-muted">
          The requested room does not exist or was deleted.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block">
          <Button variant="secondary">← Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 page-enter space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-border bg-surface p-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-text-primary">{room.name}</h1>
          <p className="flex items-center gap-1 text-sm text-text-muted">
            <MapPin className="h-3.5 w-3.5 text-text-disabled" /> {room.block}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowQR(true)}>
                <QrCode className="h-3.5 w-3.5" /> QR Code
              </Button>
              <Link to={`/dashboard/rooms/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
              <Link to={`/dashboard/scan?room=${id}`}>
                <Button size="sm">
                  <ScanLine className="h-3.5 w-3.5" /> Scan now
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete ${room.name}?`)) {
                    deleteRoomMutation.mutate();
                  }
                }}
                className="border-danger/30 text-danger hover:bg-danger-bg hover:border-danger/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cleanliness Status Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card flex flex-col items-center justify-center text-center space-y-4 md:col-span-1">
          <ScoreRing
            score={room.latest_score ?? 0}
            status={room.latest_status ?? undefined}
            size="lg"
          />
          <div>
            <h3 className="font-bold text-lg text-text-primary">
              {room.latest_status ? STATUS_LABEL[room.latest_status] : "Not Scanned Yet"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {room.last_scanned ? `Scanned ${formatDistanceToNow(new Date(room.last_scanned), { addSuffix: true })}` : "No scan history recorded."}
            </p>
          </div>

          <Link to={`/dashboard/scan?room=${id}`} className="w-full">
            <Button className="w-full gap-2">
              <ScanLine className="h-4 w-4" /> Scan Room Cleanliness
            </Button>
          </Link>
        </div>

        {/* Baseline Image Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> Reference Baseline Standard
              </h3>
              {isAdmin && (
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text-primary hover:bg-highlight">
                  Change Baseline
                  <input type="file" accept="image/*" className="hidden" onChange={handleBaselineChange} />
                </label>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              AI compares room scans against this clean state baseline.
            </p>
          </div>

          <div className="mt-4 relative h-48 w-full overflow-hidden rounded-xl border border-border bg-black/5 flex items-center justify-center">
            {baselinePreview || room.baseline_image_path ? (
              <img
                src={baselinePreview || imageUrl(room.baseline_image_path)}
                alt="Room baseline"
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="text-xs text-text-muted">No baseline photo uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Scan History Table */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-4">
        <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
          <HistoryIcon className="h-5 w-5 text-primary" /> Scan Audit History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left">
                <th className="px-4 py-2.5 font-semibold text-text-muted">Date & Time</th>
                <th className="px-4 py-2.5 font-semibold text-text-muted">Score</th>
                <th className="px-4 py-2.5 font-semibold text-text-muted">Status</th>
                <th className="px-4 py-2.5 font-semibold text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historyLoading && (
                <tr><td colSpan={4} className="py-8 text-center text-xs text-text-muted">Loading audit records…</td></tr>
              )}
              {!historyLoading && (!history || history.length === 0) && (
                <tr><td colSpan={4} className="py-8 text-center text-xs text-text-muted">No scans recorded for this room yet.</td></tr>
              )}
              {history?.map((s: ScanRecord) => (
                <tr key={s.id} className="hover:bg-highlight transition-colors">
                  <td className="px-4 py-3 text-text-primary text-xs font-medium">
                    {format(new Date(s.timestamp), "MMM d, yyyy · h:mm a")}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{s.cleanliness_score}/100</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <button
                        onClick={() => deleteScanMutation.mutate(s.id)}
                        className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && room.roomCode && (
        <RoomQRCode
          roomCode={room.roomCode}
          roomName={room.name}
          block={room.block}
          floor={room.floor}
          hospitalName={config.hospitalName}
          hospitalCode={config.hospitalCode}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
