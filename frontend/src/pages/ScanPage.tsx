import { useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScanLine,
  Upload,
  X,
  ChevronDown,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRooms } from "@/hooks/useRooms";
import { Button } from "@/components/Button";

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return "Image must be JPG, PNG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES)
    return "Photo exceeds the 16 MB size limit. Please compress or resize it.";
  return null;
}

export function ScanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const defaultRoomId = searchParams.get("room")
    ? Number(searchParams.get("room"))
    : undefined;

  const [selectedRoomId, setSelectedRoomId] = useState<number | "">(
    defaultRoomId ?? "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file || !selectedRoomId) throw new Error("Room and image required");
      return api.scanRoom(Number(selectedRoomId), file);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["history", result.room_id] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      // Navigate to result page with the scan data
      navigate("/dashboard/scan/result", {
        state: { result, roomName: rooms?.find((r) => r.id === result.room_id)?.name },
      });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Scan failed. Please try again."),
  });

  const handleFile = useCallback((incoming: File) => {
    const err = validateFile(incoming);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(incoming);
    setPreview(URL.createObjectURL(incoming));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const canSubmit = selectedRoomId && file && !mutation.isPending;

  return (
    <div className="mx-auto max-w-xl px-6 py-8 page-enter">
      <h1 className="text-2xl font-semibold text-text-primary">New scan</h1>
      <p className="mt-1 text-sm text-text-muted">
        Select a room, upload a photo, and get an instant cleanliness score.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="mt-8 space-y-6"
      >
        {/* Room selector */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="scan-room-select"
            className="text-sm font-medium text-text-primary"
          >
            Room
          </label>
          <div className="relative">
            <select
              id="scan-room-select"
              value={selectedRoomId}
              onChange={(e) =>
                setSelectedRoomId(e.target.value ? Number(e.target.value) : "")
              }
              required
              disabled={roomsLoading || mutation.isPending}
              className="h-10 w-full appearance-none rounded-lg border border-border bg-surface pl-3 pr-9 text-sm text-text-primary outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">
                {roomsLoading ? "Loading rooms…" : "Select a room"}
              </option>
              {rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} — {room.block}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
          {rooms?.length === 0 && (
            <p className="text-xs text-text-muted">
              No rooms yet.{" "}
              <a href="/dashboard/rooms/new" className="text-primary hover:underline">
                Add a room first.
              </a>
            </p>
          )}
        </div>

        {/* Drop zone */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-text-primary">Photo</p>
          {preview ? (
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={preview}
                alt="Scan preview"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: 300 }}
              />
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove photo"
                disabled={mutation.isPending}
                className="absolute right-2 top-2 rounded-full bg-ink/70 p-1 text-white hover:bg-ink/90 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="mt-1 text-xs text-text-muted">{file?.name}</p>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              aria-label="Upload scan photo"
              className={
                "flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors " +
                (isDragging
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-primary/50 hover:bg-bg")
              }
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10">
                <Camera className="h-6 w-6 text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  Drop photo here or{" "}
                  <span className="text-primary">browse files</span>
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  JPG, PNG, or WebP · max 16 MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleInputChange}
            disabled={mutation.isPending}
          />
        </div>

        {/* Submit */}
        {mutation.isPending && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Analysing photo…
              </p>
              <p className="text-xs text-text-muted">
                The AI model is running. This usually takes a few seconds.
              </p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          isLoading={mutation.isPending}
          disabled={!canSubmit}
          className="w-full"
          size="lg"
        >
          <ScanLine className="h-5 w-5" />
          {mutation.isPending ? "Scanning…" : "Run scan"}
        </Button>

        {!selectedRoomId && !roomsLoading && (
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <AlertTriangle className="h-3.5 w-3.5" />
            Select a room to enable scanning.
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5">
          <Upload className="h-3.5 w-3.5 text-text-disabled" />
          <p className="text-xs text-text-disabled">
            Images are analysed server-side and stored in the room&apos;s scan
            history.
          </p>
        </div>
      </form>
    </div>
  );
}
