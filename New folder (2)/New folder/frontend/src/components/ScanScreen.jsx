import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Check, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import './ScanScreen.css';

// Preset mock bathroom images for desktop demonstration
const PRESET_IMAGES = [
  {
    name: "Perfect Clean Bathroom",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    filename: "clean_bathroom.jpg"
  },
  {
    name: "Dirty Trash & Toilet",
    url: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80",
    filename: "dirty_trash_toilet.jpg"
  },
  {
    name: "Wet Floor & Spill",
    url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80",
    filename: "wet_floor_spill.jpg"
  },
  {
    name: "Stained Mirror & Counter",
    url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80",
    filename: "stained_mirror_counter.jpg"
  }
];

export default function ScanScreen({ user, onBack, onStartInspection }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    hospitalName: "City General Hospital",
    block: "A",
    floorNumber: "1",
    roomNumber: "101",
    bathroomId: "CGH-A-101-B1",
    inspectorName: user.name || "Sarah Jenkins"
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [presetIndex, setPresetIndex] = useState(-1);
  const [error, setError] = useState("");

  // Sync Bathroom ID automatically
  useEffect(() => {
    const hospAbbr = formData.hospitalName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
    const cleanBlock = formData.block.trim().toUpperCase() || 'X';
    const cleanFloor = formData.floorNumber.trim() || '0';
    const cleanRoom = formData.roomNumber.trim() || '00';
    
    setFormData(prev => ({
      ...prev,
      bathroomId: `${hospAbbr}-${cleanBlock}-${cleanFloor}${cleanRoom}-B1`
    }));
  }, [formData.hospitalName, formData.block, formData.floorNumber, formData.roomNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const triggerFileSelect = (captureMode = false) => {
    if (fileInputRef.current) {
      if (captureMode) {
        fileInputRef.current.setAttribute("capture", "environment");
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setError("");
      setImageFile(file);
      setPresetIndex(-1);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPreset = async (index) => {
    setPresetIndex(index);
    setError("");
    const preset = PRESET_IMAGES[index];
    setSelectedImage(preset.url);
    
    // Convert preset URL to a dummy File object for backend multer compatibility
    try {
      const response = await fetch(preset.url);
      const blob = await response.blob();
      const file = new File([blob], preset.filename, { type: "image/jpeg" });
      setImageFile(file);
    } catch (e) {
      // Fallback if CORS block
      const dummyFile = {
        name: preset.filename,
        size: 512 * 1024, // 512KB
        type: "image/jpeg"
      };
      setImageFile(dummyFile);
    }
  };

  const handleStartInspection = () => {
    setError("");
    
    // Validation
    if (!formData.hospitalName || !formData.block || !formData.floorNumber || !formData.roomNumber) {
      setError("Please fill out all facility details.");
      return;
    }
    if (!selectedImage || !imageFile) {
      setError("Please capture or upload a bathroom photo to inspect.");
      return;
    }

    onStartInspection(formData, imageFile);
  };

  return (
    <div className="scan-screen animate-fade">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="screen-title">Cleanliness Audit</h2>
      </div>

      <div className="scan-content-scroll">
        {error && (
          <div className="error-alert animate-slide-up">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Facility Metadata Card */}
        <div className="section-card glass-card">
          <h3 className="section-card-title">Facility Details</h3>
          
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label className="form-label">Facility/Hospital</label>
              <input
                type="text"
                className="form-control"
                name="hospitalName"
                value={formData.hospitalName}
                readOnly
                style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: '600' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Block</label>
              <input 
                type="text" 
                className="form-control" 
                name="block" 
                maxLength={2}
                placeholder="A" 
                value={formData.block} 
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Floor</label>
              <input 
                type="number" 
                className="form-control" 
                name="floorNumber" 
                min={0}
                placeholder="1" 
                value={formData.floorNumber} 
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Room No.</label>
              <input 
                type="text" 
                className="form-control" 
                name="roomNumber" 
                placeholder="101" 
                value={formData.roomNumber} 
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bathroom ID</label>
              <input 
                type="text" 
                className="form-control" 
                name="bathroomId" 
                readOnly
                value={formData.bathroomId} 
                style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }}
              />
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Inspector Name</label>
              <div className="locked-field-wrapper">
                <Lock size={14} className="locked-icon" />
                <input 
                  type="text" 
                  className="form-control locked-input" 
                  name="inspectorName" 
                  value={formData.inspectorName} 
                  readOnly
                  style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: '600', paddingLeft: '36px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Upload Panel */}
        <div className="section-card glass-card">
          <h3 className="section-card-title">Bathroom Image Capture</h3>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }}
          />

          {!selectedImage ? (
            <button className="upload-box upload-box-full" onClick={() => triggerFileSelect(true)}>
              <div className="upload-box-icon">
                <Camera size={30} />
              </div>
              <span className="upload-box-title">Tap to Capture Photo</span>
              <span className="upload-box-desc">Opens device camera — point at bathroom</span>
            </button>
          ) : (
            <div className="image-preview-container">
              <img src={selectedImage} alt="Bathroom preview" className="image-preview" />
              <div className="preview-overlay-guide">
                <div className="guide-box"></div>
              </div>
              <button className="change-image-btn" onClick={() => { setSelectedImage(null); setImageFile(null); }}>
                <RefreshCw size={14} /> Change Photo
              </button>
            </div>
          )}
        </div>

        {/* 3. Demo presets library */}
        <div className="section-card glass-card">
          <h3 className="section-card-title">Inspection Test Library (Desktop Demo)</h3>
          <p className="card-hint">Select a preset to simulate CV analysis with specific outputs:</p>
          <div className="presets-list">
            {PRESET_IMAGES.map((preset, idx) => (
              <button 
                key={idx}
                className={`preset-item ${presetIndex === idx ? 'active-preset' : ''}`}
                onClick={() => selectPreset(idx)}
              >
                <div className="preset-thumb-wrapper">
                  <img src={preset.url} alt={preset.name} className="preset-thumb" />
                  {presetIndex === idx && (
                    <div className="preset-checked">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="preset-name">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button 
          className="btn btn-primary start-inspect-btn" 
          onClick={handleStartInspection}
        >
          <Camera size={18} /> Start AI Inspection
        </button>
      </div>
    </div>
  );
}
