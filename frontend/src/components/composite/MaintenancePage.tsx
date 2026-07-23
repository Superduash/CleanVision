import React from 'react';
import { Wrench } from 'lucide-react';

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--status-info-tint)] flex items-center justify-center text-[var(--status-info)] mb-6 shadow-sm border border-[var(--border-subtle)]">
        <Wrench size={40} />
      </div>
      <h1 className="text-h1 font-bold text-[var(--text-primary)] mb-3">
        System Maintenance
      </h1>
      <p className="text-body text-[var(--text-secondary)] max-w-md mx-auto">
        CleanVision is currently undergoing scheduled maintenance. We will be back online shortly. 
        Thank you for your patience.
      </p>
    </div>
  );
}
