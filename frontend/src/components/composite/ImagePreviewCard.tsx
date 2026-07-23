import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewCardProps {
  file: File;
  onRetake: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function ImagePreviewCard({ file, onRetake, onSubmit, loading }: ImagePreviewCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col h-full bg-[var(--canvas)]">
      <div className="flex-1 relative p-4 overflow-hidden flex flex-col items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-full max-w-full object-contain rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
          />
        ) : null}
      </div>
      
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border-subtle)] flex gap-3 p-safe-bottom">
        <Button
          variant="secondary"
          onClick={onRetake}
          disabled={loading}
          className="flex-1"
        >
          <Trash2 size={18} />
          Retake
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          loading={loading}
          className="flex-1"
        >
          Submit Scan
        </Button>
      </div>
    </div>
  );
}
