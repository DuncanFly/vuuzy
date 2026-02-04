import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// The specific model required for image-to-image preview tasks
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-image-preview";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  backoff = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorText = await res.text();
      // Only retry on server errors or rate limits
      if (res.status >= 500 || res.status === 429) {
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      // Fatal client error (400, 401, 403, 404)
      return res; 
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageData, replaceBackground } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Please set GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    // Ensure the base64 data is clean (strip data:image/png;base64, if present)
    const cleanBase64 = imageData.includes(",") ? imageData.split(",")[1] : imageData;

    const prompt = replaceBackground
      ? `Act as an expert image editor. Keep the main subject exactly as is, but replace the background with ${replaceBackground}. Match the lighting and shadows. Output ONLY the resulting PNG.`
      : "Act as an expert image editor. Remove the background from this image. Keep only the main subject with a fully transparent background. Output ONLY the modified PNG image.";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: cleanBase64 } },
            ],
          },
        ],
        generationConfig: { 
          // MANDATORY: Tells the model to allow binary image output
          responseModalities: ["TEXT", "IMAGE"] 
        },
      }),
    });

    const result = await response.json();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: response.status });
    }

    // Locate the part containing the actual image data
    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );
    const outputBase64 = imagePart?.inlineData?.data;

    if (outputBase64) {
      return NextResponse.json({ imageData: outputBase64 });
    } else {
      // Handle cases where the model returns a text refusal (e.g., Safety Block)
      const textOutput = result.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.text
      )?.text;
      
      return NextResponse.json(
        { 
          error: "AI failed to return an image.", 
          details: textOutput || "No content returned",
          finishReason: result.candidates?.[0]?.finishReason
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}