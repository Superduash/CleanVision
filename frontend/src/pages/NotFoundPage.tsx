import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutGrid, ScanLine } from "lucide-react";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center page-enter">
      <Logo className="mb-8" />

      {/* Large 404 */}
      <div className="relative select-none">
        <p className="font-display text-[120px] font-bold leading-none text-border sm:text-[160px]">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-surface px-6 py-3 shadow-raised">
            <p className="font-semibold text-text-primary">Page not found</p>
          </div>
        </div>
      </div>

      <p className="mt-6 max-w-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Check the URL, or head back to the dashboard.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
        <Link to="/dashboard">
          <Button>
            <LayoutGrid className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
        <Link to="/dashboard/scan">
          <Button variant="ghost">
            <ScanLine className="h-4 w-4" /> New scan
          </Button>
        </Link>
      </div>
    </div>
  );
}
