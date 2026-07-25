import { Construction } from "lucide-react";

/**
 * Nav destinations for Scan / History / Settings exist so the sidebar and
 * bottom nav are fully wired and clickable in Phase 1, but the pages
 * themselves — with full backend integration — are built out in Phase 2
 * (see p2.md). This is an honest "not built yet" state, not a broken link.
 */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
        <Construction className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-text-muted">
        This page is built out in Phase 2, with full backend integration and the same design system as the
        rest of the app.
      </p>
    </div>
  );
}
