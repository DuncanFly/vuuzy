import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
// The user explicitly requested this model for image-to-image preview
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview"

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

    const prompt = replaceBackground
      ? `Act as an expert image editor. Keep the main subject exactly as is, but replace the background with ${replaceBackground}. Match lighting. Output ONLY the resulting PNG.`
      : "Act as an expert image editor. Remove the background. Keep only the main subject with transparency. Output ONLY the modified PNG."

    // URL uses v1beta and the specific model requested by the user
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetchWithRetry(url, {
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
        generationConfig: { 
          // Explicitly include IMAGE modality as requested
          responseModalities: ["TEXT", "IMAGE"] 
        },
      }),
    })

    const result = await response.json()
    
    // Logic to look for inlineData within the parts of the first candidate
    const outputBase64 = result.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data

    if (outputBase64) {
      return NextResponse.json({ imageData: outputBase64 })
    } else {
      // Improved error reporting
      const textOutput = result.candidates?.[0]?.content?.parts?.find(
        (p: { text?: string }) => p.text
      )?.text
      
      console.error("Model returned no image. Response structure:", JSON.stringify(result, null, 2))
      
      return NextResponse.json(
        { 
          ok: false,
          error: "AI failed to return an image.", 
          details: textOutput || "No content returned",
          message: "The model did not return image data. It might be a safety refusal or unsupported request."
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
