import { NavLink } from "react-router-dom";
import { LayoutGrid, ScanLine, History, BarChart2, Bell, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  primary?: boolean;
}

const ADMIN_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutGrid },
  { to: "/dashboard/scan", label: "Scan", icon: ScanLine, primary: true },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart2 },
  { to: "/dashboard/notifications", label: "Alerts", icon: Bell },
];

const PATIENT_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Rooms", icon: ClipboardList },
  { to: "/dashboard/notifications", label: "Alerts", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: LayoutGrid },
];

export function BottomNav() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const items: NavItem[] = isAdmin ? ADMIN_ITEMS : PATIENT_ITEMS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-border bg-surface/95 backdrop-blur-sm pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
      aria-label="Primary"
    >
      {items.map(({ to, label, icon: Icon, primary }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard"}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-all",
              primary && !isActive && "relative",
              isActive ? "text-primary" : "text-text-muted",
            )
          }
        >
          {({ isActive }) => (
            <>
              {primary ? (
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full shadow-glow transition-all",
                    isActive ? "bg-primary text-white" : "bg-accent text-white",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
              ) : (
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
