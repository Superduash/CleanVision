export function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:py-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">Documentation</h1>
        <p className="mt-4 text-lg text-text-muted">Learn how to deploy and configure CleanVision.</p>
      </div>
      
      <div className="mt-16 prose prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-text-primary">Getting Started</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          CleanVision is designed for frictionless deployment across your facility. 
          To get started, navigate to the Dashboard and create your first room. 
          You will need to upload a baseline image that represents the room in a perfectly clean state.
        </p>
        
        <h2 className="mt-8 text-2xl font-bold text-text-primary">Mock Mode vs AI Mode</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          CleanVision runs in Mock Mode by default, generating stable deterministic hashes for your uploads. 
          Once you train the MobileNetV2 model and provide the .h5 weights, the system will automatically transition to AI mode with no configuration changes required.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <h3 className="font-bold text-text-primary">Need help?</h3>
          <p className="mt-2 text-sm text-text-muted">Contact our support team for enterprise onboarding and custom model training.</p>
        </div>
      </div>
    </div>
  );
}
