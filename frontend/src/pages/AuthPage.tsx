import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight, KeyRound, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/Button";
import { PublicNavbar } from "@/components/PublicNavbar";
import { BootSplash } from "@/components/BootSplash";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AuthInput({
  label,
  icon: Icon,
  type = "text",
  error,
  rightElement,
  ...props
}: {
  label: string;
  icon: React.ElementType;
  type?: string;
  error?: string;
  rightElement?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase text-text-muted">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
        <input
          type={type}
          className={cn(
            "h-11 w-full rounded-xl border bg-bg pl-10 pr-4 text-sm text-text-primary outline-none transition-all",
            "placeholder:text-text-disabled focus:border-primary focus:bg-surface focus:shadow-focus",
            error ? "border-danger bg-danger-bg/30" : "border-border hover:border-text-disabled"
          )}
          {...props}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function AuthPage() {
  const { session, isLoading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showDemoPicker = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (isLoading) {
    return <BootSplash message="Verifying security credentials..." />;
  }

  if (session) {
    const roleHomeMap: Record<string, string> = {
      admin: "/admin",
      manager: "/manager",
      inspector: "/inspector",
    };
    return <Navigate to={roleHomeMap[session.role] || "/dashboard"} replace />;
  }

  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onLogin = async (values: LoginValues) => {
    setIsSubmitting(true);
    try {
      await signIn(values.email, values.password);
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't sign in. Try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (email: string, role: string) => {
    form.setValue("email", email);
    form.setValue("password", "demo12345");
    toast.info(`Filled ${role} demo credentials`);
  };

  return (
    <div className="min-h-screen bg-bg">
      <PublicNavbar />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 sm:px-6 py-12 page-enter">
        <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-raised space-y-6">
          <div className="text-center space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Staff Portal Access</h1>
            <p className="text-xs text-text-muted">
              Hospital management, inspection, and administration login.
            </p>
          </div>

          {/* Demo Accounts Tap-to-Fill Picker (gated by VITE_SHOW_DEMO_ACCOUNTS) */}
          {showDemoPicker && (
            <div className="rounded-xl border border-warning/30 bg-warning-bg/40 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-warning uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Tap-to-Fill Demo Accounts
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("admin@hospital.com", "Admin")}
                  className="rounded-lg border border-warning/30 bg-surface px-2 py-1.5 text-center text-xs font-semibold text-text-primary hover:border-warning"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("manager@hospital.com", "Manager")}
                  className="rounded-lg border border-warning/30 bg-surface px-2 py-1.5 text-center text-xs font-semibold text-text-primary hover:border-warning"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("inspector@hospital.com", "Inspector")}
                  className="rounded-lg border border-warning/30 bg-surface px-2 py-1.5 text-center text-xs font-semibold text-text-primary hover:border-warning"
                >
                  Inspector
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4" noValidate>
            <AuthInput
              label="Staff Email"
              icon={Mail}
              type="email"
              placeholder="staff@hospital.org"
              error={form.formState.errors.email?.message}
              {...form.register("email")}
            />
            <AuthInput
              label="Password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={form.formState.errors.password?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-text-disabled hover:text-text-muted"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...form.register("password")}
            />

            <Button type="submit" isLoading={isSubmitting} className="w-full py-3" size="lg">
              Sign In to Staff Portal <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Google Login Option */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-text-disabled">Or</span></div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg py-2.5 text-xs font-semibold text-text-primary hover:bg-highlight transition-colors"
          >
            <GoogleIcon className="h-4 w-4" /> Continue with Google
          </button>

          <p className="text-center text-xs text-text-disabled">
            Staff accounts are provisioned by hospital management.
          </p>
        </div>
      </div>
    </div>
  );
}
