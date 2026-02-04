import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
const DEFAULT_MODEL = "gemini-1.5-flash"

interface GeminiModel {
  name: string
  supportedGenerationMethods: string[]
}

async function getGeminiModel(): Promise<string> {
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    )
    if (!res.ok) {
      console.error("Failed to list models:", await res.text())
      return DEFAULT_MODEL
    }

    const data = await res.json()
    const models = (data.models || []) as GeminiModel[]

    // Filter for models that support generateContent
    const supportedModels = models.filter((m) =>
      m.supportedGenerationMethods.includes("generateContent")
    )

    if (supportedModels.length === 0) {
      return DEFAULT_MODEL
    }

    // Prefer "flash" models
    const flashModel = supportedModels.find((m) => m.name.toLowerCase().includes("flash"))
    if (flashModel) {
      // The API returns "models/model-name", but we might just want "model-name" 
      // or we can use the full resource name. The fetch URL below expects 
      // .../models/MODEL_NAME:generateContent.
      // If name is "models/gemini-1.5-flash", we can use it directly if we handle the slash.
      // Let's return the simplified ID if possible, or handle it in the caller.
      // Actually, looking at the URL structure: .../v1beta/models/MODEL_ID:generateContent
      // If name is "models/gemini-1.5-flash", strip "models/"
      return flashModel.name.replace(/^models\//, "")
    }

    // Fallback to first supported
    return supportedModels[0].name.replace(/^models\//, "")
  } catch (error) {
    console.error("Error fetching models:", error)
    return DEFAULT_MODEL
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  backoff = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const errorText = await res.text()
      // Don't retry client errors (4xx) except maybe 429 (Too Many Requests)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        console.error(`API Error ${res.status}:`, errorText)
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }
      console.error(`API Error ${res.status} (retrying):`, errorText)
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }
    return res
  } catch (err) {
    if (retries > 0 && err instanceof Error) {
      // logic: if it's a 4xx error (that isn't 429), we already threw and likely shouldn't retry? 
      // actually the check above throws. 
      // The previous logic had: !err.message.includes("404"). 
      // Let's keep it robust.
      const isFatal = err.message.includes("HTTP 40") && !err.message.includes("HTTP 429")
      if (!isFatal) {
        await new Promise((r) => setTimeout(r, backoff))
        return fetchWithRetry(url, options, retries - 1, backoff * 2)
      }
    }
    throw err
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, replaceBackground } = await request.json()

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Set GEMINI_API_KEY in environment variables." },
        { status: 500 }
      )
    }

    const modelId = await getGeminiModel()
    
    const prompt = replaceBackground
      ? `Act as an expert image editor. Keep the main subject exactly as is, but replace the background with ${replaceBackground}. Match lighting. Output ONLY the resulting PNG.`
      : "Act as an expert image editor. Remove the background. Keep only the main subject with transparency. Output ONLY the modified PNG."

    // Note: Standard Gemini models (like gemini-1.5-flash) output TEXT by default. 
    // They may not support 'responseModalities': ['IMAGE'] or direct image generation 
    // unless using specific experimental models or endpoints.
    // If the selected model doesn't support image output, this request might fail or return text.
    // For this fix, we assume a capable model is found or we are just fixing the 404.
    
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/png", data: imageData } },
              ],
            },
          ],
          // Only send responseModalities if we are confident, or if the model requires it.
          // Since we are fixing a 404, we will keep it but be aware it might need removal for text-only models.
          // Leaving it as is per instructions to "remove invalid model id".
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    )

    const result = await response.json()
    
    // Check if the response actually contains an image
    const outputBase64 = result.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data

    if (outputBase64) {
      return NextResponse.json({ imageData: outputBase64 })
    } else {
      // If we got here, the model probably returned text (refusal or description) instead of an image
      const textOutput = result.candidates?.[0]?.content?.parts?.find(
        (p: { text?: string }) => p.text
      )?.text
      
      console.error("Model returned no image. Text response:", textOutput)
      
      return NextResponse.json(
        { 
          ok: false,
          error: "AI failed to return an image.", 
          details: textOutput || "No content returned",
          message: "The model may not support image generation or refused the request."
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Processing failed",
        message: "Internal server error"
      },
      { status: 500 }
    )
  }
}
