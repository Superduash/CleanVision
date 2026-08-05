import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  MessageSquare,
  Filter,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { api, IssueReport } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  IssueReport["status"],
  { label: string; icon: React.ElementType; className: string; nextActions: { status: string; label: string; className: string }[] }
> = {
  open: {
    label: "Open Alert",
    icon: Flame,
    className: "bg-danger-bg text-danger border-danger/30 animate-pulse",
    nextActions: [
      { status: "in_progress", label: "Acknowledge", className: "text-primary hover:bg-primary/10" },
      { status: "resolved",    label: "Mark Resolved", className: "text-success hover:bg-success-bg" },
    ],
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    className: "bg-warning-bg text-warning border-warning/30",
    nextActions: [
      { status: "resolved", label: "Mark Resolved", className: "text-success hover:bg-success-bg" },
    ],
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className: "bg-success-bg text-success border-success/20",
    nextActions: [],
  },
};

const FILTER_TABS = [
  { value: "all",         label: "All Alerts" },
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
];

export function CleaningRequestsPage() {
  const { session } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveReports, setLiveReports] = useState<IssueReport[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);

  const queryClient = useQueryClient();
  const inspectorBlock = session?.role === "inspector" && session.assignedBlocks.length > 0 ? session.assignedBlocks[0] : undefined;

  // Real-time Firestore onSnapshot listener for Visitor Alerts
  useEffect(() => {
    if (!db) {
      setLoadingLive(false);
      return;
    }

    try {
      let q = query(collection(db, "issueReports"), orderBy("createdAt", "desc"));
      if (inspectorBlock) {
        q = query(collection(db, "issueReports"), where("block", "==", inspectorBlock), orderBy("createdAt", "desc"));
      }

      const unsub = onSnapshot(q, (snapshot) => {
        const docs: IssueReport[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as IssueReport));
        setLiveReports(docs);
        setLoadingLive(false);
      }, () => {
        setLoadingLive(false);
      });

      return unsub;
    } catch {
      setLoadingLive(false);
    }
  }, [inspectorBlock]);

  // Fallback Query via API
  const { data: apiData } = useQuery({
    queryKey: ["issue-reports", statusFilter, inspectorBlock],
    queryFn: () => api.getIssueReports(statusFilter === "all" ? undefined : statusFilter, inspectorBlock),
    refetchInterval: 15_000,
  });

  const reports = liveReports.length > 0 ? liveReports.filter(r => statusFilter === "all" || r.status === statusFilter) : (apiData?.reports ?? []);
  const openCount = reports.filter(r => r.status === "open").length;

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateIssueReportStatus(id, status),
    onSuccess: () => {
      toast.success("Visitor alert updated.");
      queryClient.invalidateQueries({ queryKey: ["issue-reports"] });
    },
    onError: () => toast.error("Failed to update report."),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Live Visitor Alerts & Issue Feed
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {session?.role === "inspector"
              ? `Real-time issue reports for your assigned block (${session.assignedBlocks.join(", ") || "All"}).`
              : "Real-time issue reports from patients and facility visitors across all blocks."}
          </p>
        </div>

        {openCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-bg px-3.5 py-2">
            <Flame className="h-4 w-4 text-danger animate-bounce" />
            <span className="text-xs font-bold text-danger">
              {openCount} Open Alerts Requiring Attention
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-card overflow-x-auto">
        <Filter className="ml-2 h-3.5 w-3.5 text-text-disabled shrink-0" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
              statusFilter === tab.value
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live Alerts List */}
      <div className="space-y-3">
        {loadingLive && reports.length === 0 && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))
        )}

        {!loadingLive && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border bg-surface p-8 shadow-card">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="mt-3 text-base font-semibold text-text-primary">All Clear!</p>
            <p className="mt-1 text-sm text-text-muted">
              {statusFilter === "all"
                ? "No visitor alerts or cleanliness issues reported."
                : `No ${statusFilter} alerts.`}
            </p>
          </div>
        )}

        {reports.map((rep) => {
          const st = STATUS_MAP[rep.status] || STATUS_MAP["open"];
          const Icon = st.icon;

          return (
            <div
              key={rep.id}
              className={cn(
                "rounded-xl border p-4 sm:p-5 shadow-card transition-all hover:shadow-raised bg-surface",
                rep.status === "open" ? "border-danger/40 bg-gradient-to-r from-danger-bg/20 via-surface to-surface" : "border-border"
              )}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold",
                  rep.status === "open" ? "bg-danger-bg text-danger" : "bg-highlight text-primary"
                )}>
                  <Building2 className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-text-primary text-sm sm:text-base">
                      {rep.issueType}
                    </span>
                    <span className="text-text-disabled">·</span>
                    <span className="text-xs sm:text-sm font-semibold text-primary">{rep.block}</span>
                    <span className="text-xs font-mono text-text-muted">({rep.roomCode})</span>

                    <span className={cn(
                      "ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      st.className
                    )}>
                      <Icon className="h-3 w-3" />
                      {st.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5 text-text-disabled" />
                    <span>Reported {formatDistanceToNow(new Date(rep.createdAt), { addSuffix: true })}</span>
                  </div>

                  {rep.comment && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-highlight px-3 py-2 text-xs sm:text-sm text-text-muted">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {rep.comment}
                    </p>
                  )}

                  {rep.photoUrl && (
                    <div className="mt-2">
                      <img src={rep.photoUrl} alt="Issue photo" className="h-24 w-32 object-cover rounded-lg border border-border" />
                    </div>
                  )}
                </div>
              </div>

              {st.nextActions.length > 0 && (
                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  {st.nextActions.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => updateMutation.mutate({ id: rep.id, status: action.status })}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 border border-border",
                        action.className
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
