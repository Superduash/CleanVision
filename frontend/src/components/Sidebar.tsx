import { NavLink, Link } from "react-router-dom";
import {
  LayoutGrid,
  ScanLine,
  History,
  BarChart2,
  Bell,
  LogOut,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useHospitalConfig } from "@/hooks/useHospitalConfig";
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
  const { config } = useHospitalConfig();
  const isManagerOrAdmin = session?.role === "admin" || session?.role === "manager";

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(50),
    refetchInterval: 15_000,
  });

  const { data: issueData } = useQuery({
    queryKey: ["issue-reports-open-sidebar"],
    queryFn: () => api.getIssueReports("open"),
    refetchInterval: 15_000,
  });

  const unreadNotifs = notifData?.unread_count ?? 0;
  const openIssues = issueData?.open_count ?? 0;

  const navItems: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/dashboard/scan", label: "Scan Room", icon: ScanLine },
    { to: "/dashboard/history", label: "Scan History", icon: History },
    { to: "/dashboard/cleaning-requests", label: "Visitor Alerts", icon: ClipboardList, badge: openIssues },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: unreadNotifs },
  ];

  if (isManagerOrAdmin) {
    navItems.splice(3, 0, { to: "/dashboard/reports", label: "Reports & Stats", icon: BarChart2 });
    navItems.push({ to: "/dashboard/admin", label: "Facility Admin", icon: ShieldCheck, adminOnly: true });
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-surface px-4 py-5 shadow-card">
      {/* Brand Header */}
      <Link to="/" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-sm text-text-primary truncate">{config.hospitalName}</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled">CleanVision QA</p>
        </div>
      </Link>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-muted hover:bg-highlight hover:text-text-primary"
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {!!item.badge && item.badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User Profile & Logout */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between rounded-xl bg-bg p-3 border border-border">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-text-primary">{session?.name || "Staff Member"}</p>
            <p className="text-[11px] font-semibold text-primary capitalize">{session?.role || "Staff"}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-lg p-1.5 text-text-disabled hover:bg-danger-bg hover:text-danger transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
