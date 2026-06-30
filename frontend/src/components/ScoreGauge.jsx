import React from 'react';

function getGaugeColor(status) {
  if (status === 'clean') return { ring: 'text-green-500', bg: 'bg-green-50', text: 'text-green-700' };
  if (status === 'needs_attention') return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' };
  if (status === 'dirty') return { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700' };
  return { ring: 'text-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' };
}

function getStatusLabel(status) {
  if (status === 'clean') return 'Clean';
  if (status === 'needs_attention') return 'Needs Attention';
  if (status === 'dirty') return 'Dirty';
  return 'Unknown';
}

function ScoreGauge({ score, status }) {
  const colors = getGaugeColor(status);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            className={colors.ring}
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${colors.text}`}>{score}</span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>
      <p className={`mt-4 text-lg font-semibold ${colors.text}`}>
        {getStatusLabel(status)}
      </p>
    </div>
  );
}

export default ScoreGauge;