import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Settings,
  Sun,
  Moon,
  Lock,
  Bell,
  Trash2,
  KeyRound,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { cn } from "@/lib/utils";

// ── Password Change Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error("User session not found.");
      return;
    }

    setIsLoading(true);
    try {
      // Reauthenticate user before changing password
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      toast.success("Password updated successfully!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised">
        <button onClick={onClose} className="absolute right-4 top-4 text-text-disabled hover:text-text-muted">
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-text-primary">Change Password</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Min 8 characters"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          <div className="mt-5 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              Update
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
        toast.success("Account deleted.");
        await signOut();
      } catch {
        toast.error("Please re-authenticate before deleting your account.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your account security, interface theme, and preferences.
        </p>
      </div>

      {/* Theme Section */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          {theme === "dark" ? <Moon className="h-4 w-4 text-accent" /> : <Sun className="h-4 w-4 text-warning" />}
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Interface Theme</p>
            <p className="text-xs text-text-muted">
              Current: <strong className="capitalize">{theme} mode</strong> (Light by default)
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" /> Security
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Password</p>
            <p className="text-xs text-text-muted">Update your account password</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)} className="gap-2">
            <KeyRound className="h-4 w-4" /> Change Password
          </Button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Scan Alerts</p>
            <p className="text-xs text-text-muted">Receive alerts when rooms score low on cleanliness</p>
          </div>
          <button
            onClick={() => setNotificationsEnabled((v) => !v)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
              notificationsEnabled ? "bg-primary" : "bg-border"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                notificationsEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-danger/30 bg-danger-bg/20 p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" /> Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Delete Account</p>
            <p className="text-xs text-text-muted">Permanently remove your account and credentials</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDeleteAccount} className="border-danger/40 text-danger hover:bg-danger-bg gap-2">
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
