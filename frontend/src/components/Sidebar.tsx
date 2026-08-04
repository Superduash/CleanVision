import { NavLink, Link } from "react-router-dom";
import {
  LayoutGrid,
  ScanLine,
  History,
  BarChart2,
  Settings,
  Bell,
  LogOut,
  ShieldCheck,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

export function Sidebar() {
  const { session, signOut } = useAuth();
  const isAdmin = session?.role === "admin";

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(50),
    refetchInterval: 15_000,
  });

  const { data: requestData } = useQuery({
    queryKey: ["cleaning-requests"],
    queryFn: () => api.getCleaningRequests("pending"),
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const unreadNotifs = notifData?.unread_count ?? 0;
  const pendingRequests = requestData?.pending_count ?? 0;

  const adminNavItems: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/dashboard/scan", label: "Scan Room", icon: ScanLine },
    { to: "/dashboard/history", label: "Scan History", icon: History },
    { to: "/dashboard/reports", label: "Reports & Stats", icon: BarChart2 },
    { to: "/dashboard/cleaning-requests", label: "Cleaning Requests", icon: ClipboardList, badge: pendingRequests },
    { to: "/dashboard/notifications", label: "Alerts", icon: Bell, badge: unreadNotifs },
    { to: "/dashboard/admin", label: "Admin Panel", icon: ShieldCheck, adminOnly: true },
  ];

  const patientNavItems: NavItem[] = [
    { to: "/dashboard", label: "Rooms Overview", icon: LayoutGrid },
    { to: "/dashboard/notifications", label: "Alerts", icon: Bell, badge: unreadNotifs },
  ];

  const items = isAdmin ? adminNavItems : patientNavItems;

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-border bg-surface px-4 py-6 shadow-card">
      <div className="space-y-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-primary-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-text-primary">CleanVision</span>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Hospital Hygiene</p>
          </div>
        </Link>

        {/* Navigation Section */}
        <nav className="space-y-1" aria-label="Main navigation">
          <p className="px-3 text-[11px] font-semibold text-text-disabled uppercase tracking-wider">
            {isAdmin ? "Management Tools" : "Patient Portal"}
          </p>
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-white shadow-primary-glow"
                    : "text-text-muted hover:bg-highlight hover:text-text-primary"
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              {badge != null && badge > 0 && (
                <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings link */}
        <div className="pt-4 border-t border-border">
          <p className="px-3 text-[11px] font-semibold text-text-disabled uppercase tracking-wider mb-1">
            System
          </p>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "bg-primary text-white shadow-primary-glow"
                  : "text-text-muted hover:bg-highlight hover:text-text-primary"
              )
            }
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between rounded-xl bg-bg p-3 border border-border">
          <Link to="/dashboard/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            {session?.photoURL ? (
              <img src={session.photoURL} alt={session.name} className="h-9 w-9 rounded-full object-cover border border-primary" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(session?.name?.[0] ?? "U").toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{session?.name}</p>
              <p className="truncate text-[11px] text-text-muted capitalize">{session?.role}</p>
            </div>
          </Link>
          <button
            onClick={signOut}
            title="Sign Out"
            className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
