import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatChartDate } from '@/lib/utils/formatters';

interface TrendChartProps {
  data: { date: string; avg_score: number; scan_count: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: formatChartDate(d.date)
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-[var(--surface-raised)] rounded-[var(--radius-lg)]">
        <span className="text-[var(--text-tertiary)]">No trend data available</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-md)] shadow-[var(--shadow-md)]">
          <p className="text-xs text-[var(--text-secondary)] mb-2 font-medium">{data.displayDate}</p>
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              Avg Score: <span className="font-bold text-mono">{data.avg_score.toFixed(1)}</span>
            </p>
            <p className="text-sm">
              Scans: <span className="font-bold text-mono">{data.scan_count}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full bg-[var(--surface)] p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">7-Day Score Trend</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand-teal)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--brand-teal)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              domain={[0, 10]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avg_score"
              stroke="var(--brand-teal)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScore)"
              activeDot={{ r: 6, fill: 'var(--brand-teal)', stroke: 'var(--canvas)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
