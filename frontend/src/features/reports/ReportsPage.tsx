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
    <div className="flex flex-col gap-10 w-full pb-24 md:pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg font-bold text-text-primary tracking-tight">Facility Reports</h1>
          <p className="text-body text-text-secondary mt-1">
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
        <div className="flex flex-col gap-8 print-content">
          <SummaryStatRow summary={summary} isLoading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-h3 font-semibold text-text-primary">Cleanliness Trend</h2>
              {isLoading ? (
                <div className="h-64 rounded-lg animate-pulse bg-surface border border-border-subtle" />
              ) : (
                <TrendChart data={summary?.daily_trend || []} />
              )}
            </div>
            
            <div className="lg:col-span-1 bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-h3 font-semibold text-text-primary">Block Breakdown</h2>
              {isLoading ? (
                <div className="h-64 rounded-lg animate-pulse bg-surface border border-border-subtle" />
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
