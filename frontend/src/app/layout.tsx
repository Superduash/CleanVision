import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SidebarNav } from '@/components/composite/SidebarNav';
import { BottomNav } from '@/components/composite/BottomNav';
import { FAB } from '@/components/composite/FAB';
import { OfflineBanner } from '@/components/composite/OfflineBanner';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';

export function RootLayout() {
  const { staffName } = useStaffNameStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to welcome if no staff name is set and we're not already on the welcome page
  // (In a real app, this might be a more robust onboarding flow)
  useEffect(() => {
    if (!staffName && location.pathname !== '/welcome') {
      navigate('/welcome', { replace: true });
    }
  }, [staffName, location.pathname, navigate]);

  return (
    <div className="flex h-screen w-full bg-[var(--canvas)] overflow-hidden">
      <SidebarNav />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <OfflineBanner />
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto w-full pb-20 md:pb-6 pt-6">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 min-h-full flex flex-col">
            <Outlet />
          </div>
        </div>

        <div className="md:hidden">
          <FAB />
        </div>
      </main>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
