import React, { useState } from 'react';
import { useReportsSummary } from '@/lib/api/hooks';
import { SummaryStatRow } from '@/components/composite/SummaryStatRow';
import { TrendChart } from '@/components/composite/TrendChart';
import { BlockBreakdownList } from '@/components/composite/BlockBreakdownList';
import { ErrorState } from '@/components/composite/ErrorState';
import { Tabs } from '@/components/ui/tabs';
import { PrintReportButton } from '@/components/composite/PrintReportButton';

export default function ReportsPage() {
  const [days, setDays] = useState<string>('7');
  const { data: summary, isLoading, isError, refetch } = useReportsSummary(parseInt(days, 10));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-[var(--text-primary)]">Facility Reports</h1>
          <p className="text-body text-[var(--text-secondary)] mt-1">
            Aggregate data and cleanliness trends.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs 
            tabs={[
              { label: '7 Days', value: '7' },
              { label: '30 Days', value: '30' }
            ]}
            value={days}
            onChange={setDays}
            className="print:hidden"
          />
          <PrintReportButton />
        </div>
      </header>

      {isError ? (
        <ErrorState message="Failed to load report data" onRetry={refetch} />
      ) : (
        <div className="flex flex-col gap-6 print-content">
          <SummaryStatRow summary={summary} isLoading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="h-64 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] animate-pulse" />
              ) : (
                <TrendChart data={summary?.daily_trend || []} />
              )}
            </div>
            
            <div className="lg:col-span-1">
              {isLoading ? (
                <div className="h-64 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] animate-pulse" />
              ) : (
                <BlockBreakdownList blocks={summary?.block_breakdown || []} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
