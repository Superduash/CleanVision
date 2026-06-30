import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import ScoreGauge from '../components/ScoreGauge';
import LoadingSpinner from '../components/LoadingSpinner';
import { buildImageUrl } from '../utils/status';

/**
 * ScanPage — upload a current photo of a room to get a cleanliness score.
 */
function ScanPage() {
  const { roomId }  = useParams();
  const navigate    = useNavigate();
  const fileInputRef = useRef(null);

  const [room,         setRoom]         = useState(null);
  const [baselineUrl,  setBaselineUrl]  = useState(null);
  const [roomLoading,  setRoomLoading]  = useState(true);
  const [roomError,    setRoomError]    = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl,   setPreviewUrl]   = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [scanning,     setScanning]     = useState(false);
  const [result,       setResult]       = useState(null);
  const [scanError,    setScanError]    = useState(null);

  // --- Load room info ---
  const fetchRoom = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/rooms/${roomId}`);
      const r   = res.data.room;
      setRoom(r);
      setBaselineUrl(buildImageUrl(r.baseline_image_path, API_BASE));
    } catch {
      setRoomError('Room not found or server unreachable.');
    } finally {
      setRoomLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  // --- File handling ---
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('Please select an image file (jpg, jpeg, png, or webp).');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanError(null);
    setResult(null);
  }, []);

  const handleFileInput = (e) => handleFile(e.target.files[0]);
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // --- Scan ---
  const handleScan = async () => {
    if (!selectedFile) {
      setScanError('Please select an image first.');
      return;
    }
    setScanning(true);
    setScanError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append('room_id', roomId);
      form.append('image', selectedFile);
      const res = await axios.post(`${API_BASE}/scan`, form);
      setResult(res.data);
    } catch (err) {
      setScanError(err.response?.data?.error || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleNewScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Loading / error states for room ---
  if (roomLoading) return <LoadingSpinner label="Loading room…" />;

  if (roomError) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="cv-card p-8 text-center">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-sm mb-4" style={{ color: '#8b949e' }}>{roomError}</p>
          <button id="back-from-error" className="cv-btn-secondary" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="cv-page-title">Scan Room</h1>
          {room && (
            <p className="text-sm mt-0.5" style={{ color: '#8b949e' }}>
              {room.name} — Block {room.block}
            </p>
          )}
        </div>
        <button
          id="scan-back-btn"
          className="cv-back-btn mt-1"
          onClick={() => navigate('/')}
        >
          ← Dashboard
        </button>
      </div>

      {/* Scan error */}
      {scanError && (
        <div className="cv-alert-error mb-4 flex items-center justify-between">
          <span>{scanError}</span>
          <button
            onClick={() => setScanError(null)}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0, marginLeft: '0.5rem' }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* RESULT VIEW */}
      {result && (
        <div className="cv-card p-6 mb-6 animate-fade-in">
          <ScoreGauge score={result.score} status={result.status} />

          {/* Dirty alert */}
          {result.status === 'dirty' && (
            <div className="cv-dirty-banner my-4">
              <span className="text-2xl">⚠️</span>
              <span>ALERT: This area requires immediate cleaning</span>
            </div>
          )}

          {/* Mock badge */}
          {result.mock && (
            <div className="cv-alert-warning my-4 text-sm text-center">
              🔧 Mock prediction — real model not yet trained
            </div>
          )}

          {/* Scanned image preview */}
          {previewUrl && (
            <div className="mt-4 rounded-xl overflow-hidden">
              <img
                src={previewUrl}
                alt="Scanned room"
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              id="new-scan-btn"
              className="cv-btn-primary flex-1"
              onClick={handleNewScan}
            >
              New Scan
            </button>
            <button
              id="view-history-btn"
              className="cv-btn-secondary flex-1"
              onClick={() => navigate(`/history/${roomId}`)}
            >
              View History
            </button>
          </div>
        </div>
      )}

      {/* SCAN INPUT VIEW */}
      {!result && (
        <div className="space-y-5">
          {/* Baseline reference */}
          {baselineUrl && (
            <div className="cv-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8b949e' }}>
                Baseline — Clean Reference
              </p>
              <div className="rounded-xl overflow-hidden">
                <img
                  src={baselineUrl}
                  alt="Baseline clean reference"
                  className="w-full max-h-56 object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>
          )}

          {/* Upload zone */}
          <div className="cv-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8b949e' }}>
              Current Room Photo
            </p>

            <div
              className={`cv-dropzone mb-4 ${dragging ? 'active' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload scan image"
              onKeyDown={(e) => e.key === 'Enter' && !scanning && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="scan-image-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
                disabled={scanning}
              />

              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Preview of selected scan"
                    className="mx-auto rounded-lg max-h-48 object-cover"
                  />
                  <p className="text-xs" style={{ color: '#8b949e' }}>
                    Click to replace
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <p className="text-sm" style={{ color: '#8b949e' }}>
                    <span className="font-semibold" style={{ color: '#10b981' }}>Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    JPG, JPEG, PNG, WEBP — max 16 MB
                  </p>
                </div>
              )}
            </div>

            {/* Scan button */}
            <button
              id="scan-now-btn"
              onClick={handleScan}
              disabled={!selectedFile || scanning}
              className="cv-btn-primary w-full text-base py-3"
              style={{ fontSize: '1rem' }}
            >
              {scanning ? (
                <>
                  <svg className="animate-spin-slow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Scan Now
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanPage;