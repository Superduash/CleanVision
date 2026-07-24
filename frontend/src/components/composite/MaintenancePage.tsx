import React from 'react';
import { Wrench } from 'lucide-react';

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-status-info-tint flex items-center justify-center text-status-info mb-6 shadow-sm border border-border-subtle">
        <Wrench size={40} />
      </div>
      <h1 className="text-h1 font-bold text-text-primary mb-3">
        System Maintenance
      </h1>
      <p className="text-body text-text-secondary max-w-md mx-auto">
        CleanVision is currently undergoing scheduled maintenance. We will be back online shortly. 
        Thank you for your patience.
      </p>
    </div>
  );
}
