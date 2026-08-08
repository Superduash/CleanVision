import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { PublicReportPage } from "@/pages/PublicReportPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Direct page imports for instant zero-delay navigation
import { FeaturesPage } from "@/pages/FeaturesPage";
import { ContactPage } from "@/pages/ContactPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";

import { DashboardPage } from "@/pages/DashboardPage";
import { RoomDetailPage } from "@/pages/RoomDetailPage";
import { AddEditRoomPage } from "@/pages/AddEditRoomPage";
import { ScanPage } from "@/pages/ScanPage";
import { ScanResultPage } from "@/pages/ScanResultPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { AdminPanelPage } from "@/pages/AdminPanelPage";
import { CleaningRequestsPage } from "@/pages/CleaningRequestsPage";

function RootRoute() {
  const { session } = useAuth();

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
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/staff/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // Redirect unauthorized staff role to their main dashboard
    return <Navigate to="/dashboard" replace />;
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
          <Route path="/report" element={<PublicReportPage />} />
          <Route path="/report/:roomCode" element={<PublicReportPage />} />

          {/* Marketing / info pages */}
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
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
                <DashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="rooms/new"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <AddEditRoomPage />
              </RoleGuard>
            }
          />
          <Route
            path="rooms/:roomId"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <RoomDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="rooms/:roomId/edit"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <AddEditRoomPage />
              </RoleGuard>
            }
          />
          <Route
            path="scan"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <ScanPage />
              </RoleGuard>
            }
          />
          <Route
            path="scan/result"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <ScanResultPage />
              </RoleGuard>
            }
          />
          <Route
            path="history"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <HistoryPage />
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <ReportsPage />
              </RoleGuard>
            }
          />
          <Route
            path="admin"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <AdminPanelPage />
              </RoleGuard>
            }
          />
          <Route
            path="cleaning-requests"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "inspector"]}>
                <CleaningRequestsPage />
              </RoleGuard>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
