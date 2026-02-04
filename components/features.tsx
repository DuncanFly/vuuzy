import { Zap, Shield, Sparkles, Clock } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "AI removes backgrounds in under 5 seconds. No waiting, no hassle.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your images are never stored. Processed securely and deleted instantly.",
  },
  {
    icon: Sparkles,
    title: "Pixel Perfect",
    description: "Advanced AI preserves fine details like hair, fur, and transparent objects.",
  },
  {
    icon: Clock,
    title: "Free Preview",
    description: "See your result before paying. Only pay when you're 100% satisfied.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Why choose Vuuzy?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Professional background removal powered by state-of-the-art AI technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-muted-foreground transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
