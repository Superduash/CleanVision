import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { X, Camera } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
      },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      scanner.clear().catch(console.error);
      onScan(decodedText);
    };

    const onScanError = (errorMessage: string) => {
      // Html5QrcodeScanner constantly emits errors when it doesn't find a QR code in the current frame
      // We generally ignore these to not spam the user
    };

    try {
      scanner.render(onScanSuccess, onScanError);
    } catch (err: any) {
      setError(err.message || "Failed to start camera");
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-surface overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4 bg-bg">
          <div className="flex items-center gap-2 font-bold text-text-primary">
            <Camera className="h-5 w-5 text-primary" />
            <span>Scan Room QR</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-surface-raised p-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 bg-black">
          {error ? (
            <div className="p-8 text-center text-danger text-sm">
              {error}
            </div>
          ) : (
            <div id="qr-reader" className="w-full overflow-hidden rounded-xl border border-border/20" ref={scannerRef}></div>
          )}
        </div>
        
        <div className="p-4 bg-bg text-center text-xs text-text-muted">
          Point your camera at the QR code on the room door.
        </div>
      </div>
    </div>
  );
}
