import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';

export default function LandingPage() {
  const [name, setName] = useState('');
  const { setStaffName } = useStaffNameStore();
  const navigate = useNavigate();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setStaffName(name.trim());
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-xl shadow-lg p-8 text-center flex flex-col items-center">
        
        <div className="w-16 h-16 bg-brand-teal-tint rounded-full flex items-center justify-center text-brand-teal mb-6 shadow-sm border border-brand-teal/20">
          <Sparkles size={32} />
        </div>

        <h1 className="text-display-lg font-bold tracking-tight text-text-primary mb-2">
          CleanVision
        </h1>
        <p className="text-body text-text-secondary mb-8 max-w-xs">
          AI-assisted hospital cleanliness monitoring for facility staff.
        </p>

        <form onSubmit={handleContinue} className="w-full flex flex-col gap-6 text-left">
          <Input
            label="What should we call you?"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <Button 
            type="submit" 
            size="lg" 
            disabled={!name.trim()}
            className="w-full group"
          >
            Get Started
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <p className="text-xs text-text-tertiary mt-6">
          Your name is only stored locally on this device.
        </p>
      </div>
    </div>
  );
}
