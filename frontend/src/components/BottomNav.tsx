import { NavLink } from "react-router-dom";
import { LayoutGrid, ScanLine, History, Bell, ClipboardList, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  primary?: boolean;
  badge?: number;
}

export function BottomNav() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(20),
    refetchInterval: 15_000,
  });

  const unreadNotifs = notifData?.unread_count ?? 0;

  const adminItems: NavItem[] = [
    { to: "/dashboard", label: "Home", icon: LayoutGrid },
    { to: "/dashboard/scan", label: "Scan", icon: ScanLine, primary: true },
    { to: "/dashboard/history", label: "History", icon: History },
    { to: "/dashboard/admin", label: "Admin", icon: ShieldCheck },
    { to: "/dashboard/notifications", label: "Alerts", icon: Bell, badge: unreadNotifs },
  ];

  const patientItems: NavItem[] = [
    { to: "/dashboard", label: "Rooms", icon: ClipboardList },
    { to: "/dashboard/notifications", label: "Alerts", icon: Bell, badge: unreadNotifs },
    { to: "/dashboard/profile", label: "Profile", icon: LayoutGrid },
  ];

  const items = isAdmin ? adminItems : patientItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-border bg-surface/95 backdrop-blur-sm pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
      aria-label="Primary"
    >
      {items.map(({ to, label, icon: Icon, primary, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-all relative",
              isActive ? "text-primary" : "text-text-muted"
            )
          }
        >
          {({ isActive }) => (
            <>
              {primary ? (
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full shadow-primary-glow transition-all",
                    isActive ? "bg-primary text-white" : "bg-accent text-white"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
              ) : (
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {badge != null && badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-white shadow-sm">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
              )}
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
