import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { User, Mail, ShieldCheck, UserCheck, LogOut, Save } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function ProfilePage() {
  const { session, signOut } = useAuth();
  const [name, setName] = useState(session?.name ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = session?.role === "admin";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateProfile(user, { displayName: name.trim() });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <User className="h-6 w-6 text-primary" /> Profile
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          View and manage your account profile details.
        </p>
      </div>

      {/* Profile Card Header */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card flex items-center gap-5">
        {session?.photoURL ? (
          <img
            src={session.photoURL}
            alt={session.name}
            className="h-16 w-16 rounded-full border-2 border-primary object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary border-2 border-primary/20">
            {(session?.name?.[0] ?? "U").toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-text-primary truncate">{session?.name}</h2>
          <p className="text-sm text-text-muted truncate">{session?.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-primary border border-primary/20">
            {isAdmin ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" /> Admin / Staff
              </>
            ) : (
              <>
                <UserCheck className="h-3.5 w-3.5" /> Patient / Guest
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4">
        <h3 className="font-semibold text-text-primary">Personal Details</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <div>
            <label className="text-sm font-medium text-text-primary">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                disabled
                value={session?.email ?? ""}
                className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-4 text-sm text-text-muted outline-none cursor-not-allowed opacity-80"
              />
            </div>
            <p className="mt-1 text-[11px] text-text-disabled">Email address is managed by your provider.</p>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </form>
      </div>

      {/* Sign Out */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">Sign Out</p>
          <p className="text-xs text-text-muted">Sign out of your session on this device</p>
        </div>
        <Button variant="secondary" onClick={signOut} className="gap-2 text-danger hover:bg-danger-bg border-danger/30">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
