import { Camera, ShieldCheck, BellRing, History } from "lucide-react";

export function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">Features</h1>
        <p className="mt-4 text-lg text-text-muted">Explore how CleanVision redefines facility management with AI.</p>
      </div>
      
      <div className="mt-16 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <Camera className="h-8 w-8 text-primary" />
          <h2 className="mt-6 text-xl font-bold text-text-primary">Baseline tracking</h2>
          <p className="mt-4 text-text-muted">Register rooms with reference photos. CleanVision uses intelligent variance detection rather than generic criteria.</p>
        </div>
        
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="mt-6 text-xl font-bold text-text-primary">Real-time validation</h2>
          <p className="mt-4 text-text-muted">Get an immediate 0-100 score in seconds. Staff always know whether a room meets your baseline standards instantly.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <BellRing className="h-8 w-8 text-primary" />
          <h2 className="mt-6 text-xl font-bold text-text-primary">Actionable alerts</h2>
          <p className="mt-4 text-text-muted">Dirty rooms trigger immediate dashboard notifications. Risk-based sorting ensures problem areas get handled first.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <History className="h-8 w-8 text-primary" />
          <h2 className="mt-6 text-xl font-bold text-text-primary">Immutable logs</h2>
          <p className="mt-4 text-text-muted">Generate full audit trails for compliance. Keep historical logs of every single scan for comprehensive facility reviews.</p>
        </div>
      </div>
    </div>
  );
}
