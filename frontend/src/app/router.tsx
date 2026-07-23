import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './layout';
import { ErrorBoundary } from '@/features/error/ErrorBoundary';
import { NotFoundPage } from '@/components/composite/NotFoundPage';

// Lazy load feature pages
const DashboardPage = React.lazy(() => import('@/features/dashboard/DashboardPage'));
const RoomDetailPage = React.lazy(() => import('@/features/rooms/RoomDetailPage'));
const ScanFlowPage = React.lazy(() => import('@/features/scan/ScanFlowPage'));
const GlobalHistoryPage = React.lazy(() => import('@/features/history/GlobalHistoryPage'));
const ReportsPage = React.lazy(() => import('@/features/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('@/features/settings/SettingsPage'));
const LandingPage = React.lazy(() => import('@/features/landing/LandingPage'));
const OfflinePage = React.lazy(() => import('@/features/offline/OfflinePage'));

// A generic loading fallback for suspense
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-12">
    <div className="w-8 h-8 rounded-full border-4 border-[var(--brand-teal-tint)] border-t-[var(--brand-teal)] animate-spin" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'rooms/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RoomDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'history',
        element: (
          <Suspense fallback={<PageLoader />}>
            <GlobalHistoryPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/scan',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ScanFlowPage />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/welcome',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/offline-queue',
    element: (
      <Suspense fallback={<PageLoader />}>
        <OfflinePage />
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
