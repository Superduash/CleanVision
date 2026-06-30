import React from 'react';
import { Link } from 'react-router-dom';

function getStatusColor(status) {
  if (status === 'clean') return 'bg-green-100 text-green-800';
  if (status === 'needs_attention') return 'bg-amber-100 text-amber-800';
  if (status === 'dirty') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-600';
}

function getStatusLabel(status) {
  if (status === 'clean') return 'Clean';
  if (status === 'needs_attention') return 'Needs Attention';
  if (status === 'dirty') return 'Dirty';
  return 'Not yet scanned';
}

function formatTime(timestamp) {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function RoomCard({ room }) {
  const { id, name, block, latest_score, latest_status, last_scanned } = room;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
          <p className="text-sm text-gray-500">Block {block}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(latest_status)}`}>
          {getStatusLabel(latest_status)}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">Latest Score</p>
        <p className="text-2xl font-bold text-gray-800">
          {latest_score !== null && latest_score !== undefined ? `${latest_score} / 100` : '—'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Last scanned: {formatTime(last_scanned)}
        </p>
      </div>

      <div className="flex space-x-2 mt-auto">
        <Link
          to={`/scan/${id}`}
          className="flex-1 bg-emerald-600 text-white text-center py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors no-underline"
        >
          Scan Now
        </Link>
        <Link
          to={`/history/${id}`}
          className="flex-1 bg-gray-200 text-gray-700 text-center py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors no-underline"
        >
          History
        </Link>
      </div>
    </div>
  );
}

export default RoomCard;