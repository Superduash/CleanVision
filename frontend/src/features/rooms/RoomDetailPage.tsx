import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Camera, Settings } from 'lucide-react';
import { useRoom } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/composite/ErrorState';
import { formatScore, relativeTime } from '@/lib/utils/formatters';
import { BaselineUpload } from './BaselineUpload';
import { RoomHistorySection } from './RoomHistorySection';
import { RoomQRCode } from '@/components/composite/RoomQRCode';
import { RoomCardSkeleton } from '@/components/ui/skeleton';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = parseInt(id || '0', 10);
  const navigate = useNavigate();

  const { data: room, isLoading, isError, refetch } = useRoom(roomId);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <RoomCardSkeleton />
        <div className="h-64 bg-surface rounded-lg animate-pulse" />
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="p-4 md:p-8 flex-1 flex items-center justify-center">
        <ErrorState message="Failed to load room details" onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-32">
      {/* Header with back button */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-border-subtle hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-tint"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h2 font-bold text-text-primary">{room.name}</h1>
              {room.latest_status && <Badge variant={room.latest_status} />}
            </div>
            <p className="text-sm text-text-tertiary">Block {room.block}</p>
          </div>
        </div>

        <Link to={`/scan?roomId=${String(room.id)}`} className="no-underline hidden sm:block">
          <Button>
            <Camera size={18} /> New Scan
          </Button>
        </Link>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        
        {/* Left Column - Details & QR */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-body font-medium text-text-secondary">Current Status</h3>
            </div>
            
            <div className="flex items-baseline gap-2">
              {room.latest_score != null ? (
                <>
                  <span className="text-display-lg font-bold text-mono text-text-primary leading-none">
                    {formatScore(room.latest_score)}
                  </span>
                  <span className="text-body text-text-tertiary">/10</span>
                </>
              ) : (
                <span className="text-body text-text-tertiary italic">Unscanned</span>
              )}
            </div>

            <p className="text-sm text-text-tertiary">
              Last scanned: {room.last_scanned ? relativeTime(room.last_scanned) : 'Never'}
            </p>
          </div>

          <div className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <RoomQRCode room={room} />
          </div>
        </div>

        {/* Right Column - Baseline & History */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm p-6 sm:p-8">
            <BaselineUpload roomId={room.id} currentBaselinePath={room.baseline_image_path} />
          </section>

          <section>
            <RoomHistorySection roomId={room.id} />
          </section>
        </div>
      </div>

      {/* Mobile sticky scan button */}
      <div className="sm:hidden fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-0 right-0 p-4 bg-gradient-to-t from-[var(--canvas)] to-transparent pointer-events-none z-10">
        <Link to={`/scan?roomId=${String(room.id)}`} className="no-underline pointer-events-auto block w-full">
          <Button size="lg" className="w-full shadow-lg h-14 rounded-full text-base">
            <Camera size={20} /> New Scan
          </Button>
        </Link>
      </div>
    </div>
  );
}
