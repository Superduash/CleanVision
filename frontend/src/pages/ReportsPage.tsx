import { useState } from "react";
import { format } from "date-fns";
import { BarChart2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useReports } from "@/hooks/useRooms";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

export function ReportsPage() {
  const [days, setDays] = useState(7);
  const { data, isLoading, isError, refetch } = useReports(days);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Reports & analytics
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Cleanliness trends and block breakdowns.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              aria-pressed={days === o.value}
              className={
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                (days === o.value
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text-primary")
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))
        ) : isError ? (
          <div className="col-span-4 rounded-xl border border-border bg-surface px-6 py-8 text-center">
            <p className="font-medium text-text-primary">
              Couldn&apos;t load reports
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <KpiCard
              label="Scans today"
              value={data!.today_count}
              suffix="scans"
            />
            <KpiCard
              label="Avg score today"
              value={data!.avg_score_today.toFixed(1)}
              suffix="/ 100"
            />
            <KpiCard
              label="Clean rooms"
              value={data!.status_counts.clean}
              tone="success"
            />
            <KpiCard
              label="Need attention"
              value={
                data!.status_counts.needs_attention + data!.status_counts.dirty
              }
              tone={
                data!.status_counts.dirty > 0
                  ? "danger"
                  : data!.status_counts.needs_attention > 0
                  ? "warning"
                  : "success"
              }
            />
          </>
        )}
      </div>

      {/* Daily trend chart */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 font-semibold text-text-primary">
          <TrendingUp className="h-4 w-4 text-primary" />
          Average cleanliness score — last {days} days
        </h2>

        {isLoading ? (
          <div className="mt-4 h-48 skeleton rounded-lg" />
        ) : isError || !data ? null : (
          <TrendChart data={data.daily_trend} />
        )}
      </div>

      {/* Status donut */}
      {!isLoading && !isError && data && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-semibold text-text-primary">
              Room status breakdown
            </h2>
            <StatusDonut counts={data.status_counts} />
          </div>

          {/* Block breakdown table */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 font-semibold text-text-primary">
              <BarChart2 className="h-4 w-4 text-primary" />
              By block
            </h2>
            {data.block_breakdown.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">No data yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Block
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Rooms
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Avg score
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Need attention
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.block_breakdown.map((b) => (
                      <tr key={b.block} className="hover:bg-bg transition-colors">
                        <td className="px-4 py-2.5 font-medium text-text-primary">
                          {b.block}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-text-primary">
                          {b.room_count}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-text-primary">
                          {b.avg_score != null ? b.avg_score.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          <span
                            className={
                              b.attention_count > 0
                                ? "text-danger"
                                : "text-success"
                            }
                          >
                            {b.attention_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "success" | "warning" | "danger";
}) {
  const color = tone
    ? { success: "text-success", warning: "text-warning", danger: "text-danger" }[tone]
    : "text-text-primary";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${color}`}>
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-text-muted">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function TrendChart({
  data,
}: {
  data: Array<{ date: string; avg_score: number; scan_count: number }>;
}) {
  const max = Math.max(...data.map((d) => d.avg_score), 1);

  return (
    <div className="mt-4">
      {data.every((d) => d.scan_count === 0) ? (
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          No scans recorded in this period.
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div
            className="flex items-end gap-1.5 overflow-x-auto no-scrollbar"
            style={{ height: 160 }}
            role="img"
            aria-label="Daily average cleanliness score bar chart"
          >
            {data.map((d) => {
              const height = d.scan_count > 0 ? (d.avg_score / max) * 100 : 0;
              const color =
                d.avg_score >= 70
                  ? "bg-success"
                  : d.avg_score >= 40
                  ? "bg-warning"
                  : d.avg_score > 0
                  ? "bg-danger"
                  : "bg-border";
              return (
                <div
                  key={d.date}
                  className="group relative flex min-w-[28px] flex-1 flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  <div
                    className={`w-full rounded-t-md transition-all ${color}`}
                    style={{ height: `${height}%`, minHeight: d.scan_count > 0 ? 4 : 0 }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden rounded bg-ink/80 px-2 py-1 text-[11px] text-white group-hover:block whitespace-nowrap">
                    {d.scan_count > 0
                      ? `${d.avg_score} avg · ${d.scan_count} scan${d.scan_count !== 1 ? "s" : ""}`
                      : "No scans"}
                  </div>
                </div>
              );
            })}
          </div>
          {/* X-axis labels */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {data.map((d) => (
              <p
                key={d.date}
                className="min-w-[28px] flex-1 text-center text-[10px] text-text-muted"
              >
                {format(new Date(d.date + "T00:00:00"), "dd/MM")}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusDonut({
  counts,
}: {
  counts: { clean: number; needs_attention: number; dirty: number };
}) {
  const total = counts.clean + counts.needs_attention + counts.dirty;

  if (total === 0) {
    return (
      <p className="mt-4 text-sm text-text-muted">No rooms scanned yet.</p>
    );
  }

  const segments = [
    { label: "Clean", value: counts.clean, color: "bg-success", text: "text-success" },
    { label: "Needs attention", value: counts.needs_attention, color: "bg-warning", text: "text-warning" },
    { label: "Dirty", value: counts.dirty, color: "bg-danger", text: "text-danger" },
  ];

  const TrendIcon =
    counts.dirty > 0
      ? TrendingDown
      : counts.needs_attention > 0
      ? Minus
      : TrendingUp;

  return (
    <div className="mt-4 space-y-3">
      {/* Progress bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-border">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={`${s.color} transition-all`}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null,
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-sm text-text-muted">{s.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm font-semibold ${s.text}`}>
                {s.value}
              </span>
              <span className="text-xs text-text-disabled">
                {total > 0
                  ? `${Math.round((s.value / total) * 100)}%`
                  : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 pt-1 text-xs text-text-muted">
        <TrendIcon className="h-3.5 w-3.5" />
        <span>
          {counts.dirty > 0
            ? `${counts.dirty} room${counts.dirty !== 1 ? "s" : ""} require immediate attention`
            : counts.needs_attention > 0
            ? `${counts.needs_attention} room${counts.needs_attention !== 1 ? "s" : ""} should be monitored`
            : "All scanned rooms are clean"}
        </span>
      </div>
    </div>
  );
}
