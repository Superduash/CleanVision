import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import RoomCard from '../components/RoomCard';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Dashboard — lists all rooms in a responsive grid.
 * Auto-refreshes every 30 seconds.
 */
function Dashboard() {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/rooms`);
      setRooms(res.data.rooms || []);
      setError(null);
      setLastRefreshed(new Date());
    } catch {
      setError('Failed to load rooms. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 30_000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // --- Derived stats ---
  const dirtyCount    = rooms.filter((r) => r.latest_status === 'dirty').length;
  const attentionCount = rooms.filter((r) => r.latest_status === 'needs_attention').length;
  const cleanCount    = rooms.filter((r) => r.latest_status === 'clean').length;

  // --- Loading state ---
  if (loading) return <LoadingSpinner label="Loading rooms…" />;

  // --- Error state ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="cv-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#e6edf3' }}>
            Connection Error
          </h2>
          <p className="text-sm mb-6" style={{ color: '#8b949e' }}>{error}</p>
          <button id="retry-load" onClick={fetchRooms} className="cv-btn-primary w-full">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="cv-page-title">Room Overview</h1>
          {lastRefreshed && (
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
        <Link
          to="/setup"
          id="add-room-btn"
          className="cv-btn-primary no-underline"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Room
        </Link>
      </div>

      {/* Stats bar (only when there are rooms) */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Total Rooms"     value={rooms.length}   color="#8b949e" />
          <StatCard label="Clean"           value={cleanCount}     color="#10b981" />
          <StatCard label="Needs Attention" value={attentionCount} color="#f59e0b" />
          {dirtyCount > 0 && (
            <div className="col-span-3">
              <div className="cv-alert-warning flex items-center gap-2 text-sm font-semibold">
                <span>⚠️</span>
                {dirtyCount} {dirtyCount === 1 ? 'room requires' : 'rooms require'} immediate cleaning
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {rooms.length === 0 ? (
        <div className="cv-card p-12 text-center max-w-md mx-auto animate-fade-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#e6edf3' }}>
            No rooms yet
          </h2>
          <p className="text-sm mb-6" style={{ color: '#8b949e' }}>
            Add your first hospital room to start monitoring cleanliness.
          </p>
          <Link
            to="/setup"
            id="add-first-room-btn"
            className="cv-btn-primary no-underline"
          >
            Add First Room
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="cv-card p-4 text-center" style={{ cursor: 'default' }}>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>{label}</p>
    </div>
  );
}

export default Dashboard;