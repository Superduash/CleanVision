import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Clamp a score into the valid 0-100 range the backend guarantees, defensively. */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
