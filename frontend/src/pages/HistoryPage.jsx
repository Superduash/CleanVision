import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

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
  return 'Unknown';
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/rooms`),
        axios.get(`${API_BASE}/history/${roomId}`),
      ]);

      const found = (roomsRes.data.rooms || []).find((r) => r.id === parseInt(roomId));
      if (found) setRoom(found);

      setHistory(historyRes.data.history || []);
      setError(null);
    } catch (err) {
      setError('Failed to load history. Please try again.');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading history..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Scan History</h2>
          {room && <p className="text-sm text-gray-500">{room.name} — Block {room.block}</p>}
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No scans yet</h3>
          <p className="text-gray-500 mb-6">
            This room hasn't been scanned yet. Go scan it!
          </p>
          <button
            onClick={() => navigate(`/scan/${roomId}`)}
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-700 transition-colors"
          >
            Scan Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(scan.scanned_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    {scan.score} / 100
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}>
                      {getStatusLabel(scan.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(scan.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;