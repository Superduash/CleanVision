import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { X, Printer, Download, QrCode } from "lucide-react";
import { Button } from "./Button";

interface RoomQRCodeProps {
  roomCode: string;
  roomName: string;
  block: string;
  floor?: string;
  hospitalName: string;
  hospitalCode?: string;
  onClose: () => void;
}

export function RoomQRCode({
  roomCode,
  roomName,
  block,
  floor,
  hospitalName,
  hospitalCode,
  onClose,
}: RoomQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // The QR code value is the full public report URL for this room
  const reportUrl = `${window.location.origin}/report/${roomCode}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, reportUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: "#1a1a2e",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    }).then(() => {
      setQrDataUrl(canvasRef.current?.toDataURL("image/png") ?? null);
    });
  }, [reportUrl]);

  const handlePrint = () => {
    if (!qrDataUrl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Room QR Code – ${roomCode}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Roboto+Mono:wght@500&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .card {
      width: 320px;
      border: 2.5px solid #1a1a2e;
      border-radius: 20px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
      color: white;
      padding: 18px 20px 14px;
      text-align: center;
    }

    .header .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .header .logo-dot {
      width: 10px;
      height: 10px;
      background: #4fc3f7;
      border-radius: 50%;
    }

    .header .hospital {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.85;
      color: #90caf9;
    }

    .header .system {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.02em;
      margin-top: 2px;
    }

    .body {
      padding: 20px;
      text-align: center;
      background: #fff;
    }

    .qr-wrapper {
      display: inline-block;
      border: 3px solid #e8eaf6;
      border-radius: 16px;
      padding: 12px;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }

    .qr-wrapper img {
      display: block;
      width: 200px;
      height: 200px;
      border-radius: 8px;
    }

    .room-info {
      margin-top: 4px;
    }

    .room-name {
      font-size: 18px;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1.2;
    }

    .room-meta {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
      font-weight: 500;
    }

    .room-code-badge {
      display: inline-block;
      margin-top: 10px;
      background: #e8eaf6;
      border: 1px solid #c5cae9;
      border-radius: 8px;
      padding: 5px 14px;
      font-family: 'Roboto Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      letter-spacing: 0.05em;
    }

    .divider {
      border: none;
      border-top: 1.5px dashed #e5e7eb;
      margin: 16px 0;
    }

    .instruction {
      font-size: 11.5px;
      color: #6b7280;
      line-height: 1.5;
      padding: 0 8px;
    }

    .instruction strong {
      color: #1a1a2e;
    }

    .footer {
      background: #f8f9fa;
      border-top: 1.5px solid #e5e7eb;
      padding: 10px 16px;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      font-weight: 500;
    }

    .footer .url {
      font-family: 'Roboto Mono', monospace;
      font-size: 9px;
      word-break: break-all;
      margin-top: 2px;
      color: #6b7280;
    }

    @media print {
      body { margin: 0; padding: 0; }
      .card { border-radius: 0; border: none; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-row">
        <span class="logo-dot"></span>
        <span class="hospital">${hospitalName}</span>
        <span class="logo-dot"></span>
      </div>
      <div class="system">CleanVision QA System</div>
    </div>
    <div class="body">
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" alt="QR Code for ${roomCode}" />
      </div>
      <div class="room-info">
        <div class="room-name">${roomName}</div>
        <div class="room-meta">${block}${floor ? " · " + floor : ""}</div>
        <div class="room-code-badge">${roomCode}</div>
      </div>
      <hr class="divider" />
      <p class="instruction">
        <strong>Scan to report a cleanliness issue.</strong><br/>
        This QR code takes you directly to the reporting portal for this room.
      </p>
    </div>
    <div class="footer">
      CleanVision Facility Quality Assurance
      <div class="url">${reportUrl}</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
  </script>
</body>
</html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR-${roomCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-border bg-surface shadow-2xl animate-scale-in overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-bg">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <span className="font-bold text-text-primary">Room QR Code</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-text-muted hover:text-text-primary hover:bg-highlight transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Preview */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Card Preview */}
          <div className="w-full rounded-2xl border border-border overflow-hidden shadow-card">
            {/* Mini Header */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{hospitalName}</p>
              <p className="text-sm font-black text-white">CleanVision QA System</p>
            </div>

            {/* QR + Room Info */}
            <div className="bg-white p-5 text-center space-y-3">
              <div className="inline-block rounded-xl border-2 border-border p-2.5 shadow-sm bg-white">
                <canvas ref={canvasRef} className="block" />
              </div>
              <div>
                <p className="text-base font-black text-gray-900">{roomName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{block}{floor ? ` · ${floor}` : ""}</p>
                <span className="mt-2 inline-block rounded-lg bg-gray-100 px-3 py-1 font-mono text-xs font-bold text-gray-800 tracking-wide">
                  {roomCode}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 px-2 leading-relaxed">
                Scan to report a cleanliness issue for this room.
              </p>
            </div>

            {/* Footer URL */}
            <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 text-center">
              <p className="font-mono text-[9px] text-gray-400 break-all">{reportUrl}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4" /> Download PNG
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handlePrint}
              disabled={!qrDataUrl}
            >
              <Printer className="h-4 w-4" /> Print QR
            </Button>
          </div>
          <p className="text-xs text-text-muted text-center">
            Print and stick on the room door for visitors to report issues.
          </p>
        </div>
      </div>
    </div>
  );
}
