import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { Room } from '@/lib/api/types';

interface RoomQRCodeProps {
  room: Room;
}

export function RoomQRCode({ room }: RoomQRCodeProps) {
  // Generate a URL that leads directly to the scan flow for this specific room
  const scanUrl = `${window.location.origin}/scan?roomId=${String(room.id)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-surface p-6 rounded-lg border border-border-subtle shadow-sm">
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <QRCodeSVG 
          value={scanUrl} 
          size={200}
          level="H"
          includeMargin={false}
        />
      </div>
      
      <div className="text-center">
        <h3 className="text-h3 font-semibold text-text-primary">{room.name}</h3>
        <p className="text-sm text-text-secondary">{room.block}</p>
      </div>
      
      <p className="text-xs text-text-tertiary max-w-xs text-center">
        Print and place this QR code in the room. Cleaners can scan it to quickly log a new cleanliness report.
      </p>

      <Button onClick={handlePrint} variant="secondary" className="w-full mt-2 print-visible">
        <Printer size={18} />
        Print QR Code
      </Button>

      {/* Print-only layout */}
      <div className="hidden print:flex flex-col items-center justify-center fixed inset-0 bg-white z-[9999] p-12">
        <h1 className="text-4xl font-bold mb-2">CleanVision</h1>
        <h2 className="text-2xl mb-12">{room.block} - {room.name}</h2>
        <QRCodeSVG value={scanUrl} size={400} level="H" />
        <p className="text-xl mt-12 text-center max-w-md">
          Scan this code with your mobile device to log a cleanliness report for this room.
        </p>
      </div>
    </div>
  );
}
