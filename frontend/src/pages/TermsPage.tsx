export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:py-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-lg text-text-muted">Last updated: August 2026</p>
      </div>
      
      <div className="mt-16 prose prose-invert max-w-none">
        <p className="text-text-muted leading-relaxed">
          These Terms of Service govern your use of the CleanVision platform.
        </p>

        <h2 className="mt-8 text-2xl font-bold text-text-primary">Acceptance of Terms</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          By accessing or using the CleanVision application, you agree to be bound by these Terms. If you do not agree, you may not use the platform.
        </p>
        
        <h2 className="mt-8 text-2xl font-bold text-text-primary">Use License</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          CleanVision is provided under an MIT License for the open-source components. However, enterprise usage or managed hosting services may have separate agreements governing SLAs and support.
        </p>

        <h2 className="mt-8 text-2xl font-bold text-text-primary">Limitations of Liability</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          CleanVision's AI model provides an automated assessment and does not constitute a legal or regulatory certification of sanitation. The software is provided "as is", without warranty of any kind.
        </p>
      </div>
    </div>
  );
}
