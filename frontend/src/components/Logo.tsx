import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2 font-display font-semibold", className)}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white">
        <ScanLine className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>
      {!iconOnly && <span className="text-lg tracking-tight text-text-primary">CleanVision</span>}
    </div>
  );
}
