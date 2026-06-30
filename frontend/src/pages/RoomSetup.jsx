import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

const BLOCKS = ['A', 'B', 'C', 'D'];

/**
 * RoomSetup — two-step form to create a room and upload its baseline image.
 * Step 1: POST /api/rooms
 * Step 2: POST /api/rooms/:id/baseline
 */
function RoomSetup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name,          setName]          = useState('');
  const [block,         setBlock]         = useState('');
  const [baselineImage, setBaselineImage] = useState(null);
  const [previewUrl,    setPreviewUrl]    = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(false);

  const isValid = name.trim().length > 0 && block !== '' && baselineImage !== null;

  // File selection helper (shared by input and drop)
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (jpg, jpeg, png, or webp).');
      return;
    }
    setBaselineImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleFileInput = (e) => handleFile(e.target.files[0]);

  // Drag-and-drop handlers
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setError('Room name, block, and baseline image are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: create room
      const roomForm = new FormData();
      roomForm.append('name', name.trim());
      roomForm.append('block', block);
      const roomRes = await axios.post(`${API_BASE}/rooms`, roomForm);
      const roomId  = roomRes.data.room_id;

      // Step 2: upload baseline
      const imgForm = new FormData();
      imgForm.append('image', baselineImage);
      await axios.post(`${API_BASE}/rooms/${roomId}/baseline`, imgForm);

      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create room. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="cv-page-title">Add New Room</h1>
        <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
          Register a room and upload a clean reference photo.
        </p>
      </div>

      <div className="cv-card p-6">
        <form onSubmit={handleSubmit} noValidate>
          {/* Error / success */}
          {error   && <div className="cv-alert-error   mb-5" role="alert">{error}</div>}
          {success && (
            <div className="cv-alert-success mb-5" role="status">
              ✓ Room created successfully! Redirecting to dashboard…
            </div>
          )}

          {/* Room name */}
          <div className="mb-5">
            <label htmlFor="room-name" className="cv-label">
              Room Name / Number *
            </label>
            <input
              id="room-name"
              type="text"
              className="cv-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ICU-101"
              maxLength={100}
              required
              disabled={submitting}
            />
          </div>

          {/* Block */}
          <div className="mb-5">
            <label htmlFor="room-block" className="cv-label">
              Block / Ward *
            </label>
            <select
              id="room-block"
              className="cv-select"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              required
              disabled={submitting}
            >
              <option value="">Select a block…</option>
              {BLOCKS.map((b) => (
                <option key={b} value={b}>Block {b}</option>
              ))}
            </select>
          </div>

          {/* Baseline image — drag & drop zone */}
          <div className="mb-6">
            <label className="cv-label">
              Baseline Image (clean room) *
            </label>

            <div
              className={`cv-dropzone ${dragging ? 'active' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !submitting && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload baseline image"
              onKeyDown={(e) => e.key === 'Enter' && !submitting && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="baseline-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
                disabled={submitting}
              />

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Baseline preview"
                  className="mx-auto rounded-lg max-h-48 object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
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

            {previewUrl && (
              <button
                type="button"
                className="text-xs mt-2 underline"
                style={{ color: '#8b949e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => {
                  setBaselineImage(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Remove image
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              id="cancel-setup"
              className="cv-btn-secondary flex-1"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-setup"
              className="cv-btn-primary flex-1"
              disabled={!isValid || submitting}
            >
              {submitting ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomSetup;