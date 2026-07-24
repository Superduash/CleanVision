import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineQueueStore } from '@/lib/stores/offlineQueueStore';

export default function OfflinePage() {
  const navigate = useNavigate();
  const { pendingScans } = useOfflineQueueStore();

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-status-attention-tint flex items-center justify-center text-status-attention mb-6 shadow-sm border border-border-subtle">
        <WifiOff size={40} />
      </div>
      
      <h1 className="text-h1 font-bold text-text-primary mb-3">
        Offline Queue
      </h1>
      
      <p className="text-body text-text-secondary max-w-md mx-auto mb-2">
        You are currently offline. 
      </p>
      
      <div className="bg-surface px-6 py-4 rounded-lg border border-border-subtle shadow-sm mb-8">
        <p className="text-h3 font-semibold text-text-primary">
          {pendingScans} pending scan{pendingScans !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-text-secondary mt-1">
          Scans will automatically sync when connection is restored.
        </p>
      </div>

      <Button onClick={() => navigate(-1)} variant="secondary" size="lg">
        <ChevronLeft size={18} />
        Go Back
      </Button>
    </div>
  );
}
