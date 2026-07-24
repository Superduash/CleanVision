import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { useUploadBaseline } from '@/lib/api/hooks';
import { compressImage } from '@/lib/utils/imageCompression';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { getImageUrl } from '@/lib/utils/formatters';

interface BaselineUploadProps {
  roomId: number;
  currentBaselinePath: string | null;
}

export function BaselineUpload({ roomId, currentBaselinePath }: BaselineUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadBaseline(roomId);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      upload.mutate(compressed, {
        onSuccess: () => toast('Baseline image uploaded', 'success'),
        onError: (err) => toast(err.message, 'error')
      });
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-h3 font-semibold text-text-primary">Baseline Image</h3>
      <p className="text-sm text-text-secondary">
        Upload a picture of the room when it's perfectly clean. 
        The AI uses this as a reference point for future scans.
      </p>

      {currentBaselinePath ? (
        <div className="relative group rounded-lg overflow-hidden border border-border-subtle aspect-video bg-canvas">
          <img 
            src={getImageUrl(currentBaselinePath)} 
            alt="Current baseline" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
              <UploadCloud size={18} /> Replace Image
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-[var(--brand-teal)] bg-brand-teal-tint' : 'border-border-strong hover:border-[var(--text-tertiary)] bg-surface'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-3 text-text-tertiary">
            <ImageIcon size={24} />
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">
            Drag & drop an image here
          </p>
          <p className="text-xs text-text-secondary mb-4">
            JPG, PNG or WEBP up to 5MB
          </p>
          <Button onClick={() => fileInputRef.current?.click()} loading={upload.isPending}>
            Select File
          </Button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            void handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
