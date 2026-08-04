import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Share2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { imageUrl, type ScanResult } from "@/lib/api";

export function ScanResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const result = (location.state as { result?: ScanResult; roomName?: string } | null)?.result;
  const roomName = (location.state as { result?: ScanResult; roomName?: string } | null)?.roomName ?? `Room ${result?.room_id ?? ""}`;

  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center page-enter">
        <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
        <h1 className="mt-4 text-xl font-bold text-text-primary">No scan result available</h1>
        <p className="mt-2 text-sm text-text-muted">
          Please run a scan from a room page or the Scan tool first.
        </p>
        <Link to="/dashboard/scan" className="mt-6 inline-block">
          <Button>Go to Scan Tool</Button>
        </Link>
      </div>
    );
  }

  const { score, status, image_path } = result;
  const src = imageUrl(image_path);

  const handleShare = () => {
    const text = `CleanVision Scan Result for ${roomName}: Score ${score}/100 (${status.toUpperCase()}).`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Scan summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 page-enter space-y-6">
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
          <h1 className="truncate text-2xl font-bold text-text-primary">Scan Result</h1>
          <p className="text-sm text-text-muted">{roomName}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-4 w-4" /> {copied ? "Copied!" : "Share"}
        </Button>
      </div>

      {/* Main Score Banner */}
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised text-center space-y-4">
        <div className="mx-auto w-fit">
          <ScoreRing score={score} status={status} size="lg" animate />
        </div>
        <div className="flex justify-center">
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-text-muted max-w-sm mx-auto">
          {status === "clean"
            ? "Room meets all hospital hygiene standards. Great job!"
            : status === "needs_attention"
            ? "Minor dust or surface issues detected. A quick check is recommended."
            : "Significant cleanliness issues detected. Immediate cleaning required."}
        </p>
      </div>

      {/* Captured Image */}
      {src && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Scanned Photo</h3>
          <img src={src} alt="Scan result" className="w-full max-h-80 rounded-lg object-cover" />
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/dashboard/rooms/${result.room_id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            View Room Details
          </Button>
        </Link>
        <Link to="/dashboard/scan" className="flex-1">
          <Button className="w-full gap-2">
            <ScanLine className="h-4 w-4" /> Scan Another Room
          </Button>
        </Link>
      </div>
    </div>
  );
}
