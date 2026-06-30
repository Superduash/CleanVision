import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getStatusBadgeClasses,
  getStatusLabel,
  getStatusTextClass,
  formatDateTime,
  buildImageUrl,
} from '../utils/status';

/**
 * HistoryPage — shows the scan history for a single room.
 *
 * Bugs fixed from the Qwen version:
 *   - URL was /api/history/:id  → now correctly /api/rooms/:id/history
 *   - Field was scan.score      → now scan.cleanliness_score
 *   - Field was scan.scanned_at → now scan.timestamp
 *   - Field scan.confidence did not exist → removed "Confidence" column
 *   - Room was fetched via GET /rooms + .find() → now GET /rooms/:id directly
 */
function HistoryPage() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [room,    setRoom]    = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/rooms/${roomId}`),
        axios.get(`${API_BASE}/rooms/${roomId}/history`),
      ]);
      setRoom(roomRes.data.room);
      setHistory(historyRes.data.history || []);
      setError(null);
    } catch {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner label="Loading history…" />;

  if (error) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="cv-card p-8 max-w-md mx-auto text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-sm mb-4" style={{ color: '#8b949e' }}>{error}</p>
          <button id="history-retry" className="cv-btn-primary" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="cv-page-title">Scan History</h1>
          {room && (
            <p className="text-sm mt-0.5" style={{ color: '#8b949e' }}>
              {room.name} — Block {room.block}
            </p>
          )}
        </div>
        <button
          id="history-back-btn"
          className="cv-back-btn mt-1"
          onClick={() => navigate('/')}
        >
          ← Dashboard
        </button>
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <div className="cv-card p-12 text-center animate-fade-in">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#e6edf3' }}>
            No scans yet
          </h2>
          <p className="text-sm mb-6" style={{ color: '#8b949e' }}>
            This room hasn't been scanned. Head over to the scan page to start.
          </p>
          <button
            id="history-goto-scan"
            className="cv-btn-primary"
            onClick={() => navigate(`/scan/${roomId}`)}
          >
            Scan Now
          </button>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MiniStat
              label="Total Scans"
              value={history.length}
              color="#8b949e"
            />
            <MiniStat
              label="Latest Score"
              value={`${history[0].cleanliness_score}`}
              color={getStatusTextClass(history[0].status).replace('text-', '')}
              colorClass={getStatusTextClass(history[0].status)}
            />
            <MiniStat
              label="Latest Status"
              value={getStatusLabel(history[0].status)}
              colorClass={getStatusTextClass(history[0].status)}
            />
          </div>

          {/* History table / cards */}
          <div className="cv-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>
                      Date &amp; Time
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>
                      Photo
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>
                      Score
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan, idx) => (
                    <tr
                      key={scan.id}
                      className={idx % 2 === 0 ? '' : ''}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: '#8b949e' }}>
                        {formatDateTime(scan.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        {scan.image_path ? (
                          <img
                            src={buildImageUrl(scan.image_path, API_BASE)}
                            alt={`Scan on ${formatDateTime(scan.timestamp)}`}
                            className="w-12 h-12 rounded-lg object-cover"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xs"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#8b949e' }}
                          >
                            N/A
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right text-lg font-bold tabular-nums ${getStatusTextClass(scan.status)}`}>
                        {scan.cleanliness_score}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`cv-badge ${getStatusBadgeClasses(scan.status)}`}>
                          {getStatusLabel(scan.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scan again CTA */}
          <div className="flex justify-center mt-5">
            <button
              id="history-scan-again"
              className="cv-btn-primary"
              onClick={() => navigate(`/scan/${roomId}`)}
            >
              Scan Again
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, colorClass = '' }) {
  return (
    <div className="cv-card p-4 text-center" style={{ cursor: 'default' }}>
      <p className={`text-xl font-bold ${colorClass}`} style={!colorClass ? { color: '#8b949e' } : {}}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{label}</p>
    </div>
  );
}

export default HistoryPage;