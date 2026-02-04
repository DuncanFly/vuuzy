import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Vuuzy ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vuuzy provides AI-powered background removal services for images. We offer free preview functionality and paid downloads for high-resolution outputs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for ensuring you have the rights to any images you upload. You agree not to upload illegal, offensive, or copyrighted content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Payment Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Payments are processed securely through Stripe. All purchases are final and non-refundable unless the service fails to deliver the promised result.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vuuzy is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes.
              </p>
            </section>

            <p className="text-sm text-muted-foreground pt-8 border-t border-border">
              Last updated: February 2026
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
