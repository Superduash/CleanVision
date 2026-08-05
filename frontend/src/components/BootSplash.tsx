import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BootSplashProps {
  message?: string;
  className?: string;
}

export function BootSplash({ message = "Initializing CleanVision...", className }: BootSplashProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center bg-bg px-4 transition-colors",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Concentric faint rings with breathing pulse */}
        <div className="absolute h-36 w-36 animate-pulse-subtle rounded-full bg-primary/5 blur-xl" />
        <div className="absolute h-28 w-28 animate-pulse-subtle rounded-full bg-primary/10 blur-md delay-300" />
        <div className="absolute h-20 w-20 rounded-full border border-primary/20 bg-primary/5" />

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
