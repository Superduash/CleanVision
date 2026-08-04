export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:py-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-lg text-text-muted">Last updated: August 2026</p>
      </div>
      
      <div className="mt-16 prose prose-invert max-w-none">
        <p className="text-text-muted leading-relaxed">
          At CleanVision, we take your privacy and data security seriously, especially given the sensitive nature of healthcare facility environments.
        </p>

        <h2 className="mt-8 text-2xl font-bold text-text-primary">Data Collection</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          When using CleanVision, we collect images of rooms for the express purpose of evaluating cleanliness against a baseline. We strongly advise that no Patient Health Information (PHI) or personally identifiable information be captured in these images.
        </p>
        
        <h2 className="mt-8 text-2xl font-bold text-text-primary">Data Retention</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          Images uploaded for scans are temporarily processed and, depending on your configuration, stored in your own infrastructure or cloud bucket to maintain an audit trail. We do not use your facility's images to train our global models without explicit consent.
        </p>

        <h2 className="mt-8 text-2xl font-bold text-text-primary">Security</h2>
        <p className="mt-4 text-text-muted leading-relaxed">
          We implement commercially reasonable technical, administrative, and physical safeguards designed to protect your information from unauthorized access, use, or disclosure.
        </p>
      </div>
    </div>
  );
}
