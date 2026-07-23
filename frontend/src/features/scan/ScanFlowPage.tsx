import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft } from 'lucide-react';
import { CameraViewfinder } from '@/components/composite/CameraViewfinder';
import { ImagePreviewCard } from '@/components/composite/ImagePreviewCard';
import { AnalyzingState } from '@/components/composite/AnalyzingState';
import { ResultCard } from '@/components/composite/ResultCard';
import { ShareResultButton } from '@/components/composite/ShareResultButton';
import { CameraPermissionScreen } from './CameraPermissionScreen';
import { useSubmitScan, useRoom } from '@/lib/api/hooks';
import { compressImage } from '@/lib/utils/imageCompression';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { useOfflineQueueStore } from '@/lib/stores/offlineQueueStore';
import type { ScanResponse } from '@/lib/api/types';

type ScanStep = 'camera' | 'preview' | 'analyzing' | 'result';

export default function ScanFlowPage() {
  const [searchParams] = useSearchParams();
  const roomIdStr = searchParams.get('roomId');
  const roomId = roomIdStr ? parseInt(roomIdStr, 10) : 0;
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const submitScan = useSubmitScan();
  const { isOnline, incrementPending } = useOfflineQueueStore();
  const { data: room } = useRoom(roomId);

  const [step, setStep] = useState<ScanStep>('camera');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomIdStr) {
      toast('No room selected for scanning.', 'error');
      navigate('/', { replace: true });
    }
  }, [roomIdStr, navigate, toast]);

  const handleCapture = (file: File) => {
    setImageFile(file);
    setStep('preview');
  };

  const handleRetake = () => {
    setImageFile(null);
    setStep('camera');
  };

  const handleSubmit = async () => {
    if (!imageFile || !roomId) return;
    
    setStep('analyzing');
    
    try {
      const compressed = await compressImage(imageFile);
      
      if (!isOnline) {
        // Offline handling
        incrementPending();
        toast('Offline: Scan queued for background sync.', 'warning');
        // Fake a result for immediate feedback
        setResult({
          scan_id: -1,
          score: 5,
          status: 'needs_attention',
          room_id: roomId,
          image_path: URL.createObjectURL(compressed),
          mock: true
        });
        setTimeout(() => setStep('result'), 2000);
        return;
      }

      submitScan.mutate(
        { roomId, image: compressed },
        {
          onSuccess: (data) => {
            setResult(data);
            setStep('result');
          },
          onError: (err) => {
            toast(err.message, 'error');
            setStep('preview'); // Go back to preview on failure
          }
        }
      );
    } catch (err) {
      toast((err as Error).message, 'error');
      setStep('preview');
    }
  };

  const handleClose = () => {
    if (result) {
      navigate(`/rooms/${String(roomId)}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  if (cameraError && step === 'camera') {
    return <CameraPermissionScreen error={cameraError} onRetry={() => setCameraError(null)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--canvas)] flex flex-col sm:pb-0 h-[100dvh] overflow-hidden">
      {/* Header overlay for camera/preview, solid for others */}
      <header className={`flex items-center justify-between p-4 p-safe-top z-10 ${
        (step === 'camera' || step === 'preview') ? 'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent text-white' : 'bg-[var(--surface)] border-b border-[var(--border-subtle)]'
      }`}>
        {step === 'result' ? (
          <Button variant="ghost" onClick={handleClose} className={step === 'result' ? '' : 'text-white hover:text-white/80 hover:bg-white/20'}>
            <ChevronLeft size={20} /> Back to Room
          </Button>
        ) : (
          <button 
            onClick={handleClose}
            className={`w-10 h-10 flex items-center justify-center rounded-full ${
              (step === 'camera' || step === 'preview') ? 'bg-black/40 hover:bg-black/60 backdrop-blur-md text-white' : 'bg-[var(--surface-raised)] text-[var(--text-primary)]'
            }`}
            aria-label="Close scan"
          >
            <X size={20} />
          </button>
        )}
        
        {(step === 'camera' || step === 'preview') && room && (
          <div className="text-sm font-medium tracking-wide drop-shadow-md">
            Scanning: {room.name}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {step === 'camera' && (
          <CameraViewfinder onCapture={handleCapture} onError={setCameraError} />
        )}
        
        {step === 'preview' && imageFile && (
          <ImagePreviewCard 
            file={imageFile} 
            onRetake={handleRetake} 
            onSubmit={handleSubmit}
            loading={submitScan.isPending}
          />
        )}
        
        {step === 'analyzing' && (
          <AnalyzingState imageFile={imageFile} status="analyzing" />
        )}
        
        {step === 'result' && result && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-lg mx-auto w-full pb-safe-bottom">
            <AnalyzingState imageFile={null} status="success" />
            <div className="mt-[-2rem] z-10 flex flex-col gap-4">
              <ResultCard scan={result} />
              <ShareResultButton scan={result} roomName={room?.name || 'Room'} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
