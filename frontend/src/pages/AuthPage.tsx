import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/Button";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ScoreRing } from "@/components/ScoreRing";

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

const forgotSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

// ── Google SVG Icon ───────────────────────────────────────────────────────────

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

// ── Floating Label Input ──────────────────────────────────────────────────────

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
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
        <input
          type={type}
          className={cn(
            "h-11 w-full rounded-xl border bg-bg pl-10 pr-4 text-sm text-text-primary outline-none transition-all",
            "placeholder:text-text-disabled",
            "focus:border-primary focus:bg-surface focus:shadow-focus",
            error
              ? "border-danger bg-danger-bg/30"
              : "border-border hover:border-text-disabled"
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { session, signIn, signUp, signInWithGoogle, sendPasswordReset } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (session) return <Navigate to="/dashboard" replace />;

  const isLogin = mode === "login";

  // Forms
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });
  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  // Handlers
  const onLogin = async (values: LoginValues) => {
    setIsSubmitting(true);
    try {
      await signIn(values.email, values.password);
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Couldn't sign in. Try again.";
      // Make Firebase error messages friendlier
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        toast.error("Incorrect email or password.");
      } else if (msg.includes("too-many-requests")) {
        toast.error("Too many attempts. Please wait before trying again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignup = async (values: SignupValues) => {
    setIsSubmitting(true);
    try {
      await signUp(values.name, values.email, values.password);
      toast.success("Account created — welcome to CleanVision!");
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Couldn't create account.";
      if (msg.includes("email-already-in-use")) {
        toast.error("An account with this email already exists. Sign in instead.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("popup-closed-by-user") && !msg.includes("cancelled")) {
        toast.error("Google sign-in failed. Try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onForgotPassword = async (values: ForgotValues) => {
    setIsSubmitting(true);
    try {
      await sendPasswordReset(values.email);
      toast.success("Reset link sent! Check your inbox.");
      setShowForgot(false);
    } catch {
      toast.error("Couldn't send reset email. Check the address and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Forgot Password overlay ───────────────────────────────────────────────

  if (showForgot) {
    return (
      <div className="min-h-screen bg-bg">
        <PublicNavbar />
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
          <div className="w-full animate-scale-in rounded-2xl border border-border bg-surface p-8 shadow-raised">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form
              onSubmit={forgotForm.handleSubmit(onForgotPassword)}
              className="mt-6 flex flex-col gap-4"
              noValidate
            >
              <AuthInput
                label="Email address"
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="you@hospital.com"
                error={forgotForm.formState.errors.email?.message}
                {...forgotForm.register("email")}
              />
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full"
                size="lg"
              >
                Send reset link
              </Button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-center text-sm text-text-muted hover:text-text-primary"
              >
                ← Back to sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Main auth page ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg">
      <PublicNavbar />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-16 px-6 py-12 lg:grid-cols-2">
        {/* ── Left: branding panel ───────────────────────────────────── */}
        <div className="hidden lg:flex lg:flex-col lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="dot-pulse bg-primary" />
              Hospital-grade monitoring
            </div>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-text-primary">
              Cleanliness you can
              <br />
              <span className="text-primary">measure</span> and{" "}
              <span className="text-accent">trust</span>.
            </h2>
            <p className="mt-4 max-w-sm text-base text-text-muted leading-relaxed">
              AI-powered room scanning that turns a photo into a score, a
              status, and an audit trail — in seconds.
            </p>
          </div>

          {/* Live demo card */}
          <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-6 shadow-card">
            <ScoreRing score={88} status="clean" size="md" animate />
            <div>
              <p className="font-semibold text-text-primary">Room 214 · Block B</p>
              <p className="mt-0.5 text-sm text-text-muted">East Wing · Scanned just now</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="dot-pulse bg-success" />
                Meets cleanliness standards
              </p>
            </div>
          </div>

          {/* Feature list */}
          <ul className="flex flex-col gap-3">
            {[
              "One photo → instant AI cleanliness score",
              "Full scan history & tamper-proof audit trail",
              "Role-based access (Admin / Patient portal)",
              "Real-time alerts for dirty or at-risk rooms",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-text-muted">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right: form card ───────────────────────────────────────── */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-card">
            <Link
              to="/login"
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all",
                isLogin
                  ? "bg-primary text-white shadow-primary-glow"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all",
                !isLogin
                  ? "bg-primary text-white shadow-primary-glow"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              Create account
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-7 shadow-raised animate-fade-up">
            {isLogin ? (
              <>
                <h1 className="text-2xl font-bold text-text-primary">
                  Welcome back
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  Sign in to your CleanVision dashboard.
                </p>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-text-primary transition-all hover:border-primary/30 hover:bg-surface hover:shadow-card disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-text-disabled">
                    or sign in with email
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Login form */}
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <AuthInput
                    label="Email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="you@hospital.com"
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register("email")}
                  />
                  <AuthInput
                    label="Password"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    error={loginForm.formState.errors.password?.message}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-text-disabled hover:text-text-muted"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    {...loginForm.register("password")}
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    Sign in <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Quick Demo Accounts for Development */}
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Development Quick Fill
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loginForm.setValue("email", "demo@gmail.com");
                        loginForm.setValue("password", "demo1234");
                      }}
                      className="rounded-xl border border-border bg-bg p-2.5 text-left hover:border-primary/40 hover:bg-highlight transition-all"
                    >
                      <p className="text-xs font-bold text-text-primary">Patient Demo</p>
                      <p className="text-[10px] text-text-muted truncate">demo@gmail.com</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        loginForm.setValue("email", "aashwinsuperdu@gmail.com");
                        loginForm.setValue("password", "admin1234");
                      }}
                      className="rounded-xl border border-border bg-bg p-2.5 text-left hover:border-primary/40 hover:bg-highlight transition-all"
                    >
                      <p className="text-xs font-bold text-primary">Admin Super</p>
                      <p className="text-[10px] text-text-muted truncate">aashwinsuperdu@gmail.com</p>
                    </button>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-text-muted">
                  No account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-primary hover:underline"
                  >
                    Create one free
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-text-primary">
                  Create account
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  Get started with CleanVision in seconds.
                </p>

                {/* Google Sign-Up */}
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-semibold text-text-primary transition-all hover:border-primary/30 hover:bg-surface hover:shadow-card disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-text-disabled">
                    or sign up with email
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Signup form */}
                <form
                  onSubmit={signupForm.handleSubmit(onSignup)}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  <AuthInput
                    label="Full name"
                    icon={User}
                    autoComplete="name"
                    placeholder="Dr. Jane Smith"
                    error={signupForm.formState.errors.name?.message}
                    {...signupForm.register("name")}
                  />
                  <AuthInput
                    label="Email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="you@hospital.com"
                    error={signupForm.formState.errors.email?.message}
                    {...signupForm.register("email")}
                  />
                  <AuthInput
                    label="Password"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    error={signupForm.formState.errors.password?.message}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-text-disabled hover:text-text-muted"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    {...signupForm.register("password")}
                  />

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="mt-1 w-full"
                    size="lg"
                  >
                    Create account <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                <p className="mt-5 text-center text-xs text-text-muted">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
