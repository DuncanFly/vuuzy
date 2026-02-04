"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Mail, Send, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get in touch</h1>
            <p className="text-muted-foreground">
              Have a question or feedback? We'd love to hear from you.
            </p>
          </div>
          
          {submitted ? (
            <div className="text-center py-12 px-6 rounded-2xl bg-card border border-border">
              <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Message sent!</h2>
              <p className="text-muted-foreground">
                We'll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                  placeholder="Tell us more..."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium h-12 gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Or email us directly at{" "}
            <a href="mailto:hello@vuuzy.com" className="text-foreground hover:underline">
              hello@vuuzy.com
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
