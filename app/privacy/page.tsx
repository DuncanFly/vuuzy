import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect minimal information necessary to provide our service. Images you upload are processed immediately and deleted from our servers after processing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Images are used solely for processing and are not stored, shared, or used for training AI models. Payment information is handled securely by Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                Uploaded images are automatically deleted within 1 hour of processing. We do not retain copies of your images or processed results.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use Stripe for payment processing. Their privacy policy governs how they handle your payment information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies only to ensure the proper functioning of our service. We do not use tracking or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For privacy-related questions, please contact us at privacy@vuuzy.com.
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
