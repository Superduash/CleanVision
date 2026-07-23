import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-3xl mx-auto w-full pb-24 md:pb-8">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[var(--border-subtle)] hover:bg-[var(--surface-raised)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal-tint)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-h1 font-bold text-[var(--text-primary)]">About CleanVision</h1>
        </div>
      </header>

      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-[var(--brand-teal-tint)] rounded-full flex items-center justify-center text-[var(--brand-teal)] mb-6 shadow-sm">
          <Sparkles size={40} />
        </div>
        
        <h2 className="text-display-lg font-bold tracking-tight text-[var(--text-primary)] mb-2">
          CleanVision
        </h2>
        <p className="text-body text-[var(--text-secondary)] mb-8 max-w-md">
          Version 2.0.0
        </p>
        
        <p className="text-body text-[var(--text-primary)] mb-8 max-w-md">
          CleanVision uses advanced computer vision to ensure hospital environments meet the highest standards of cleanliness. Built with React 19, Vite, and Tailwind v4.
        </p>

        <Button variant="secondary" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
