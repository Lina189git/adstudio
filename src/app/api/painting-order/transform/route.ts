import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import {
  getPaintingStyleLabel,
  getPaintingTransformations,
  normalizePaintingStylePreset,
} from "@/lib/paintingOrder";
import {
  describePaintingServiceFailure,
  getPaintingServiceUrl,
  getPaintingSourceFetchTimeoutMs,
  getPaintingTransferTimeoutMs,
  isAbortError,
  warmPaintingService,
} from "@/lib/paintingOrderBackend";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getBackendFailureNotice(error: unknown) {
  if (isAbortError(error)) {
    return `The style backend did not respond within ${Math.round(
      getPaintingTransferTimeoutMs() / 1000
    )} seconds. This usually means a cold start or model-loading delay. Wait 20-60 seconds and retry.`;
  }

  return describePaintingServiceFailure(error, getPaintingServiceUrl());
}

function inferFileExtension(contentType: string | null, imageUrl: string) {
  const urlMatch = imageUrl.match(/\.(png|jpg|jpeg|webp|bmp)(?:\?|$)/i)?.[1];
  if (urlMatch) {
    return `.${urlMatch.toLowerCase()}`;
  }

  const mimeMap: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
  };

  return mimeMap[(contentType || "").toLowerCase()] || ".jpg";
}

async function uploadGeneratedImage(
  buffer: Buffer,
  style: string,
  contentType: string | null
) {
  const formatMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };
  const format = formatMap[(contentType || "").toLowerCase()] || "png";

  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "painting-orders/previews",
          resource_type: "image",
          format,
          public_id: `${Date.now()}-${style}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(buffer);
  });
}

async function runRemoteStyleTransfer(input: {
  imageUrl: string;
  style: string;
}) {
  const imageResponse = await fetch(input.imageUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(getPaintingSourceFetchTimeoutMs()),
  });
  if (!imageResponse.ok) {
    throw new Error("Failed to load the uploaded source image.");
  }

  const sourceContentType =
    imageResponse.headers.get("content-type") || "image/jpeg";
  const fileExtension = inferFileExtension(sourceContentType, input.imageUrl);
  const sourceBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const formData = new FormData();
  formData.append("style", input.style);
  formData.append(
    "file",
    new Blob([sourceBuffer], { type: sourceContentType }),
    `painting-source${fileExtension}`
  );

  const response = await fetch(`${getPaintingServiceUrl()}/stylize`, {
    method: "POST",
    body: formData,
    cache: "no-store",
    signal: AbortSignal.timeout(getPaintingTransferTimeoutMs()),
  });

  if (!response.ok) {
    let message = "The style engine did not return a converted image.";
    try {
      const errorPayload = await response.json();
      message =
        errorPayload?.detail?.message ||
        errorPayload?.detail ||
        errorPayload?.error ||
        message;
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }
    throw new Error(message);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type"),
  };
}

const GEMINI_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() || "";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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

async function runGeminiPreview(input: { imageUrl: string; style: string }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const imageResponse = await fetch(input.imageUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(getPaintingSourceFetchTimeoutMs()),
  });
  if (!imageResponse.ok) {
    throw new Error("Failed to load the uploaded source image.");
  }
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
  const base64Data = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");

  const prompt = `Convert this photo into a rich oil painting with painterly brushwork and texture. Preserve the composition, lighting, and detail of the original image. Use the ${getPaintingStyleLabel(input.style)} style.`;

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
    signal: AbortSignal.timeout(getPaintingTransferTimeoutMs()),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const imageData = parseGeminiImageResponse(payload);

  if (!imageData) {
    throw new Error("Gemini did not return a valid image.");
  }

  return {
    buffer: Buffer.from(imageData.data, "base64"),
    contentType: imageData.mimeType,
  };
}

function fallbackCloudinaryPreview(publicId: string, style: ReturnType<typeof normalizePaintingStylePreset>) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: getPaintingTransformations(style),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const publicId = String(body?.publicId || "").trim();
    const imageUrl = String(body?.imageUrl || "").trim();
    const provider = String(body?.provider || "render-cyclegan").trim().toLowerCase();
    const style = normalizePaintingStylePreset(String(body?.stylePreset || "").trim());

    if (!publicId) {
      return NextResponse.json(
        { error: "Source public ID is required." },
        { status: 400 }
      );
    }

    const canUseRemoteService = Boolean(imageUrl);
    const shouldTryRemote =
      provider !== "cloudinary-fallback" && canUseRemoteService;

    if (shouldTryRemote) {
      if (provider === "gemini") {
        try {
          const generated = await runGeminiPreview({
            imageUrl,
            style,
          });
          const uploaded = await uploadGeneratedImage(
            generated.buffer,
            style,
            generated.contentType
          );

          return NextResponse.json({
            transformedUrl: uploaded.secure_url,
            previewPublicId: uploaded.public_id,
            stylePreset: style,
            previewLabel: getPaintingStyleLabel(style),
            providerUsed: "gemini",
            engineUrl: GEMINI_MODEL,
            backendFeedback: {
              serviceUrl: GEMINI_MODEL,
              healthStatus: null,
              healthOk: true,
              notice: "Gemini preview generated successfully.",
            },
          });
        } catch (error: any) {
          const fallbackUrl = fallbackCloudinaryPreview(publicId, style);
          const backendNotice =
            error instanceof Error ? error.message : String(error);

          return NextResponse.json({
            transformedUrl: fallbackUrl,
            previewPublicId: null,
            stylePreset: style,
            previewLabel: getPaintingStyleLabel(style),
            providerUsed: "cloudinary-fallback",
            warning: backendNotice,
            backendFeedback: {
              serviceUrl: GEMINI_MODEL,
              healthStatus: null,
              healthOk: false,
              timeoutMs: getPaintingTransferTimeoutMs(),
              isTimeout: isAbortError(error),
              notice: backendNotice,
            },
          });
        }
      }

      let health:
        | Awaited<ReturnType<typeof warmPaintingService>>
        | null = null;

      try {
        health = await warmPaintingService();

        if (!health.ok) {
          throw new Error(health.notice);
        }

        const generated = await runRemoteStyleTransfer({
          imageUrl,
          style,
        });
        const uploaded = await uploadGeneratedImage(
          generated.buffer,
          style,
          generated.contentType
        );

        return NextResponse.json({
          transformedUrl: uploaded.secure_url,
          previewPublicId: uploaded.public_id,
          stylePreset: style,
          previewLabel: getPaintingStyleLabel(style),
          providerUsed: "render-cyclegan",
          engineUrl: getPaintingServiceUrl(),
          backendFeedback: {
            serviceUrl: health.serviceUrl,
            healthStatus: health.status,
            healthOk: health.ok,
            notice: health.notice,
          },
        });
      } catch (error: any) {
        const fallbackUrl = fallbackCloudinaryPreview(publicId, style);
        const backendNotice = getBackendFailureNotice(error);

        return NextResponse.json({
          transformedUrl: fallbackUrl,
          previewPublicId: null,
          stylePreset: style,
          previewLabel: getPaintingStyleLabel(style),
          providerUsed: "cloudinary-fallback",
          warning: backendNotice,
          backendFeedback: {
            serviceUrl: health?.serviceUrl || getPaintingServiceUrl(),
            healthStatus: health?.status ?? null,
            healthOk: health?.ok ?? false,
            timeoutMs: getPaintingTransferTimeoutMs(),
            isTimeout: isAbortError(error),
            notice: backendNotice,
          },
        });
      }
    }

    const fallbackUrl = fallbackCloudinaryPreview(publicId, style);
    return NextResponse.json({
      transformedUrl: fallbackUrl,
      previewPublicId: null,
      stylePreset: style,
      previewLabel: getPaintingStyleLabel(style),
      providerUsed: "cloudinary-fallback",
      warning: "The source image URL is missing, so the fallback preview was used.",
      backendFeedback: {
        serviceUrl: getPaintingServiceUrl(),
        timeoutMs: getPaintingTransferTimeoutMs(),
        isTimeout: false,
        notice: "The source image URL is missing, so the remote style server was not called.",
      },
    });
  } catch (error) {
    console.error("Painting transform failed:", error);
    return NextResponse.json(
      { error: "Failed to generate the oil-paint preview." },
      { status: 500 }
    );
  }
}
