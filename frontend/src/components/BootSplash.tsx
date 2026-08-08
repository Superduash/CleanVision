import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BootSplashProps {
  message?: string;
  className?: string;
}

export function BootSplash({ message = "Initializing CleanVision...", className }: BootSplashProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Prevent flashing on very fast loads (e.g. fast Suspense resolves)
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center bg-bg px-4 transition-colors",
        className
      )}
    >
      <div className="relative flex items-center justify-center h-32 w-32">
        {/* Concentric rings with breathing pulse (border wave) */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse-subtle" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse-subtle [animation-delay:1s]" />

        {/* Central Logo Badge */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-raised text-white">
          <ShieldCheck className="h-8 w-8" />
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight text-text-primary">
        CleanVision
      </h1>
      <p className="mt-1 text-xs font-medium uppercase tracking-widest text-text-muted">
        Healthcare Cleanliness Monitoring
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 shadow-sm">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium text-text-muted">{message}</span>
      </div>

      <footer className="absolute bottom-6 text-center text-[11px] text-text-disabled">
        CleanVision Operating System · Production Hardened
      </footer>
    </div>
  );
}
