import { Button } from "@/components/Button";

export function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 lg:py-32">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">Contact Support</h1>
        <p className="mt-4 text-lg text-text-muted">We're here to help you get the most out of CleanVision.</p>
      </div>
      
      <div className="mt-16 grid gap-12 md:grid-cols-2">
        <form className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-8 shadow-raised" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-text-primary">Name</label>
            <input type="text" className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Email</label>
            <input type="email" className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="jane@hospital.org" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Message</label>
            <textarea className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-32 resize-none" placeholder="How can we help?" />
          </div>
          <Button type="button" className="w-full">Send Message</Button>
        </form>

        <div className="flex flex-col justify-center gap-8">
          <div>
            <h3 className="font-bold text-text-primary">Email Support</h3>
            <p className="mt-1 text-sm text-text-muted">support@cleanvision.example.com</p>
          </div>
          <div>
            <h3 className="font-bold text-text-primary">Sales Enquiries</h3>
            <p className="mt-1 text-sm text-text-muted">sales@cleanvision.example.com</p>
          </div>
          <div>
            <h3 className="font-bold text-text-primary">Office Hours</h3>
            <p className="mt-1 text-sm text-text-muted">Monday - Friday<br/>9:00 AM - 5:00 PM (EST)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
