import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

function RoomSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const [baselineImage, setBaselineImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setBaselineImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !block || !baselineImage) {
      setError('Room name, block, and baseline image are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Create the room
      const roomFormData = new FormData();
      roomFormData.append('name', name.trim());
      roomFormData.append('block', block);

      const roomRes = await axios.post(`${API_BASE}/rooms`, roomFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const roomId = roomRes.data.room_id;

      // Step 2: Upload baseline image
      const baselineFormData = new FormData();
      baselineFormData.append('image', baselineImage);

      await axios.post(`${API_BASE}/rooms/${roomId}/baseline`, baselineFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

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
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Room</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 text-sm">
              Room created successfully! Redirecting...
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name / Number *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ICU-101"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="block" className="block text-sm font-medium text-gray-700 mb-1">
              Block / Ward *
            </label>
            <select
              id="block"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            >
              <option value="">Select a block</option>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
              <option value="C">Block C</option>
              <option value="D">Block D</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Baseline Image (clean room) *
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              required
            />
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="mt-3 w-full rounded-md max-h-48 object-cover" />
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 text-white py-2 rounded-md font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomSetup;