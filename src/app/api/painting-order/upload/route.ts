import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBuffer(buffer: Buffer, fileName: string) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "painting-orders/source",
        resource_type: "image",
        public_id: `${Date.now()}-${fileName.replace(/\.[^.]+$/, "")}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Please upload an image under 10MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const upload = await uploadBuffer(buffer, file.name || "painting-source");

    return NextResponse.json({
      imageUrl: upload.secure_url,
      publicId: upload.public_id,
      width: upload.width,
      height: upload.height,
      format: upload.format,
    });
  } catch (error) {
    console.error("Painting order upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }
}
