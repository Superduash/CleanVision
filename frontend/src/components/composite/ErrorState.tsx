import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/formatters';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center bg-surface border border-status-dirty-tint rounded-lg shadow-sm', className)}>
      <div className="w-12 h-12 rounded-full bg-status-dirty-tint flex items-center justify-center text-status-dirty mb-3">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-body font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary mb-4 max-w-xs">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} className="mr-1" /> Retry
        </Button>
      )}
    </div>
  );
}
