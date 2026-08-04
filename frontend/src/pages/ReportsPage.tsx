import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  Download,
  Printer,
  TrendingUp,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { api, type ReportsSummary } from "@/lib/api";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

function exportReportsCSV(data: ReportsSummary, days: number) {
  const headers = ["Date", "Scans Count", "Avg Score"];
  const rows = data.daily_trend.map((d) => [
    `"${d.date}"`,
    d.scan_count,
    d.avg_score != null ? Math.round(d.avg_score) : "N/A",
  ]);
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `cleanvision_report_${days}d.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ReportsPage() {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", days],
    queryFn: () => api.getReports(days),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" /> Reports & Insights
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Aggregated cleanliness statistics and compliance breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportReportsCSV(data, days)}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Report
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 w-fit shadow-card">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              days === d
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            Last {d} Days
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans ({days}d)</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary">
            {isLoading ? <span className="inline-block w-12 h-7 skeleton rounded" /> : data?.today_count ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Score ({days}d)</span>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary">
            {isLoading ? (
              <span className="inline-block w-12 h-7 skeleton rounded" />
            ) : data?.avg_score_today != null ? (
              Math.round(data.avg_score_today)
            ) : (
              "—"
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Clean Rate</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="mt-2 text-3xl font-bold text-success">
            {isLoading ? (
              <span className="inline-block w-12 h-7 skeleton rounded" />
            ) : data?.status_counts ? (
              `${Math.round(
                ((data.status_counts.clean ?? 0) /
                  Math.max(
                    1,
                    (data.status_counts.clean ?? 0) +
                      (data.status_counts.needs_attention ?? 0) +
                      (data.status_counts.dirty ?? 0)
                  )) *
                  100
              )}%`
            ) : (
              "0%"
            )}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-text-primary">Daily Cleanliness Score Trend</h2>
        <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-border">
          {isLoading &&
            Array.from({ length: days }).map((_, i) => (
              <div key={i} className="flex-1 h-full skeleton rounded-t-lg" />
            ))}

          {!isLoading &&
            data?.daily_trend?.map((item) => {
              const score = item.avg_score ?? 0;
              const heightPct = Math.max(10, score);
              const barColor =
                score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-danger";

              return (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono font-bold text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {score ? Math.round(score) : "—"}
                  </span>
                  <div
                    className={cn("w-full rounded-t-md transition-all group-hover:brightness-110", barColor)}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-text-disabled truncate w-full text-center">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Block Breakdown */}
      {data?.block_breakdown && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-text-primary">Breakdown by Hospital Block</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.block_breakdown).map(([block, stats]) => (
              <div key={block} className="rounded-lg border border-border bg-bg p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-text-primary">{block}</h4>
                  <p className="text-xs text-text-muted">{stats.room_count} rooms</p>
                </div>
                <span className="font-mono text-lg font-bold text-primary">
                  {stats.avg_score != null ? Math.round(stats.avg_score) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
