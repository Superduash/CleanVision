import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: session?.name ?? "",
      email: session?.email ?? "",
    },
  });

  // ⚠️ Frontend-only — no PATCH /api/profile on backend yet
  const onSubmit = (_values: FormValues) => {
    setSaved(true);
    toast.success("Profile updated in this session.");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
    toast.success("Signed out successfully.");
  };

  const initials = (session?.name ?? "G")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-lg px-6 py-8 page-enter">
      <h1 className="text-2xl font-semibold text-text-primary">Profile</h1>
      <p className="mt-1 text-sm text-text-muted">
        Manage your account details.
      </p>

      {/* Avatar */}
      <div className="mt-8 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-text-primary">
            {session?.name ?? "Guest"}
          </p>
          <p className="text-sm text-text-muted">{session?.email}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 rounded-xl border border-border bg-surface p-6 space-y-5"
        noValidate
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <User className="h-4 w-4 text-primary" />
          Account details
        </div>

        <Input
          label="Full name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email address"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <p className="rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 text-xs text-warning">
          ⚠️ Profile editing is frontend-only — the backend doesn&apos;t expose
          a profile update endpoint yet.
        </p>

        <Button
          type="submit"
          disabled={!isDirty || saved}
          className="w-full"
        >
          {saved ? "Saved!" : "Save changes"}
        </Button>
      </form>

      {/* Session info */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Mail className="h-4 w-4 text-primary" />
          Session
        </div>
        <p className="mt-3 text-sm text-text-muted">
          You are signed in as <span className="font-medium text-text-primary">{session?.email}</span>.
          Auth is currently local-session only.
        </p>
        <Button
          variant="danger"
          className="mt-4 w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
