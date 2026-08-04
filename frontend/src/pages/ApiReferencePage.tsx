export function ApiReferencePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:py-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">API Reference</h1>
        <p className="mt-4 text-lg text-text-muted">Integrate CleanVision directly into your internal tools.</p>
      </div>
      
      <div className="mt-16 space-y-8">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <div className="flex items-center gap-4">
            <span className="rounded-md bg-success/20 px-3 py-1 font-mono text-sm font-bold text-success">GET</span>
            <code className="font-mono text-text-primary">/api/rooms</code>
          </div>
          <p className="mt-4 text-sm text-text-muted">Retrieves a paginated list of all active rooms in the facility.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <div className="flex items-center gap-4">
            <span className="rounded-md bg-accent/20 px-3 py-1 font-mono text-sm font-bold text-accent">POST</span>
            <code className="font-mono text-text-primary">/api/rooms/:id/baseline</code>
          </div>
          <p className="mt-4 text-sm text-text-muted">Uploads a multipart form data baseline image for the specified room ID.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-raised">
          <div className="flex items-center gap-4">
            <span className="rounded-md bg-accent/20 px-3 py-1 font-mono text-sm font-bold text-accent">POST</span>
            <code className="font-mono text-text-primary">/api/scan</code>
          </div>
          <p className="mt-4 text-sm text-text-muted">Upload a photo to be scored against the room's baseline. Returns a JSON payload containing the 0-100 score and status.</p>
        </div>
      </div>
    </div>
  );
}
