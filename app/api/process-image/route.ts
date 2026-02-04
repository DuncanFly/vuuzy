import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

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
      console.error(`API Error ${res.status}:`, errorText)
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }
    return res
  } catch (err) {
    if (retries > 0 && err instanceof Error && !err.message.includes("404")) {
      await new Promise((r) => setTimeout(r, backoff))
      return fetchWithRetry(url, options, retries - 1, backoff * 2)
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

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-0520:generateContent?key=${GEMINI_API_KEY}`,
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
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    )

    const result = await response.json()
    const outputBase64 = result.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data

    if (outputBase64) {
      return NextResponse.json({ imageData: outputBase64 })
    } else {
      return NextResponse.json(
        { error: "AI failed to return an image. It might be a safety refusal." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    )
  }
}
