"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Pricing() {
  const handleGetStarted = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <section id="pricing" className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Preview for free. Pay only when you download.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="relative rounded-2xl bg-card border border-border overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-foreground text-background text-xs font-semibold px-3 py-1 rounded-bl-lg">
              Most Popular
            </div>

            <div className="p-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">Pay per image</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Perfect for occasional use
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl md:text-5xl font-bold text-foreground">$1</span>
                <span className="text-muted-foreground">/ image</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Free preview before download",
                  "Full HD resolution output",
                  "Transparent PNG format",
                  "No watermarks",
                  "Instant delivery",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleGetStarted}
                className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium h-12 text-base"
              >
                Get Started Free
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                No account required • Secure payment via Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
