import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SidebarNav } from '@/components/composite/SidebarNav';
import { BottomNav } from '@/components/composite/BottomNav';
import { FAB } from '@/components/composite/FAB';
import { OfflineBanner } from '@/components/composite/OfflineBanner';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';
import { motion, AnimatePresence } from 'motion/react';

export function RootLayout() {
  const { staffName, hasHydrated } = useStaffNameStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Only redirect to welcome once Zustand persist has fully rehydrated from localStorage.
  // Without hasHydrated, this fires before staffName is restored, incorrectly bouncing returning users.
  useEffect(() => {
    if (hasHydrated && !staffName && location.pathname !== '/welcome') {
      navigate('/welcome', { replace: true });
    }
  }, [hasHydrated, staffName, location.pathname, navigate]);

  return (
    <div className="flex h-screen w-full bg-canvas overflow-hidden">
      <SidebarNav />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <OfflineBanner />
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto w-full pb-20 md:pb-6 pt-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 min-h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col flex-1"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
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
