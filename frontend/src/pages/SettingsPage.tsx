import { useState } from "react";
import { Moon, Sun, Bell, Shield, Database, Info } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/Button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [notifEnabled, setNotifEnabled] = useState(false);

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    staleTime: 60_000,
  });

  const handleNotifToggle = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    toast.success(
      next
        ? "Dirty-room notifications enabled for this session."
        : "Notifications disabled.",
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 page-enter">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-muted">
        Appearance, notifications, and system information.
      </p>

      <div className="mt-8 space-y-4">
        {/* Appearance */}
        <SettingsSection
          icon={theme === "dark" ? Moon : Sun}
          title="Appearance"
          description="Choose your preferred color scheme."
        >
          <div className="flex gap-2">
            <button
              onClick={() => theme === "dark" && toggle()}
              aria-pressed={theme === "light"}
              className={
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors " +
                (theme === "light"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-muted hover:bg-bg")
              }
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => theme === "light" && toggle()}
              aria-pressed={theme === "dark"}
              className={
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors " +
                (theme === "dark"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-muted hover:bg-bg")
              }
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </SettingsSection>

        {/* Notifications (UI-only: no push endpoint on backend) */}
        <SettingsSection
          icon={Bell}
          title="Dirty-room alerts"
          description="Show a notification when a room is marked dirty."
        >
          <label className="flex cursor-pointer items-center gap-3">
            <div
              role="switch"
              aria-checked={notifEnabled}
              onClick={handleNotifToggle}
              onKeyDown={(e) => e.key === "Enter" && handleNotifToggle()}
              tabIndex={0}
              className={
                "relative h-6 w-11 rounded-full transition-colors " +
                (notifEnabled ? "bg-primary" : "bg-border")
              }
            >
              <span
                className={
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
                  (notifEnabled ? "translate-x-5" : "translate-x-0.5")
                }
              />
            </div>
            <span className="text-sm text-text-primary">
              {notifEnabled ? "On" : "Off"}
            </span>
          </label>
          <p className="mt-2 text-xs text-text-disabled">
            ⚠️ Frontend-only — alerts appear only within this session.
          </p>
        </SettingsSection>

        {/* Security (stub) */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Password and authentication settings."
        >
          <Button variant="secondary" size="sm" onClick={() => toast.info("Backend auth is not wired up yet.")}>
            Change password
          </Button>
          <p className="mt-2 text-xs text-text-disabled">
            ⚠️ The backend doesn&apos;t expose auth endpoints yet. Password
            management will be available once auth is added.
          </p>
        </SettingsSection>

        {/* System info */}
        <SettingsSection
          icon={Database}
          title="System"
          description="Backend and model information."
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Backend status</dt>
              <dd className="font-medium text-success">
                {health ? "Online" : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">AI model</dt>
              <dd className="text-text-primary">
                {health?.mock_mode === true
                  ? "Mock mode (no model loaded)"
                  : health?.mock_mode === false
                  ? "MobileNetV2 loaded"
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Score range</dt>
              <dd className="font-mono text-text-primary">0 – 100</dd>
            </div>
          </dl>
        </SettingsSection>

        {/* About */}
        <SettingsSection
          icon={Info}
          title="About CleanVision"
          description="Version and license information."
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Version</dt>
              <dd className="font-mono text-text-primary">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">License</dt>
              <dd className="text-text-primary">MIT</dd>
            </div>
          </dl>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div>
          <p className="font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4 pl-12">{children}</div>
    </div>
  );
}
