import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineQueueStore } from '@/lib/stores/offlineQueueStore';

export default function OfflinePage() {
  const navigate = useNavigate();
  const { pendingScans } = useOfflineQueueStore();

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--status-attention-tint)] flex items-center justify-center text-[var(--status-attention)] mb-6 shadow-sm border border-[var(--border-subtle)]">
        <WifiOff size={40} />
      </div>
      
      <h1 className="text-h1 font-bold text-[var(--text-primary)] mb-3">
        Offline Queue
      </h1>
      
      <p className="text-body text-[var(--text-secondary)] max-w-md mx-auto mb-2">
        You are currently offline. 
      </p>
      
      <div className="bg-[var(--surface)] px-6 py-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-sm mb-8">
        <p className="text-h3 font-semibold text-[var(--text-primary)]">
          {pendingScans} pending scan{pendingScans !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
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
