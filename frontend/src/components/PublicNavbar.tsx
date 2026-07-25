import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/#features", label: "Features" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#faq", label: "FAQ" },
];

export function PublicNavbar() {
  const { theme, toggle } = useTheme();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [location]);

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
          "fixed inset-x-0 top-0 z-50 bg-bg/90 backdrop-blur-md transition-all duration-200",
          scrolled ? "border-b border-border shadow-card" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo + Home */}
          <Link to="/" aria-label="CleanVision home">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Site navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 lg:flex">
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
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Get started</Button>
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

        {/* Mobile menu */}
        {isOpen && (
          <div className="border-t border-border bg-surface px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-bg hover:text-text-primary"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {session ? (
                  <Link to="/dashboard">
                    <Button className="w-full" size="sm">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="secondary" className="w-full" size="sm">Log in</Button>
                    </Link>
                    <Link to="/signup">
                      <Button className="w-full" size="sm">Get started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      {/* Spacer so content isn't hidden behind fixed navbar */}
      <div className="h-16" />
    </>
  );
}
