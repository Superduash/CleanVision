import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { ScanResponse } from '@/lib/api/types';

interface ShareResultButtonProps {
  scan: ScanResponse;
  roomName: string;
}

export function ShareResultButton({ scan, roomName }: ShareResultButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const text = `CleanVision Scan Result for ${roomName}\nScore: ${scan.score.toFixed(1)}/10 (${scan.status.replace('_', ' ')})`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Scan Result: ${roomName}`,
          text,
          url,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(`${text}\n${url}`);
        }
      }
    } else {
      copyToClipboard(`${text}\n${url}`);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(
      () => toast('Result copied to clipboard', 'success'),
      () => toast('Failed to copy', 'error')
    );
  };

  return (
    <Button variant="secondary" onClick={handleShare} className="w-full">
      <Share2 size={18} />
      Share Result
    </Button>
  );
}
