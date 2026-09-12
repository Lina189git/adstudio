import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireArtistApiSession, unauthorizedArtistResponse } from "@/lib/artist";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 100;

async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  type: "image" | "video"
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder:        `artist-updates/${type}s`,
          resource_type: type,
          public_id:     `${Date.now()}-${fileName.replace(/\.[^.]+$/, "")}`,
          ...(type === "video"
            ? { transformation: [{ quality: "auto:good" }] }
            : {}),
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(buffer);
  });
}

export async function POST(request: NextRequest) {
  const session = await requireArtistApiSession();
  if (!session) return unauthorizedArtistResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only image or video files are supported." },
        { status: 400 }
      );
    }

    const maxBytes = (isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB}MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = await uploadToCloudinary(
      buffer,
      file.name || "upload",
      isVideo ? "video" : "image"
    );

    return NextResponse.json({ url, publicId, type: isVideo ? "video" : "image" });
  } catch (err) {
    console.error("[artist/upload] failed:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
