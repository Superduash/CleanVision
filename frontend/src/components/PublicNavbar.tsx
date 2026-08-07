import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/#how-it-works", label: "How it Works" },
  { to: "/#faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  const { theme, toggle } = useTheme();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { 
    setIsOpen(false); 
    document.body.style.overflow = "auto";
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // Add blur/shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 bg-bg/80 backdrop-blur-xl transition-all duration-300",
          scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 lg:h-[72px] max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex flex-1 items-center justify-start">
            <Link to="/" aria-label="CleanVision home">
              <Logo />
            </Link>
          </div>

          {/* Desktop nav (Centered) */}
          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex" aria-label="Site navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA (Right aligned) */}
          <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
            <button
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {session ? (
              <Link to="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/staff/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/staff/login">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-text-muted hover:bg-bg"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="rounded-lg p-2 text-text-muted hover:bg-bg"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Logo />
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 p-6 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-text-muted hover:bg-bg hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          
          <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-border">
            {session ? (
              <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                <Button className="w-full" size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/staff/login" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" className="w-full" size="lg">Log in</Button>
                </Link>
                <Link to="/staff/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full" size="lg">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Spacer so content isn't hidden behind fixed navbar */}
      <div className="h-16 lg:h-[72px]" />
    </>
  );
}
