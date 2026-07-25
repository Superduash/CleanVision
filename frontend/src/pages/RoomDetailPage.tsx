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
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRoom, useRoomHistory } from "@/hooks/useRooms";
import { api, imageUrl, type RoomStatus } from "@/lib/api";
import { Button } from "@/components/Button";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";

const MAX_IMAGE_BYTES = 16 * 1024 * 1024; // 16 MB server limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return "Baseline photo must be JPG, PNG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES)
    return "Photo exceeds the 16 MB size limit. Please compress or resize it.";
  return null;
}

export function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: room, isLoading: roomLoading, isError: roomError } = useRoom(id);
  const {
    data: history,
    isLoading: historyLoading,
  } = useRoomHistory(id);

  const [baselinePreview, setBaselinePreview] = useState<string | null>(null);

  const baselineMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => api.uploadBaseline(id, file),
    onSuccess: () => {
      toast.success("Baseline photo updated.");
      queryClient.invalidateQueries({ queryKey: ["room", id] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setBaselinePreview(null);
    },
    onError: (err: Error) =>
      toast.error(err.message || "Couldn't upload the baseline photo. Try again."),
  });

  const handleBaselineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      e.target.value = "";
      return;
    }
    setBaselinePreview(URL.createObjectURL(file));
    baselineMutation.mutate({ file });
  };

  if (roomLoading) return <RoomDetailSkeleton />;

  if (roomError || !room) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center page-enter">
        <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
        <h1 className="mt-4 text-xl font-semibold text-text-primary">
          Room not found
        </h1>
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
  const baselineSrc =
    baselinePreview || imageUrl(room.baseline_image_path);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="rounded-lg p-2 text-text-muted hover:bg-bg hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-text-primary">
            {room.name}
          </h1>
          <p className="flex items-center gap-1 text-sm text-text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {room.block}
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Main content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: status + history */}
        <div className="space-y-6">
          {/* Current status card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              Current status
            </h2>
            {latestScan ? (
              <div className="mt-4 flex items-center gap-6">
                <ScoreRing
                  score={latestScan.cleanliness_score}
                  status={latestScan.status}
                  size="md"
                  animate
                />
                <div>
                  <StatusBadge status={latestScan.status} />
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(latestScan.timestamp), "dd MMM yyyy, HH:mm")}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(latestScan.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-4">
                <ScoreRing score={0} size="md" />
                <div>
                  <p className="font-medium text-text-primary">
                    Not scanned yet
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Run a scan to get this room&apos;s first cleanliness score.
                  </p>
                  <Link to={`/dashboard/scan?room=${id}`}>
                    <Button size="sm" className="mt-3">
                      <ScanLine className="h-3.5 w-3.5" /> Scan now
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Scan history */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold text-text-primary">Scan history</h2>
              <Link
                to={`/dashboard/history?room=${id}`}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            {historyLoading && (
              <div className="space-y-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 skeleton mx-4 my-2 rounded-lg" />
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
                  <ScanHistoryRow key={scan.id} scan={scan} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: baseline photo */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
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
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg">
                  <p className="text-center text-sm text-text-muted">
                    No baseline photo yet
                  </p>
                </div>
              )}
            </div>

            <label
              htmlFor={`baseline-upload-${id}`}
              className={
                "mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface " +
                (baselineMutation.isPending
                  ? "pointer-events-none opacity-50"
                  : "")
              }
            >
              <ImagePlus className="h-4 w-4" />
              {baselineSrc ? "Replace photo" : "Upload baseline photo"}
              {baselineMutation.isPending && (
                <span className="ml-1 text-xs text-text-muted">
                  Uploading…
                </span>
              )}
            </label>
            <input
              id={`baseline-upload-${id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleBaselineChange}
              disabled={baselineMutation.isPending}
            />
            <p className="mt-2 text-center text-[11px] text-text-disabled">
              JPG, PNG or WebP · max 16 MB
            </p>
          </div>

          {/* Room metadata */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold text-text-primary">Details</h2>
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
                <dd className="font-mono text-text-primary">
                  {history?.length ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanHistoryRow({ scan }: { scan: { cleanliness_score: number; status: RoomStatus; timestamp: string } }) {
  const score = Math.round(scan.cleanliness_score);
  const scoreColor =
    scan.status === "clean"
      ? "text-success"
      : scan.status === "needs_attention"
      ? "text-warning"
      : "text-danger";

  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <span className={`font-mono text-lg font-semibold ${scoreColor} w-10 shrink-0`}>
        {score}
      </span>
      <div className="min-w-0 flex-1">
        <StatusBadge status={scan.status} />
      </div>
      <span className="shrink-0 text-xs text-text-muted">
        {formatDistanceToNow(new Date(scan.timestamp), { addSuffix: true })}
      </span>
    </div>
  );
}

function RoomDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
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
