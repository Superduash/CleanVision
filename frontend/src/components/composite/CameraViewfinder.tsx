import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/formatters';

interface CameraViewfinderProps {
  onCapture: (file: File) => void;
  onError: (error: string) => void;
}

export function CameraViewfinder({ onCapture, onError }: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsReady(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (err) {
      onError('Failed to access camera. Please check permissions.');
    }
  }, [onError]);

  useEffect(() => {
    // Check for multiple cameras
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    });

    void startCamera(facingMode);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, startCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to file
    canvas.toBlob((blob) => {
      if (!blob) {
        onError('Failed to process image');
        return;
      }
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isReady ? 'opacity-100' : 'opacity-0'
        )}
      />
      
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-safe pointer-events-none">
        <div className="flex justify-between items-start p-4">
          <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm">
            Align room within frame
          </div>
          {hasMultipleCameras && (
            <Button
              variant="secondary"
              size="icon-only"
              onClick={toggleCamera}
              className="pointer-events-auto bg-black/50 border-none text-white hover:bg-black/70 rounded-full h-10 w-10"
              aria-label="Switch camera"
            >
              <RefreshCcw size={20} />
            </Button>
          )}
        </div>

        {/* Shutter Button Area */}
        <div className="p-6 pb-12 flex justify-center items-center pointer-events-auto">
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className={cn(
              'w-20 h-20 rounded-full border-4 border-white flex items-center justify-center',
              'transition-transform active:scale-90 touch-manipulation',
              !isReady && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Take photo"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black">
              <Camera size={28} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
