import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import ScoreGauge from '../components/ScoreGauge';
import LoadingSpinner from '../components/LoadingSpinner';

function ScanPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [baselineUrl, setBaselineUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`${API_BASE}/rooms/${roomId}`);
      if (response.data.room) {
        setRoom(response.data.room);
        // Build baseline image URL from the stored path
        if (response.data.room.baseline_image_path) {
          // The API base is '/api', so the origin is the base of that
          const apiOrigin = API_BASE.replace('/api', '');
          setBaselineUrl(`${apiOrigin}/${response.data.room.baseline_image_path}`);
        }
      }
    } catch (err) {
      setError('Failed to load room information.');
      console.error('Error fetching room:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('room_id', roomId);
      formData.append('image', selectedFile);

      const response = await axios.post(`${API_BASE}/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Scan failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleNewScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Scan Room</h2>
          {room && <p className="text-sm text-gray-500">{room.name} — Block {room.block}</p>}
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 text-sm no-underline"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Result View */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ScoreGauge score={result.score} status={result.status} />

          {/* Dirty alert banner */}
          {result.status === 'dirty' && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-4 rounded-md mb-4 flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <span className="font-bold">ALERT: Area requires cleaning</span>
            </div>
          )}

          {/* Mock prediction badge */}
          {result.mock && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-md mb-4 text-sm text-center">
              🔧 Mock prediction — model not yet trained
            </div>
          )}

          {/* Uploaded photo preview */}
          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Scanned image" className="w-full rounded-md max-h-64 object-cover" />
            </div>
          )}

          <button
            onClick={handleNewScan}
            className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-md font-medium hover:bg-emerald-700 transition-colors"
          >
            New Scan
          </button>
        </div>
      )}

      {/* Scan View (no result yet) */}
      {!result && (
        <div className="space-y-6">
          {/* Baseline image display */}
          {baselineUrl && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Baseline (Clean Reference)</h3>
              <img src={baselineUrl} alt="Baseline" className="w-full rounded-md max-h-64 object-cover" />
            </div>
          )}

          {/* Scan input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload current room photo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mb-4">
                <img src={previewUrl} alt="Preview" className="w-full rounded-md max-h-64 object-cover" />
              </div>
            )}

            {/* Scan Now button */}
            <button
              onClick={handleScan}
              disabled={!selectedFile || uploading}
              className="w-full bg-emerald-600 text-white py-3 rounded-md text-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner label="Analyzing..." />
                </span>
              ) : (
                '🔍 Scan Now'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanPage;