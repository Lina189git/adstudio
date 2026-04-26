import { NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || "";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function parseGeminiImageResponse(payload: any): { data: string; mimeType: string } | null {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (part?.inlineData?.data && part?.inlineData?.mimeType) {
        return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return errorResponse("Missing Gemini API key in server environment.");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const prompt = String(
    formData.get("prompt") ||
      "Convert this photo into a realistic oil painting with warm lighting, rich brush strokes, and gallery-quality detail."
  ).trim();

  if (!file || !(file instanceof File)) {
    return errorResponse("A source image file is required.", 400);
  }

  const mimeType = (file as File).type || "image/jpeg";
  const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64");

  const requestUrl = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail =
      payload?.error?.message || payload?.error || "Gemini image generation failed.";
    return errorResponse(detail, response.status);
  }

  const imageData = parseGeminiImageResponse(payload);
  if (!imageData) {
    return errorResponse("Gemini did not return a valid image.");
  }

  const imageDataUrl = `data:${imageData.mimeType};base64,${imageData.data}`;

  return NextResponse.json({ imageDataUrl, model: GEMINI_MODEL });
}
