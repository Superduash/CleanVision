import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-surface-raised flex items-center justify-center text-text-tertiary mb-6 shadow-sm border border-border-subtle">
        <FileQuestion size={40} />
      </div>
      <h1 className="text-display-lg font-bold text-text-primary mb-2">404</h1>
      <h2 className="text-h2 font-semibold text-text-primary mb-3">
        Page Not Found
      </h2>
      <p className="text-body text-text-secondary max-w-sm mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="no-underline">
        <Button size="lg">
          <Home size={18} />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
