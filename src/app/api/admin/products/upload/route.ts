import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import {
  requireAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/admin";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60_000, // 60 s — prevents premature 499s on slow connections
});

function sanitizePublicId(name: string) {
  return name
    .replace(/\.[^.]+$/, "")        // strip extension
    .replace(/[^a-z0-9_-]/gi, "_")  // safe chars only
    .slice(0, 60);
}

/** Upload a buffer to Cloudinary using a base64 data URI (single HTTP request — no stream). */
async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  fileName: string
) {
  const publicId = `${Date.now()}-${sanitizePublicId(fileName)}`;
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  return cloudinary.uploader.upload(dataUri, {
    folder: "products/catalog",
    resource_type: "image",
    public_id: publicId,
  });
}

/** Retry helper — up to `attempts` tries with exponential back-off. */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 800
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isTimeout =
        err instanceof Error &&
        (err.message.includes("Timeout") ||
          err.message.includes("ENOTFOUND") ||
          err.message.includes("ECONNRESET") ||
          (err as { http_code?: number }).http_code === 499);

      // Only retry on transient network errors
      if (!isTimeout) throw err;

      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApiSession();
    if (!session) return unauthorizedAdminResponse();

    // Validate Cloudinary config upfront for a clearer error message
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary env vars are not configured.");
      return NextResponse.json(
        { error: "Image storage is not configured. Check Cloudinary environment variables." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Please upload an image under 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || "catalog-image";

    const result = await withRetry(
      () => uploadToCloudinary(buffer, file.type, fileName),
      3,   // up to 3 attempts
      800  // 800 ms → 1 600 ms between retries
    );

    return NextResponse.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error("Admin product upload failed:", error);

    const isTimeout =
      error instanceof Error &&
      (error.message.includes("Timeout") ||
        (error as { http_code?: number }).http_code === 499);

    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("ENOTFOUND") || error.message.includes("ECONNRESET"));

    if (isNetworkError) {
      return NextResponse.json(
        { error: "Cannot reach the image storage service. Check your network connection." },
        { status: 503 }
      );
    }

    if (isTimeout) {
      return NextResponse.json(
        { error: "Upload timed out after 3 attempts. The file may be too large or the connection too slow." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
