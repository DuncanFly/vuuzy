"use client"

import React from "react"
import { useState, useCallback, useRef } from "react"
import { Upload, X, Download, Loader2, ImageIcon, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type BgType = "checker" | "white" | "black"

export function ImageUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalBase64, setOriginalBase64] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState("Removing background...")
  const [showComparison, setShowComparison] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bgType, setBgType] = useState<BgType>("checker")
  const [bgDescription, setBgDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processImageWithAI = useCallback(
    async (base64Data: string, replaceBackground?: string) => {
      setIsProcessing(true)
      setError(null)
      setProcessingText(replaceBackground ? "Generating scene..." : "Removing background...")
      setShowComparison(false)

      try {
        const response = await fetch("/api/process-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: base64Data,
            replaceBackground: replaceBackground || null,
          }),
        })

        let result
        try {
          result = await response.json()
        } catch {
          throw new Error(
            response.status === 413
              ? "Image is too large. Please try a smaller file."
              : `Server error (${response.status})`
          )
        }

        if (!response.ok) {
          throw new Error(result.error || "Processing failed")
        }

        if (result.imageData) {
          setProcessedImage(`data:image/png;base64,${result.imageData}`)
          setBgType(replaceBackground ? "white" : "checker")
          setShowComparison(true)
        } else {
          throw new Error("No image data in response")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed")
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file.")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.")
        return
      }

      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.split(",")[1]
        setOriginalImage(dataUrl)
        setOriginalBase64(base64)
        processImageWithAI(base64)
      }
      reader.readAsDataURL(file)
    },
    [processImageWithAI]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleReset = () => {
    setOriginalImage(null)
    setOriginalBase64(null)
    setProcessedImage(null)
    setShowComparison(false)
    setError(null)
    setBgDescription("")
    setBgType("checker")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleReplaceBackground = () => {
    if (originalBase64 && bgDescription.trim()) {
      processImageWithAI(originalBase64, bgDescription.trim())
    }
  }

  const handleDownload = () => {
    const disablePaywall = process.env.NEXT_PUBLIC_DISABLE_PAYWALL === "true"
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK
    if (!disablePaywall && stripeLink && stripeLink !== "https://buy.stripe.com/YOUR_STRIPE_LINK") {
      window.open(stripeLink, "_blank")
    } else {
      if (!processedImage) return
      const link = document.createElement("a")
      link.href = processedImage
      link.download = `vuuzy-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getBgClass = () => {
    if (bgType === "white") return "bg-white"
    if (bgType === "black") return "bg-black"
    return "bg-[repeating-conic-gradient(#1a1a1a_0%_25%,#0d0d0d_0%_50%)] bg-[length:20px_20px]"
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!originalImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? "border-accent bg-accent/10 scale-[1.02]"
              : "border-border hover:border-muted-foreground hover:bg-card/50"
          }`}
        >
          <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card flex items-center justify-center mb-6 border border-border">
              <Upload
                className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${
                  isDragging ? "text-accent" : "text-muted-foreground"
                }`}
              />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
              Drop your image here
            </h3>
            <p className="text-muted-foreground text-sm md:text-base mb-4">or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports PNG, JPG, WEBP up to 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {isProcessing ? processingText : "Background Removed"}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Image Display */}
          {isProcessing ? (
            <div className="aspect-video flex flex-col items-center justify-center bg-background/50">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <p className="text-foreground font-medium">{processingText}</p>
              <p className="text-sm text-muted-foreground">Gemini AI is processing your image</p>
            </div>
          ) : showComparison ? (
            <>
              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Original */}
                <div className="relative">
                  <p className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    Original
                  </p>
                  <div className="aspect-video rounded-xl border border-border overflow-hidden bg-secondary flex items-center justify-center">
                    <img
                      src={originalImage || ""}
                      alt="Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Result */}
                <div className="relative">
                  <p className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/80 px-2 py-1 rounded">
                    Result
                  </p>
                  {/* Background type toggles */}
                  <div className="absolute top-3 right-3 z-10 flex gap-1">
                    <button
                      onClick={() => setBgType("checker")}
                      className={`w-6 h-6 rounded border flex items-center justify-center text-[8px] transition-all ${
                        bgType === "checker"
                          ? "border-accent bg-accent/20"
                          : "border-border bg-card hover:border-muted-foreground"
                      }`}
                      title="Checker background"
                    >
                      {bgType === "checker" && <Check className="w-3 h-3" />}
                      {bgType !== "checker" && ""}
                    </button>
                    <button
                      onClick={() => setBgType("white")}
                      className={`w-6 h-6 rounded border bg-white transition-all ${
                        bgType === "white" ? "border-accent" : "border-border hover:border-muted-foreground"
                      }`}
                      title="White background"
                    />
                    <button
                      onClick={() => setBgType("black")}
                      className={`w-6 h-6 rounded border bg-black transition-all ${
                        bgType === "black" ? "border-accent" : "border-border hover:border-muted-foreground"
                      }`}
                      title="Black background"
                    />
                  </div>
                  <div
                    className={`aspect-video rounded-xl border border-border overflow-hidden flex items-center justify-center transition-all ${getBgClass()}`}
                  >
                    <img
                      src={processedImage || ""}
                      alt="Processed"
                      className="max-h-full max-w-full object-contain drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Replace Background */}
              <div className="px-4 pb-4">
                <div className="bg-secondary/50 p-4 rounded-xl border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Replace Background
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={bgDescription}
                      onChange={(e) => setBgDescription(e.target.value)}
                      placeholder="Describe a new scene (e.g., sunset beach, office, etc.)"
                      className="flex-grow bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && bgDescription.trim()) {
                          handleReplaceBackground()
                        }
                      }}
                    />
                    <Button
                      onClick={handleReplaceBackground}
                      disabled={!bgDescription.trim()}
                      variant="secondary"
                      className="font-medium px-6"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="aspect-video bg-secondary flex items-center justify-center">
              <img
                src={originalImage || ""}
                alt="Original"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-4 mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          {showComparison && (
            <div className="p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleDownload}
                  className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 font-medium px-6 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download HD PNG
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full sm:w-auto font-medium px-6 gap-2 bg-transparent"
                >
                  <Upload className="w-4 h-4" />
                  Upload Another
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Free preview available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
