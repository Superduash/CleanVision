import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NetworkErrorPage({ onRetry }: { onRetry?: () => void }) {
  const handleReload = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--status-attention-tint)] flex items-center justify-center text-[var(--status-attention)] mb-6 shadow-sm border border-[var(--border-subtle)]">
        <WifiOff size={40} />
      </div>
      <h1 className="text-h1 font-bold text-[var(--text-primary)] mb-3">
        No Internet Connection
      </h1>
      <p className="text-body text-[var(--text-secondary)] max-w-md mx-auto mb-8">
        We couldn't connect to the server. Please check your network connection and try again. 
        If you are trying to submit a scan, it will be saved offline.
      </p>
      <Button onClick={handleReload} size="lg">
        <RefreshCw size={18} />
        Try Again
      </Button>
    </div>
  );
}
