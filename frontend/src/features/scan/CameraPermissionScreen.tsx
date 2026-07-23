import React from 'react';
import { Camera, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraPermissionScreenProps {
  onRetry: () => void;
  error?: string;
}

export function CameraPermissionScreen({ onRetry, error }: CameraPermissionScreenProps) {
  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-6 text-center safe-area-padding">
      <div className="w-20 h-20 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-tertiary)] mb-6 shadow-sm border border-[var(--border-subtle)]">
        <Camera size={40} />
      </div>
      <h1 className="text-h2 font-bold text-[var(--text-primary)] mb-3">
        Camera Access Required
      </h1>
      <p className="text-body text-[var(--text-secondary)] max-w-xs mx-auto mb-8">
        {error || 'CleanVision needs camera access to scan rooms. Please allow camera permissions in your browser settings.'}
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onRetry} size="lg">
          Try Again
        </Button>
        <p className="text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1 mt-4">
          <Settings size={12} /> Check browser settings if blocked
        </p>
      </div>
    </div>
  );
}
