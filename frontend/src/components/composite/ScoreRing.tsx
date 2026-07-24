import React from 'react';
import { motion } from 'motion/react';
import { formatScore, getStatusColors } from '@/lib/utils/formatters';
import type { Status } from '@/lib/api/types';

interface ScoreRingProps {
  score: number;
  status: Status;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({
  score,
  status,
  size = 120,
  strokeWidth = 8,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Score is 0-10, convert to percentage for strokeDashoffset
  const percent = Math.max(0, Math.min(100, (score / 10) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const { color, tint } = getStatusColors(status);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Score: ${formatScore(score)}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${String(size)} ${String(size)}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tint}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="text-display-lg font-bold text-mono text-text-primary"
          style={{ lineHeight: 1 }}
        >
          {formatScore(score)}
        </span>
        <span className="text-caption text-text-tertiary mt-1">/10</span>
      </div>
    </div>
  );
}
