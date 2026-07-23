import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatChartDate } from '@/lib/utils/formatters';
import type { Scan } from '@/lib/api/types';

interface HistoryChartProps {
  data: Scan[];
}

export function HistoryChart({ data }: HistoryChartProps) {
  // Need to process data: sort by time, perhaps map to just what we need
  const chartData = [...data].reverse().map(scan => ({
    dateStr: scan.timestamp,
    displayDate: formatChartDate(scan.timestamp),
    score: scan.cleanliness_score,
    status: scan.status
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center bg-[var(--surface-raised)] rounded-[var(--radius-md)]">
        <span className="text-[var(--text-tertiary)] text-sm">Not enough data to chart</span>
      </div>
    );
  }

  // Custom tooltip to show status and score
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] p-2 rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]">
          <p className="text-xs text-[var(--text-secondary)] mb-1">{data.displayDate}</p>
          <p className="text-sm font-bold text-mono">
            Score: {payload[0].value.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            domain={[0, 10]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={8} stroke="var(--status-clean)" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={5} stroke="var(--status-dirty)" strokeDasharray="3 3" opacity={0.5} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--brand-teal)"
            strokeWidth={3}
            dot={{ r: 4, fill: 'var(--surface)', stroke: 'var(--brand-teal)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--brand-teal)', stroke: 'var(--canvas)', strokeWidth: 2 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
