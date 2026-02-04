import { NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image"

function stripDataUrlPrefix(base64: string) {
  return base64.replace(/^data:image\/\w+;base64,/, "")
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
      return NextResponse.json({error:"No image data provided"},{status:400})
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {error:"API key not configured. Set GEMINI_API_KEY in environment variables."},
        {status:500}
      )
    }

    const rawBase64 = stripDataUrlPrefix(imageData)

    const prompt = replaceBackground
      ? `Act as an expert image editor. Keep the main subject exactly as is, but replace the background with ${replaceBackground}. Match lighting. Output ONLY the resulting PNG.`
      : "Act as an expert image editor. Remove the background completely. Keep only the main subject with transparent background. Output ONLY the resulting PNG."

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetchWithRetry(url,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: rawBase64,
                },
              },
            ],
          },
        ],
        generation_config: {
          candidate_count: 1,
          temperature: 0.2,
        },
      }),
    })

    const result = await response.json()

    const parts = result.candidates?.[0]?.content?.parts ?? []

    const outputBase64 =
      parts.find((p: any) => p.inlineData?.data)?.inlineData?.data ??
      parts.find((p: any) => p.inline_data?.data)?.inline_data?.data

    if (outputBase64) {
      return NextResponse.json({imageData:outputBase64})
    }

    const textOutput =
      parts.find((p: any) => p.text)?.text ??
      result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text

    console.error("Model returned no image. Response structure:", JSON.stringify(result, null, 2))

    return NextResponse.json(
      {
        ok:false,
        error:"AI failed to return an image.",
        details:textOutput || "No content returned",
        message:"The model did not return image data. It might be a safety refusal or unsupported request.",
      },
      {status:500}
    )
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json(
      {
        ok:false,
        error:error instanceof Error ? error.message : "Processing failed",
        message:"Internal server error",
      },
      {status:500}
    )
  }
}