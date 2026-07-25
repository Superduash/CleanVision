import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ScanLine,
  History,
  Settings,
  BarChart2,
  Bell,
  User,
  LogOut,
  Home,
  Moon,
  Sun,
  Shield,
  ClipboardList,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/dashboard/scan", label: "New scan", icon: ScanLine },
  { to: "/dashboard/history", label: "Scan history", icon: History },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart2, adminOnly: true },
  { to: "/dashboard/notifications", label: "Alerts", icon: Bell },
  { to: "/dashboard/admin", label: "Admin panel", icon: Shield, adminOnly: true },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/profile", label: "My profile", icon: User },
];

const PATIENT_NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Room status", icon: ClipboardList },
  { to: "/dashboard/notifications", label: "Alerts", icon: Bell },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/profile", label: "My profile", icon: User },
];

export function Sidebar() {
  const { session, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const isAdmin = session?.role === "admin";
  const navItems = isAdmin ? ALL_NAV_ITEMS : PATIENT_NAV_ITEMS;

  const handleSignOut = () => {
    signOut();
    toast.success("Signed out successfully");
    navigate("/", { replace: true });
  };

  const roleBadgeClass =
    session?.role === "admin"
      ? "bg-accent/15 text-accent"
      : session?.role === "patient"
      ? "bg-success/15 text-success"
      : "bg-border text-text-muted";

  const roleLabel =
    session?.role === "admin"
      ? "Admin"
      : session?.role === "patient"
      ? "Patient"
      : "User";

  return (
    <aside className="hidden h-screen w-[220px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <Logo />
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4" aria-label="Primary">
        {/* Role section label */}
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-disabled">
          {isAdmin ? "Management" : "Patient View"}
        </p>

        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_rgb(var(--color-primary))]"
                  : "text-text-muted hover:bg-bg hover:text-text-primary",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        {/* Home link */}
        <div className="mt-auto pt-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-all hover:bg-bg hover:text-text-primary"
          >
            <Home className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span>Back to home</span>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2.5">
          {/* Avatar */}
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
              session?.role === "admin" ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary",
            )}
          >
            {(session?.name ?? "G")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-text-primary leading-none">
                {session?.name ?? "Guest"}
              </p>
              <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", roleBadgeClass)}>
                {roleLabel}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-text-muted">{session?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-danger"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
