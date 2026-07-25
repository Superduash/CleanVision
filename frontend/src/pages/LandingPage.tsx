import { Link } from "react-router-dom";
import {
  Camera, History, BellRing, ShieldCheck, ArrowRight,
  TrendingUp, Users, Award, CheckCircle,
} from "lucide-react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/Button";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusBadge } from "@/components/StatusBadge";

const FEATURES = [
  {
    icon: Camera,
    title: "Baseline in one photo",
    body: "Register a room with a single reference photo of it clean. Every future scan is measured against that baseline, not a generic standard.",
  },
  {
    icon: ShieldCheck,
    title: "AI score in seconds",
    body: "Upload a photo from the room and get a 0–100 cleanliness score back immediately, with a clear clean / needs attention / dirty read.",
  },
  {
    icon: BellRing,
    title: "Problem areas surface first",
    body: "The dashboard sorts by risk, not by room number, so the rooms that need attention right now are what staff see first.",
  },
  {
    icon: History,
    title: "Full audit trail",
    body: "Every scan is logged. Pull up a room's full history for an audit, an incident review, or a trend over the week.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Register the room",
    body: "Add its name and block, then upload a photo of it clean — that's your baseline reference.",
    color: "from-primary/20 to-accent/10",
  },
  {
    step: "02",
    title: "Scan it anytime",
    body: "Upload a new photo anytime. CleanVision's AI compares it against the baseline in real time.",
    color: "from-accent/20 to-primary/10",
  },
  {
    step: "03",
    title: "Act on the result",
    body: "Get a score and a status. Anything below clean shows on the dashboard until it's resolved.",
    color: "from-success/20 to-primary/10",
  },
];

const STATS = [
  { icon: TrendingUp, value: "0–100", label: "Cleanliness score" },
  { icon: Users, value: "Multi-block", label: "Facility support" },
  { icon: Award, value: "Real-time", label: "AI analysis" },
  { icon: CheckCircle, value: "Full audit", label: "Scan history" },
];

const FAQS = [
  {
    q: "What happens before we have a trained model?",
    a: "CleanVision runs in mock mode, returning a stable score for each photo so every feature — rooms, scans, history, alerts — works end to end. Drop in a trained model later with no code changes.",
  },
  {
    q: "What counts as clean vs. dirty?",
    a: "70–100 is clean, 40–69 is needs attention, and below 40 is dirty. The dashboard flags anything under clean automatically.",
  },
  {
    q: "Does this replace an inspection process?",
    a: "No — it's a first pass that tells staff where to look. A low score is a prompt to check the room, not a final verdict.",
  },
  {
    q: "Who can use CleanVision?",
    a: "Admins (quality assurance managers) have full control: adding rooms, viewing reports, managing baselines. Patients and staff have a read-only view of room statuses.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicNavbar />

      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--color-accent)) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              AI-powered hospital cleanliness monitoring
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-text-primary lg:text-6xl">
              Scan the room.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Know it&apos;s clean.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-text-muted">
              One photo against a baseline turns &ldquo;does this room look
              clean?&rdquo; into a score, a status, and a record — before it
              becomes an incident report.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="shadow-glow">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg">
                  See how it works
                </Button>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-text-muted">
              {["No model required to start", "Full audit trail", "Free to deploy"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero card */}
          <div className="relative mx-auto w-full max-w-sm">
            {/* Glow ring behind card */}
            <div
              aria-hidden
              className="absolute inset-0 -m-4 rounded-3xl opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse, rgb(var(--color-accent)) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <div className="relative flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-8 shadow-raised">
              <ScoreRing score={92} status="clean" size="lg" animate />
              <StatusBadge status="clean" />
              <p className="text-center text-sm text-text-muted">
                Room 214 · East Wing
                <br />
                <span className="text-text-disabled">Scanned just now</span>
              </p>
              {/* Mini history preview */}
              <div className="w-full space-y-2">
                {([
                  { score: 92, label: "Today 09:00", s: "clean" as const },
                  { score: 57, label: "Yesterday 14:30", s: "needs_attention" as const },
                  { score: 88, label: "2 days ago 11:15", s: "clean" as const },
                ]).map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-xs"
                  >
                    <span className="text-text-muted">{row.label}</span>
                    <StatusBadge status={row.s} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── STATS ──────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 py-10 sm:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-4 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
              <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── FEATURES ──────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-text-primary lg:text-4xl">
            Built around one photo, one score, one record.
          </h2>
          <p className="mt-4 text-text-muted">
            Everything you need to move from guesswork to a documented, AI-verified cleanliness programme.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-raised"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10">
                <Icon className="h-5 w-5 text-primary" strokeWidth={2.25} />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── HOW IT WORKS ──────────────────── */}
      <section id="how-it-works" className="bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-text-primary lg:text-4xl">How it works</h2>
            <p className="mt-4 text-text-muted">
              Up and running in three steps. No specialist setup, no training needed to start.
            </p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${step.color} p-8`}
              >
                <span className="font-mono text-5xl font-black text-text-primary/10 select-none">
                  {step.step}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── CTA ──────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent px-8 py-16 text-center text-white shadow-raised">
          {/* Decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10"
          />
          <h2 className="relative text-3xl font-bold lg:text-4xl">
            Set up your first room in under two minutes.
          </h2>
          <p className="relative mt-4 text-white/70">
            No credit card. No model required. Works with mock mode out of the box.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="border-0 bg-white text-blue-600 shadow-raised hover:bg-white/90"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────── FAQ ──────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-3xl font-bold text-text-primary">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-text-primary marker:hidden [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bg text-text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ──────────────────── FOOTER ──────────────────── */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Link to="/">
            <div className="inline-flex items-center gap-2 font-display font-semibold">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </span>
              <span className="text-lg tracking-tight text-text-primary">CleanVision</span>
            </div>
          </Link>
          <nav className="flex gap-6 text-sm text-text-muted">
            <a href="#features" className="hover:text-text-primary">Features</a>
            <a href="#how-it-works" className="hover:text-text-primary">How it works</a>
            <a href="#faq" className="hover:text-text-primary">FAQ</a>
            <Link to="/login" className="hover:text-text-primary">Log in</Link>
          </nav>
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} CleanVision · MIT</p>
        </div>
      </footer>
    </div>
  );
}
