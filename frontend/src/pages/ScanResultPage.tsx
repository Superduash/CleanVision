import { useLocation, Link } from "react-router-dom";
import { CheckCircle, AlertTriangle, XCircle, ScanLine, LayoutGrid } from "lucide-react";
import type { ScanResult } from "@/lib/api";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";

interface LocationState {
  result: ScanResult;
  roomName?: string;
}

const STATUS_ICON = {
  clean: CheckCircle,
  needs_attention: AlertTriangle,
  dirty: XCircle,
};

const STATUS_MESSAGE = {
  clean:
    "This room meets cleanliness standards. No action required at this time.",
  needs_attention:
    "This room should be monitored closely. Schedule a cleaning check soon.",
  dirty:
    "This room requires immediate attention. Alert the cleaning team now.",
};

export function ScanResultPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (!state?.result) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center page-enter">
        <AlertTriangle className="mx-auto h-10 w-10 text-warning" />
        <h1 className="mt-4 text-xl font-semibold text-text-primary">
          No scan result
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Start a scan to see results here.
        </p>
        <Link to="/dashboard/scan">
          <Button className="mt-6">
            <ScanLine className="h-4 w-4" /> New scan
          </Button>
        </Link>
      </div>
    );
  }

  const { result, roomName } = state;
  const Icon = STATUS_ICON[result.status];

  return (
    <div className="mx-auto max-w-lg px-6 py-8 page-enter">
      <h1 className="text-2xl font-semibold text-text-primary">Scan result</h1>
      {roomName && (
        <p className="mt-1 text-sm text-text-muted">
          {roomName} &mdash; just now
        </p>
      )}

      {/* Score card */}
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-surface p-8 shadow-raised">
        <ScoreRing
          score={result.score}
          status={result.status}
          size="lg"
          animate
        />

        <div className="mt-6 flex items-center gap-2">
          <Icon
            className={
              "h-5 w-5 " +
              (result.status === "clean"
                ? "text-success"
                : result.status === "needs_attention"
                ? "text-warning"
                : "text-danger")
            }
          />
          <StatusBadge status={result.status} />
        </div>

        <p className="mt-4 max-w-sm text-center text-sm text-text-muted">
          {STATUS_MESSAGE[result.status]}
        </p>

        {result.mock && (
          <p className="mt-3 rounded-full bg-bg px-3 py-1 text-[11px] text-text-disabled">
            Mock mode — no trained model loaded. Scores are hash-based.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Link to={`/dashboard/rooms/${result.room_id}`}>
          <Button variant="secondary" className="w-full">
            View room history
          </Button>
        </Link>
        <Link to="/dashboard/scan">
          <Button className="w-full">
            <ScanLine className="h-4 w-4" /> Scan another room
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="ghost" className="w-full">
            <LayoutGrid className="h-4 w-4" /> Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
