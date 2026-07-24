
import { Camera } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils/formatters';

export function FAB() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide FAB on scan flow or if not on dashboard
  if (location.pathname.startsWith('/scan') || location.pathname !== '/') {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/scan')}
      className={cn(
        'fab fixed z-40',
        'bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] right-4 md:bottom-8 md:right-8',
        'w-14 h-14 bg-[var(--brand-teal)] text-white rounded-xl',
        'shadow-lg flex items-center justify-center',
        'hover:bg-[var(--brand-teal-hover)] hover:scale-105 active:scale-95',
        'transition-all duration-200 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-teal-tint'
      )}
      aria-label="New Scan"
    >
      <Camera size={24} />
    </button>
  );
}
