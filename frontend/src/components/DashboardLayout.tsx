import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Bell, Menu, X, Moon, Sun, Home } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useRooms } from "@/hooks/useRooms";
import { cn } from "@/lib/utils";

/** Top app bar for mobile — includes hamburger, logo, theme, alerts */
function MobileTopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { theme, toggle } = useTheme();
  const { data: rooms } = useRooms();
  const alertCount = rooms?.filter(
    (r) => r.latest_status === "dirty" || r.latest_status === "needs_attention",
  ).length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm lg:hidden">
      <button
        onClick={onMenuOpen}
        aria-label="Open menu"
        className="rounded-lg p-2 text-text-muted hover:bg-bg"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Logo />
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-text-muted hover:bg-bg"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Link to="/dashboard/notifications" className="relative rounded-lg p-2 text-text-muted hover:bg-bg">
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

/** Mobile slide-out drawer */
function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { session, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const isAdmin = session?.role === "admin";

  const adminItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/dashboard/scan", label: "New scan" },
    { to: "/dashboard/history", label: "Scan history" },
    { to: "/dashboard/reports", label: "Reports" },
    { to: "/dashboard/notifications", label: "Alerts" },
    { to: "/dashboard/admin", label: "Admin panel" },
    { to: "/dashboard/settings", label: "Settings" },
    { to: "/dashboard/profile", label: "My profile" },
  ];

  const patientItems = [
    { to: "/dashboard", label: "Room status" },
    { to: "/dashboard/notifications", label: "Alerts" },
    { to: "/dashboard/settings", label: "Settings" },
    { to: "/dashboard/profile", label: "My profile" },
  ];

  const items = isAdmin ? adminItems : patientItems;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      {/* Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-surface shadow-raised transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Logo />
          <button onClick={onClose} aria-label="Close menu" className="rounded-lg p-2 text-text-muted hover:bg-bg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-disabled">
            {isAdmin ? "Management" : "Patient View"}
          </p>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-muted hover:bg-bg hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 border-t border-border pt-4">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-muted hover:bg-bg hover:text-text-primary"
            >
              <Home className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </nav>

        {/* Theme + user footer */}
        <div className="border-t border-border p-4 space-y-3">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-bg"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={() => { signOut(); navigate("/", { replace: true }); onClose(); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

export function DashboardLayout() {
  const { session, isLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar onMenuOpen={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-x-hidden pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
