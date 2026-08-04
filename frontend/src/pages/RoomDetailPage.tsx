import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  ScanLine,
  MapPin,
  Calendar,
  ImagePlus,
  AlertTriangle,
  Trash2,
  BellRing,
  CheckCircle2,
  ClipboardList,
  X,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRoom, useRoomHistory } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { api, imageUrl, type ScanRecord } from "@/lib/api";
import { Button } from "@/components/Button";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return "Baseline photo must be JPG, PNG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES)
    return "Photo exceeds the 16 MB size limit.";
  return null;
}

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  danger = true,
  isLoading = false,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised">
        <button onClick={onCancel} className="absolute right-4 top-4 text-text-disabled hover:text-text-muted">
          <X className="h-4 w-4" />
        </button>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", danger ? "bg-danger-bg" : "bg-primary/10")}>
          {danger ? <Trash2 className="h-5 w-5 text-danger" /> : <CheckCircle2 className="h-5 w-5 text-primary" />}
        </div>
        <h3 className="mt-3 text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-1.5 text-sm text-text-muted">{message}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className={cn("flex-1", danger && "bg-danger hover:bg-danger/90 shadow-none")}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Cleaning Request Modal ────────────────────────────────────────────────────
function CleaningRequestModal({
  roomId,
  roomName,
  userName,
  userEmail,
  onClose,
}: {
  roomId: number;
  roomName: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.createCleaningRequest({
        room_id: roomId,
        requested_by_name: userName,
        requested_by_email: userEmail,
        reason,
      }),
    onSuccess: () => {
      toast.success("Cleaning request submitted! Staff will be notified.");
      queryClient.invalidateQueries({ queryKey: ["room-requests", roomId] });
      onClose();
    },
    onError: () => toast.error("Failed to submit request. Try again."),
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
          Submit a cleaning request for <strong>{roomName}</strong>. Staff will be notified.
        </p>
        <div className="mt-4">
          <label className="text-sm font-medium text-text-primary">
            Reason <span className="text-text-disabled">(optional)</span>
          </label>
          <textarea
            className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:shadow-focus resize-none"
            rows={3}
            placeholder="e.g. Spill on floor, visible dust..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge for cleaning requests ───────────────────────────────────────
const REQUEST_STATUS: Record<string, { label: string; className: string }> = {
  pending:     { label: "Pending",     className: "bg-warning-bg text-warning" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary" },
  completed:   { label: "Completed",   className: "bg-success-bg text-success" },
  dismissed:   { label: "Dismissed",   className: "bg-border text-text-muted" },
};

// ── Main Component ────────────────────────────────────────────────────────────
export function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";

  const { data: room, isLoading: roomLoading, isError: roomError } = useRoom(id);
  const { data: history, isLoading: historyLoading } = useRoomHistory(id);

  const { data: requestsData } = useQuery({
    queryKey: ["room-requests", id],
    queryFn: () => api.getRoomCleaningRequests(id),
    enabled: !!id,
    select: (d) => d.requests,
  });

  const [baselinePreview, setBaselinePreview] = useState<string | null>(null);
  const [showDeleteRoom, setShowDeleteRoom] = useState(false);
  const [deletingScanId, setDeletingScanId] = useState<number | null>(null);
  const [showCleaningModal, setShowCleaningModal] = useState(false);

  // Baseline upload
  const baselineMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => api.uploadBaseline(id, file),
    onSuccess: () => {
      toast.success("Baseline photo updated.");
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setBaselinePreview(null);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't upload the baseline photo."),
  });

  // Delete room
  const deleteRoomMutation = useMutation({
    mutationFn: () => api.deleteRoom(id),
    onSuccess: () => {
      toast.success("Room deleted.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/dashboard", { replace: true });
    },
    onError: () => toast.error("Failed to delete room. Try again."),
  });

  // Delete scan
  const deleteScanMutation = useMutation({
    mutationFn: (scanId: number) => api.deleteScan(scanId),
    onSuccess: () => {
      toast.success("Scan deleted.");
      queryClient.invalidateQueries({ queryKey: ["history", id] });
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeletingScanId(null);
    },
    onError: () => {
      toast.error("Failed to delete scan.");
      setDeletingScanId(null);
    },
  });

  // Update cleaning request status (admin)
  const updateRequestMutation = useMutation({
    mutationFn: ({ reqId, status }: { reqId: number; status: string }) =>
      api.updateCleaningRequest(reqId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-requests", id] });
      toast.success("Request updated.");
    },
    onError: () => toast.error("Failed to update request."),
  });

  const handleBaselineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); e.target.value = ""; return; }
    setBaselinePreview(URL.createObjectURL(file));
    baselineMutation.mutate({ file });
  };

  if (roomLoading) return <RoomDetailSkeleton />;

  if (roomError || !room) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center page-enter">
        <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
        <h1 className="mt-4 text-xl font-semibold text-text-primary">Room not found</h1>
        <p className="mt-2 text-sm text-text-muted">
          This room may have been deleted or the ID is invalid.
        </p>
        <Button className="mt-6" variant="secondary" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>
      </div>
    );
  }

  const latestScan = history?.[0];
  const baselineSrc = baselinePreview || imageUrl(room.baseline_image_path);
  const isNotClean = latestScan?.status === "dirty" || latestScan?.status === "needs_attention";
  const pendingRequests = requestsData?.filter(r => r.status === "pending") ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="rounded-lg p-2 text-text-muted hover:bg-bg hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-text-primary">{room.name}</h1>
          <p className="flex items-center gap-1 text-sm text-text-muted">
            <MapPin className="h-3.5 w-3.5" /> {room.block}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Patient: Request Cleaning */}
          {!isAdmin && isNotClean && (
            <Button
              size="sm"
              onClick={() => setShowCleaningModal(true)}
              className="gap-1.5 bg-warning hover:bg-warning/90 shadow-none"
            >
              <BellRing className="h-3.5 w-3.5" /> Request Cleaning
            </Button>
          )}
          {/* Admin actions */}
          {isAdmin && (
            <>
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
                onClick={() => setShowDeleteRoom(true)}
                className="border-danger/30 text-danger hover:bg-danger-bg hover:border-danger/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Current status */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Current Status
            </h2>
            {latestScan ? (
              <div className="mt-4 flex items-center gap-6">
                <ScoreRing score={latestScan.cleanliness_score} status={latestScan.status} size="md" animate />
                <div>
                  <StatusBadge status={latestScan.status} />
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(latestScan.timestamp), "dd MMM yyyy, HH:mm")}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(latestScan.timestamp), { addSuffix: true })}
                  </p>
                  {/* Patient: quick request cleaning from status card */}
                  {!isAdmin && isNotClean && (
                    <Button
                      size="sm"
                      className="mt-3 gap-1.5 bg-warning hover:bg-warning/90 shadow-none"
                      onClick={() => setShowCleaningModal(true)}
                    >
                      <BellRing className="h-3.5 w-3.5" /> Request Cleaning
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-4">
                <ScoreRing score={0} size="md" />
                <div>
                  <p className="font-medium text-text-primary">Not scanned yet</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {isAdmin
                      ? "Run a scan to get this room's first cleanliness score."
                      : "This room hasn't been scanned yet."}
                  </p>
                  {isAdmin && (
                    <Link to={`/dashboard/scan?room=${id}`}>
                      <Button size="sm" className="mt-3">
                        <ScanLine className="h-3.5 w-3.5" /> Scan now
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scan history */}
          <div className="rounded-xl border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold text-text-primary">Scan history</h2>
              <Link to={`/dashboard/history?room=${id}`} className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            {historyLoading && (
              <div className="space-y-px p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 skeleton rounded-lg" />
                ))}
              </div>
            )}
            {!historyLoading && (!history || history.length === 0) && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-text-muted">No scans recorded yet.</p>
              </div>
            )}
            {history && history.length > 0 && (
              <div className="divide-y divide-border">
                {history.slice(0, 10).map((scan) => (
                  <ScanHistoryRow
                    key={scan.id}
                    scan={scan}
                    isAdmin={isAdmin}
                    onDelete={() => setDeletingScanId(scan.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cleaning Requests (visible to both roles) */}
          {(requestsData && requestsData.length > 0) && (
            <div className="rounded-xl border border-border bg-surface shadow-card">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <ClipboardList className="h-4 w-4 text-text-muted" />
                <h2 className="font-semibold text-text-primary">Cleaning Requests</h2>
                {pendingRequests.length > 0 && (
                  <span className="ml-auto rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-white">
                    {pendingRequests.length} pending
                  </span>
                )}
              </div>
              <div className="divide-y divide-border">
                {requestsData.slice(0, 5).map((req) => {
                  const st = REQUEST_STATUS[req.status] ?? REQUEST_STATUS.pending;
                  return (
                    <div key={req.id} className="flex items-start justify-between gap-4 px-6 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {req.requested_by_name}
                          {req.reason && <span className="ml-1 text-text-muted font-normal">— {req.reason}</span>}
                        </p>
                        <p className="text-xs text-text-disabled">
                          {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", st.className)}>
                          {st.label}
                        </span>
                        {isAdmin && req.status === "pending" && (
                          <button
                            onClick={() => updateRequestMutation.mutate({ reqId: req.id, status: "in_progress" })}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Accept
                          </button>
                        )}
                        {isAdmin && req.status === "in_progress" && (
                          <button
                            onClick={() => updateRequestMutation.mutate({ reqId: req.id, status: "completed" })}
                            className="text-xs font-medium text-success hover:underline"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Baseline photo — admin only */}
          {isAdmin && (
            <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
              <h2 className="font-semibold text-text-primary">Baseline photo</h2>
              <p className="mt-1 text-xs text-text-muted">
                The reference image for &ldquo;clean&rdquo; state.
              </p>
              <div className="mt-4">
                {baselineSrc ? (
                  <img
                    src={baselineSrc}
                    alt={`Baseline for ${room.name}`}
                    className="w-full rounded-lg object-cover"
                    style={{ maxHeight: 220 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg">
                    <p className="text-center text-sm text-text-muted">No baseline photo yet</p>
                  </div>
                )}
              </div>
              <label
                htmlFor={`baseline-upload-${id}`}
                className={cn(
                  "mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface",
                  baselineMutation.isPending && "pointer-events-none opacity-50"
                )}
              >
                <ImagePlus className="h-4 w-4" />
                {baselineSrc ? "Replace photo" : "Upload baseline photo"}
                {baselineMutation.isPending && <span className="ml-1 text-xs text-text-muted">Uploading…</span>}
              </label>
              <input
                id={`baseline-upload-${id}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleBaselineChange}
                disabled={baselineMutation.isPending}
              />
              <p className="mt-2 text-center text-[11px] text-text-disabled">JPG, PNG or WebP · max 16 MB</p>
            </div>
          )}

          {/* Room details */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <h2 className="font-semibold text-text-primary">Room Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Room ID</dt>
                <dd className="font-mono text-text-primary">#{id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Block</dt>
                <dd className="text-text-primary">{room.block}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Added</dt>
                <dd className="text-text-primary">
                  {format(new Date(room.created_at), "dd MMM yyyy")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Total scans</dt>
                <dd className="font-mono text-text-primary">{history?.length ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Patient: submit cleaning request card */}
          {!isAdmin && (
            <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
              <h2 className="font-semibold text-text-primary">Need cleaning?</h2>
              <p className="mt-1 text-sm text-text-muted">
                Notify hospital staff to schedule a room cleaning.
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() => setShowCleaningModal(true)}
              >
                <BellRing className="h-4 w-4" /> Request Cleaning
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDeleteRoom && (
        <ConfirmModal
          title={`Delete "${room.name}"?`}
          message={`This will permanently delete the room and all ${history?.length ?? 0} scan records. This cannot be undone.`}
          confirmLabel="Delete Room"
          onConfirm={() => deleteRoomMutation.mutate()}
          onCancel={() => setShowDeleteRoom(false)}
          isLoading={deleteRoomMutation.isPending}
        />
      )}

      {deletingScanId !== null && (
        <ConfirmModal
          title="Delete this scan?"
          message="This scan record and its image will be permanently removed."
          confirmLabel="Delete Scan"
          onConfirm={() => deleteScanMutation.mutate(deletingScanId)}
          onCancel={() => setDeletingScanId(null)}
          isLoading={deleteScanMutation.isPending}
        />
      )}

      {showCleaningModal && session && (
        <CleaningRequestModal
          roomId={id}
          roomName={room.name}
          userName={session.name}
          userEmail={session.email}
          onClose={() => setShowCleaningModal(false)}
        />
      )}
    </div>
  );
}

// ── Scan History Row ──────────────────────────────────────────────────────────
function ScanHistoryRow({
  scan,
  isAdmin,
  onDelete,
}: {
  scan: ScanRecord;
  isAdmin: boolean;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const score = Math.round(scan.cleanliness_score);
  const scoreColor =
    scan.status === "clean" ? "text-success" :
    scan.status === "needs_attention" ? "text-warning" : "text-danger";

  return (
    <div
      className="group flex items-center gap-4 px-6 py-3 transition-colors hover:bg-highlight"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`font-mono text-lg font-bold ${scoreColor} w-10 shrink-0`}>
        {score}
      </span>
      <div className="min-w-0 flex-1">
        <StatusBadge status={scan.status} />
      </div>
      <span className="shrink-0 text-xs text-text-muted">
        {formatDistanceToNow(new Date(scan.timestamp), { addSuffix: true })}
      </span>
      {isAdmin && (
        <button
          onClick={onDelete}
          aria-label="Delete scan"
          className={cn(
            "shrink-0 rounded-lg p-1.5 text-text-disabled transition-all",
            hovered ? "opacity-100 hover:bg-danger-bg hover:text-danger" : "opacity-0"
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function RoomDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6 page-enter">
      <div className="h-10 w-64 skeleton rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="h-48 skeleton rounded-xl" />
          <div className="h-72 skeleton rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-64 skeleton rounded-xl" />
          <div className="h-36 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
