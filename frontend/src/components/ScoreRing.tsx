import { useEffect, useState } from "react";
import { cn, clampScore } from "@/lib/utils";
import type { RoomStatus } from "@/lib/api";

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 282.7, matches the 283 baseline in tailwind.config.ts

const STATUS_STROKE: Record<RoomStatus, string> = {
  clean: "rgb(var(--color-success))",
  needs_attention: "rgb(var(--color-warning))",
  dirty: "rgb(var(--color-danger))",
};

const SIZE_MAP = {
  sm: 56,
  md: 88,
  lg: 168,
} as const;

interface ScoreRingProps {
  score: number;
  status?: RoomStatus;
  size?: keyof typeof SIZE_MAP;
  /** Plays the sweep-in animation once on mount — used on the landing page and scan results. */
  animate?: boolean;
  className?: string;
}

/**
 * Circular score gauge. When no `status` is given, the ring uses the
 * signature accent violet instead of a status color — this is the
 * "actively scanning" state used on the landing page hero, before a real
 * result exists.
 */
export function ScoreRing({ score, status, size = "md", animate = false, className }: ScoreRingProps) {
  const clamped = clampScore(score);
  const px = SIZE_MAP[size];
  const stroke = status ? STATUS_STROKE[status] : "rgb(var(--color-accent))";
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  const [mounted, setMounted] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: px, height: px }}
      role="img"
      aria-label={status ? `Score ${clamped}, ${status.replace("_", " ")}` : `Score ${clamped}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="rgb(var(--color-border))"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={mounted ? offset : CIRCUMFERENCE}
          style={{
            transition: animate ? "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-mono font-semibold text-text-primary",
            size === "sm" && "text-sm",
            size === "md" && "text-2xl",
            size === "lg" && "text-4xl",
          )}
        >
          {Math.round(clamped)}
        </span>
        {size !== "sm" && <span className="text-[10px] uppercase tracking-wide text-text-muted">score</span>}
      </div>
    </div>
  );
}
