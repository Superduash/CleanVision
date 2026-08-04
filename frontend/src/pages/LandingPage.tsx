import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera, History, BellRing, ShieldCheck, ArrowRight,
  TrendingUp, Users, Award, CheckCircle, Plus
} from "lucide-react";
import { Button } from "@/components/Button";

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
    accent: "text-primary border-primary/20 shadow-primary/5",
  },
  {
    step: "02",
    title: "Scan it anytime",
    body: "Upload a new photo anytime. CleanVision's AI compares it against the baseline in real time.",
    accent: "text-accent border-accent/20 shadow-accent/5",
  },
  {
    step: "03",
    title: "Act on the result",
    body: "Get a score and a status. Anything below clean shows on the dashboard until it's resolved.",
    accent: "text-success border-success/20 shadow-success/5",
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
    <div className="flex-1">

      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative overflow-hidden pt-8 lg:pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-up z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                AI-powered cleanliness monitoring
              </span>

              <h1 className="mt-8 font-display text-5xl font-extrabold tracking-tight text-text-primary sm:text-6xl md:text-7xl lg:text-[5rem] lg:leading-[1.1]">
                <span className="block text-text-muted">Validate cleanliness.</span>
                <span className="text-text-primary">
                  Instantly.
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-text-muted">
                One photo against a baseline turns &ldquo;does this room look
                clean?&rdquo; into a precise score, a status, and an immutable record — before it
                becomes an incident report.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="h-14 px-8 text-base">
                    Get Started <ArrowRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="secondary" size="lg" className="h-14 px-8 text-base">
                    See how it works
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── STATS ──────────────────── */}
      <section className="border-y border-border bg-surface/50 backdrop-blur-sm mt-16">
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
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface transition-colors">
                <Icon className="h-6 w-6 text-text-primary" strokeWidth={2.25} />
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
                className={`group relative overflow-hidden rounded-2xl border bg-surface p-8 transition-all duration-300 hover:shadow-raised hover:-translate-y-1 ${step.accent}`}
              >
                <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10 blur-2xl ${step.accent.split(' ')[0].replace('text-', 'bg-')}`} />
                <span className={`font-mono text-5xl font-black opacity-30 select-none ${step.accent.split(' ')[0]}`}>
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
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-20 text-center text-bg shadow-2xl">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to elevate your facility standards?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-bg/80">
              Deploy CleanVision in minutes. Stop guessing and start validating with AI-powered analytics.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-bg text-ink hover:bg-bg/90 active:bg-bg border-transparent hover:shadow-none">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-bg hover:bg-bg/10">
                  Log in
                </Button>
              </Link>
            </div>
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

    </div>
  );
}
