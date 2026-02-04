export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload",
      description: "Drag and drop your image or click to browse. We support all common formats.",
    },
    {
      number: "02",
      title: "Process",
      description: "Our AI instantly analyzes and removes the background in seconds.",
    },
    {
      number: "03",
      title: "Download",
      description: "Preview for free, then download your high-resolution result.",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Remove backgrounds in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center md:text-left">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
              )}
              
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border mb-6">
                <span className="text-xl font-bold text-foreground">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
