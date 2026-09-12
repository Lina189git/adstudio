import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60_000,
});

// POST /api/influencer/upload â€” upload thumbnail or video file
export async function POST(request: NextRequest) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Image storage is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File is required." }, { status: 400 });

  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) return NextResponse.json({ error: "Only image or video files are accepted." }, { status: 400 });
  if (file.size > 100 * 1024 * 1024) return NextResponse.json({ error: "File must be under 100 MB." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedName = (file.name || "upload").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]/gi, "_").slice(0, 60);
  const publicId = `${Date.now()}-${sanitizedName}`;
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: isVideo ? "influencer-videos" : "influencer-thumbnails",
    resource_type: isVideo ? "video" : "image",
    public_id: publicId,
  });

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
}
