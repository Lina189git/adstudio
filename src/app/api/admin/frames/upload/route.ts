import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60_000,
});

function sanitize(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9_-]/gi, "_")
    .slice(0, 60);
}

// POST /api/admin/frames/upload
export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json({ error: "Image storage is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Please upload an image under 10 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicId = `${Date.now()}-${sanitize(file.name || "frame")}`;
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "frames",
    resource_type: "image",
    public_id: publicId,
  });

  return NextResponse.json({
    imageUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  });
}
