import { Link } from "react-router-dom";

export function Footer() {
  return (
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
            <Link to="/features" className="transition-colors hover:text-primary">Features</Link>
            <Link to="/features#how-it-works" className="transition-colors hover:text-primary">How it works</Link>
            <Link to="/features#faq" className="transition-colors hover:text-primary">FAQ</Link>
          </nav>
        </div>

        {/* Resources */}
        <div className="flex flex-col gap-4">
          <h4 className="font-semibold text-text-primary">Resources</h4>
          <nav className="flex flex-col gap-3 text-sm text-text-muted">
            <Link to="/docs" className="transition-colors hover:text-primary">Documentation</Link>
            <Link to="/api" className="transition-colors hover:text-primary">API Reference</Link>
            <Link to="/contact" className="transition-colors hover:text-primary">Contact Support</Link>
          </nav>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4">
          <h4 className="font-semibold text-text-primary">Legal</h4>
          <nav className="flex flex-col gap-3 text-sm text-text-muted">
            <Link to="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
            <span className="text-text-muted">Enterprise License</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between border-t border-border/50 px-6 pt-8 sm:flex-row">
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} CleanVision. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
