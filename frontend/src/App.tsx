import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useAuth } from "@/hooks/useAuth";

// Lazy-load new public pages
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage").then(m => ({ default: m.FeaturesPage })));
const DocsPage = lazy(() => import("@/pages/DocsPage").then(m => ({ default: m.DocsPage })));
const ApiReferencePage = lazy(() => import("@/pages/ApiReferencePage").then(m => ({ default: m.ApiReferencePage })));
const ContactPage = lazy(() => import("@/pages/ContactPage").then(m => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })));

// Lazy-load all dashboard pages for code-splitting
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const RoomDetailPage = lazy(() =>
  import("@/pages/RoomDetailPage").then((m) => ({ default: m.RoomDetailPage })),
);
const AddEditRoomPage = lazy(() =>
  import("@/pages/AddEditRoomPage").then((m) => ({ default: m.AddEditRoomPage })),
);
const ScanPage = lazy(() =>
  import("@/pages/ScanPage").then((m) => ({ default: m.ScanPage })),
);
const ScanResultPage = lazy(() =>
  import("@/pages/ScanResultPage").then((m) => ({ default: m.ScanResultPage })),
);
const HistoryPage = lazy(() =>
  import("@/pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })),
);
const AdminPanelPage = lazy(() =>
  import("@/pages/AdminPanelPage").then((m) => ({ default: m.AdminPanelPage })),
);
const CleaningRequestsPage = lazy(() =>
  import("@/pages/CleaningRequestsPage").then((m) => ({ default: m.CleaningRequestsPage })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

function RoleGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { session } = useAuth();

  if (requireAdmin && session?.role !== "admin") {
    // If patient tries to access admin route, send them to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={
          <Suspense fallback={<PageLoader />}><FeaturesPage /></Suspense>
        } />
        <Route path="/docs" element={
          <Suspense fallback={<PageLoader />}><DocsPage /></Suspense>
        } />
        <Route path="/api" element={
          <Suspense fallback={<PageLoader />}><ApiReferencePage /></Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>
        } />
        <Route path="/privacy" element={
          <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<PageLoader />}><TermsPage /></Suspense>
        } />
      </Route>

      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="rooms/new"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <AddEditRoomPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="rooms/:roomId"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoomDetailPage />
            </Suspense>
          }
        />
        <Route
          path="rooms/:roomId/edit"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <AddEditRoomPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="scan"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <ScanPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="scan/result"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <ScanResultPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="history"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <HistoryPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="reports"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="admin"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <AdminPanelPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="cleaning-requests"
          element={
            <RoleGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <CleaningRequestsPage />
              </Suspense>
            </RoleGuard>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          }
        />
        <Route
          path="notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotificationsPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
