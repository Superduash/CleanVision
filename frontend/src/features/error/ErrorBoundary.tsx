import React from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/composite/ErrorState';

export function ErrorBoundary() {
  const error = useRouteError();
  
  let errorMessage = 'An unexpected error occurred.';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-6">
      <ErrorState 
        title="App Error"
        message={errorMessage} 
        onRetry={() => window.location.href = '/'} 
      />
    </div>
  );
}
