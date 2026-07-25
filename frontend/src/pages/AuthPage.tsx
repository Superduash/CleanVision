import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

const signupSchema = z.object({
  name: z.string().min(1, "Enter your name"),
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

interface DemoAccount {
  label: string;
  sublabel: string;
  email: string;
  password: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Patient / Staff",
    sublabel: "Read-only room status view",
    email: "demo@gmail.com",
    password: "demo",
  },
  {
    label: "Admin / QA Management",
    sublabel: "Full control — scans, reports, rooms",
    email: "admin@gmail.com",
    password: "admin",
  },
];

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const isLogin = mode === "login";

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (values: LoginValues) => {
    setIsSubmitting(true);
    try {
      await signIn(values.email, values.password);
      toast.success("Signed in successfully");
      navigate(
        (location.state as { from?: string } | null)?.from ?? "/dashboard",
        { replace: true },
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't sign in. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignup = async (values: SignupValues) => {
    setIsSubmitting(true);
    try {
      await signUp(values.name, values.email, values.password);
      toast.success("Account created — welcome!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Couldn't create your account. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (account: DemoAccount) => {
    loginForm.setValue("email", account.email);
    loginForm.setValue("password", account.password);
    loginForm.clearErrors();
  };

  return (
    <div className="min-h-screen bg-bg">
      <PublicNavbar />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2">
        {/* Left: branding panel */}
        <div className="hidden lg:block">
          <div className="flex flex-col items-start gap-8">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">
                Hospital-grade cleanliness,
                <br />
                verified in seconds.
              </h2>
              <p className="mt-4 max-w-sm text-text-muted">
                AI-powered room scanning that turns a photo into a score, a
                status, and an audit record — in one click.
              </p>
            </div>

            {/* Live demo card */}
            <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-raised">
              <ScoreRing score={88} status="clean" size="md" animate />
              <StatusBadge status="clean" />
              <p className="text-center text-xs text-text-muted">
                Room 214 · Block B · East Wing
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                "One photo → instant AI score",
                "Full scan history & audit trail",
                "Role-based access (Admin / Patient)",
              ].map((t) => (
                <p key={t} className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success/20 text-success text-[10px] font-bold">
                    ✓
                  </span>
                  {t}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-xl bg-bg p-1">
            <Link
              to="/login"
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all",
                isLogin
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all",
                !isLogin
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              Sign up
            </Link>
          </div>

          {isLogin ? (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h1 className="text-xl font-bold text-text-primary">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                Log in to access your CleanVision dashboard.
              </p>

              <form
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="mt-6 flex flex-col gap-4"
                noValidate
              >
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@hospital.com"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register("email")}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register("password")}
                />
                <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full" size="lg">
                  Log in
                </Button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6">
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <div className="h-px flex-1 bg-border" />
                  <span className="font-medium">Demo accounts</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillDemo(account)}
                      className="group flex items-center justify-between rounded-xl border border-border bg-bg px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-surface hover:shadow-card"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {account.label}
                        </p>
                        <p className="text-xs text-text-muted">{account.sublabel}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-text-disabled">
                          {account.email} · pw:{" "}
                          <span className="text-text-muted">{account.password}</span>
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Fill →
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-text-muted">
                No account?{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                  Sign up free
                </Link>
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <h1 className="text-xl font-bold text-text-primary">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                Get started with CleanVision in seconds.
              </p>

              <form
                onSubmit={signupForm.handleSubmit(onSignup)}
                className="mt-6 flex flex-col gap-4"
                noValidate
              >
                <Input
                  label="Full name"
                  autoComplete="name"
                  placeholder="Dr. Jane Smith"
                  error={signupForm.formState.errors.name?.message}
                  {...signupForm.register("name")}
                />
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@hospital.com"
                  error={signupForm.formState.errors.email?.message}
                  {...signupForm.register("email")}
                />
                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  error={signupForm.formState.errors.password?.message}
                  {...signupForm.register("password")}
                />
                <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full" size="lg">
                  Create account
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
