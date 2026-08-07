import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { PublicReportPage } from "@/pages/PublicReportPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { BootSplash } from "@/components/BootSplash";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy-load public pages
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage").then(m => ({ default: m.FeaturesPage })));
const ContactPage = lazy(() => import("@/pages/ContactPage").then(m => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/TermsPage").then(m => ({ default: m.TermsPage })));

// Lazy-load dashboard pages
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const RoomDetailPage = lazy(() => import("@/pages/RoomDetailPage").then((m) => ({ default: m.RoomDetailPage })));
const AddEditRoomPage = lazy(() => import("@/pages/AddEditRoomPage").then((m) => ({ default: m.AddEditRoomPage })));
const ScanPage = lazy(() => import("@/pages/ScanPage").then((m) => ({ default: m.ScanPage })));
const ScanResultPage = lazy(() => import("@/pages/ScanResultPage").then((m) => ({ default: m.ScanResultPage })));
const HistoryPage = lazy(() => import("@/pages/HistoryPage").then((m) => ({ default: m.HistoryPage })));
const ReportsPage = lazy(() => import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const AdminPanelPage = lazy(() => import("@/pages/AdminPanelPage").then((m) => ({ default: m.AdminPanelPage })));
const CleaningRequestsPage = lazy(() => import("@/pages/CleaningRequestsPage").then((m) => ({ default: m.CleaningRequestsPage })));

function RootRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <BootSplash message="Initializing CleanVision..." />;
  }

  if (session) {
    const roleHomeMap: Record<UserRole, string> = {
      admin: "/dashboard/admin",
      manager: "/dashboard",
      inspector: "/dashboard",
    };
    return <Navigate to={roleHomeMap[session.role] || "/dashboard"} replace />;
  }

  // Unauthenticated guests see the marketing/landing page
  return <LandingPage />;
}

function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <BootSplash message="Verifying security credentials..." />;
  }

  if (!session) {
    return <Navigate to="/staff/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    const roleHomeMap: Record<UserRole, string> = {
      admin: "/dashboard/admin",
      manager: "/dashboard",
      inspector: "/dashboard",
    };
    return <Navigate to={roleHomeMap[session.role] || "/dashboard"} replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Root: Landing page for guests, dashboard redirect for authenticated staff */}
        <Route path="/" element={<RootRoute />} />

        {/* Staff Portal Login */}
        <Route path="/staff/login" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />

        {/* All public pages share the navbar + footer via PublicLayout */}
        <Route element={<PublicLayout />}>
          {/* Public QR report page — accessible by room code without login */}
          <Route path="/report" element={<Suspense fallback={<BootSplash />}><PublicReportPage /></Suspense>} />
          <Route path="/report/:roomCode" element={<Suspense fallback={<BootSplash />}><PublicReportPage /></Suspense>} />

          {/* Marketing / info pages */}
          <Route path="/features" element={<Suspense fallback={<BootSplash />}><FeaturesPage /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<BootSplash />}><ContactPage /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<BootSplash />}><PrivacyPage /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<BootSplash />}><TermsPage /></Suspense>} />
        </Route>

        {/* Staff Role Route Aliases */}
        <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/manager" element={<Navigate to="/dashboard" replace />} />
        <Route path="/inspector" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <RoleGuard>
              <DashboardLayout />
            </RoleGuard>
          }
        >
          <Route
            index
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <Suspense fallback={<BootSplash />}>
                  <DashboardPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="rooms/new"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Suspense fallback={<BootSplash />}>
                  <AddEditRoomPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="rooms/:roomId"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <Suspense fallback={<BootSplash />}>
                  <RoomDetailPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="rooms/:roomId/edit"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Suspense fallback={<BootSplash />}>
                  <AddEditRoomPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="scan"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <Suspense fallback={<BootSplash />}>
                  <ScanPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="scan/result"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <Suspense fallback={<BootSplash />}>
                  <ScanResultPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="history"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <Suspense fallback={<BootSplash />}>
                  <HistoryPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Suspense fallback={<BootSplash />}>
                  <ReportsPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="admin"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Suspense fallback={<BootSplash />}>
                  <AdminPanelPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="cleaning-requests"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <Suspense fallback={<BootSplash />}>
                  <CleaningRequestsPage />
                </Suspense>
              </RoleGuard>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<BootSplash />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<BootSplash />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="notifications"
            element={
              <Suspense fallback={<BootSplash />}>
                <NotificationsPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
