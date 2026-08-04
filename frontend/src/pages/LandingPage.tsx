import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera, History, BellRing, ShieldCheck, ArrowRight,
  TrendingUp, Users, Award, CheckCircle, Plus, Github
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

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="group border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-6 text-left text-base font-medium text-text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg px-2"
        aria-expanded={isOpen}
      >
        <span>{q}</span>
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-raised text-text-muted transition-transform duration-300",
            isOpen && "rotate-45 bg-primary/10 text-primary"
          )}
        >
          <Plus className="h-4 w-4" />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out px-2",
          isOpen ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] pb-0 opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-text-muted">{a}</p>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicNavbar />

      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative overflow-hidden pt-8 lg:pt-16">
        {/* Decorative gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20 lg:opacity-30 mix-blend-screen"
          style={{
            background: "radial-gradient(circle, rgb(var(--color-primary)) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-fade-up z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              AI-powered cleanliness monitoring
            </span>

            <h1 className="mt-8 text-5xl font-extrabold leading-[1.08] tracking-tight text-text-primary lg:text-7xl">
              Scan the room.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Know it&apos;s clean.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
              One photo against a baseline turns &ldquo;does this room look
              clean?&rdquo; into a precise score, a status, and an immutable record — before it
              becomes an incident report.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="h-14 px-8 text-base shadow-primary-glow">
                  Get started free <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg" className="h-14 px-8 text-base">
                  See how it works
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 text-sm font-medium text-text-muted">
              {["No model required to start", "Full audit trail", "Free to deploy"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero card */}
          <div className="relative mx-auto w-full max-w-md animate-float lg:max-w-lg z-10">
            {/* Glow ring behind card */}
            <div
              aria-hidden
              className="absolute inset-0 -m-8 rounded-[2.5rem] opacity-30 mix-blend-screen"
              style={{
                background: "radial-gradient(circle, rgb(var(--color-accent)) 0%, transparent 60%)",
                filter: "blur(60px)",
              }}
            />
            <div className="relative flex flex-col items-center gap-6 rounded-3xl border border-border/60 bg-surface/80 backdrop-blur-xl p-10 shadow-raised glass">
              <ScoreRing score={92} status="clean" size="lg" animate />
              <StatusBadge status="clean" />
              <div className="text-center">
                <p className="text-base font-medium text-text-primary">
                  Room 214 · East Wing
                </p>
                <p className="mt-1 text-sm text-text-muted">Scanned just now</p>
              </div>
              {/* Mini history preview */}
              <div className="w-full space-y-2.5 mt-2">
                {([
                  { score: 92, label: "Today 09:00", s: "clean" as const },
                  { score: 57, label: "Yesterday 14:30", s: "needs_attention" as const },
                  { score: 88, label: "2 days ago 11:15", s: "clean" as const },
                ]).map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-surface-raised/50 border border-border/50 px-4 py-3 text-sm transition-colors hover:bg-surface-raised"
                  >
                    <span className="font-medium text-text-muted">{row.label}</span>
                    <StatusBadge status={row.s} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── STATS ──────────────────── */}
      <section className="border-y border-border bg-surface/50 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="group flex flex-col items-center gap-3 px-4 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <Icon className="h-6 w-6 text-primary" strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-3xl font-bold tracking-tight text-text-primary">{value}</p>
                <p className="mt-1 text-sm font-medium text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── FEATURES ──────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
            Built around one photo, one score, one record.
          </h2>
          <p className="mt-4 text-lg text-text-muted leading-relaxed">
            Everything you need to move from guesswork to a documented, AI-verified cleanliness programme.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-raised hover:border-primary/30"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 transition-colors group-hover:from-primary/30 group-hover:to-accent/20">
                <Icon className="h-6 w-6 text-primary" strokeWidth={2.25} />
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-text-primary">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-muted flex-grow">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── HOW IT WORKS ──────────────────── */}
      <section id="how-it-works" className="bg-surface/50 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-text-muted leading-relaxed">
              Up and running in three steps. No specialist setup, no training needed to start.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${step.color} p-8 transition-all duration-300 hover:shadow-raised`}
              >
                <span className="font-mono text-5xl font-black text-text-primary/10 transition-colors group-hover:text-text-primary/20 select-none">
                  {step.step}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── CTA ──────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24 lg:py-32">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-active to-accent px-8 py-20 text-center text-white shadow-2xl">
          {/* Decorative shapes */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl mix-blend-overlay"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl mix-blend-overlay"
          />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-bold tracking-tight lg:text-5xl lg:leading-tight">
            Set up your first room in under two minutes.
          </h2>
          <p className="relative mt-6 mx-auto max-w-xl text-lg text-white/80">
            No credit card. No model required. Works with mock mode out of the box.
          </p>
          <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 border-0 bg-white px-8 text-base !text-primary shadow-xl hover:bg-white/95"
              >
                Get started free <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────── FAQ ──────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Frequently asked questions</h2>
        </div>
        <div className="border-t border-border">
          {FAQS.map(({ q, a }) => (
            <AccordionItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ──────────────────── FOOTER ──────────────────── */}
      <footer className="border-t border-border bg-surface pt-20 pb-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand Col */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <Link to="/" className="inline-block">
              <div className="inline-flex items-center gap-2 font-display font-semibold">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                </span>
                <span className="text-xl tracking-tight text-text-primary">CleanVision</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-text-muted">
              AI-powered cleanliness monitoring for modern healthcare facilities. Move from guesswork to verified standards.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-text-primary">Product</h4>
            <nav className="flex flex-col gap-3 text-sm text-text-muted">
              <a href="#features" className="transition-colors hover:text-primary">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-primary">How it works</a>
              <a href="#faq" className="transition-colors hover:text-primary">FAQ</a>
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-text-primary">Resources</h4>
            <nav className="flex flex-col gap-3 text-sm text-text-muted">
              <a href="#" className="transition-colors hover:text-primary">Documentation</a>
              <a href="#" className="transition-colors hover:text-primary">API Reference</a>
              <a href="#" className="transition-colors hover:text-primary">Contact Support</a>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-text-primary">Legal</h4>
            <nav className="flex flex-col gap-3 text-sm text-text-muted">
              <a href="#" className="transition-colors hover:text-primary">Privacy Policy</a>
              <a href="#" className="transition-colors hover:text-primary">Terms of Service</a>
              <a href="#" className="transition-colors hover:text-primary">MIT License</a>
            </nav>
          </div>
        </div>

        <div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between border-t border-border/50 px-6 pt-8 sm:flex-row">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} CleanVision. All rights reserved.
          </p>
          <div className="mt-4 flex gap-4 sm:mt-0">
            <a href="https://github.com/Superduash/CleanVision" target="_blank" rel="noopener noreferrer" className="text-text-muted transition-colors hover:text-primary">
              <span className="sr-only">GitHub</span>
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
