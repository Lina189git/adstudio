import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/admin";
import { isAllowedRemoteImageUrl } from "@/lib/safeImage";

export const dynamic = "force-dynamic";

function getFileExtension(contentType: string | null, fallbackUrl: string) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";

  try {
    const pathname = new URL(fallbackUrl).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1] || "jpg";
  } catch {
    return "jpg";
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const asset = searchParams.get("asset");

    if (!orderId || (asset !== "source" && asset !== "preview")) {
      return NextResponse.json(
        { error: "orderId and a valid asset type are required." },
        { status: 400 }
      );
    }

    const order = await prisma.paintingOrder.findUnique({
      where: { id: orderId },
      select: {
        reference: true,
        sourceImageUrl: true,
        previewUrl: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const assetUrl = asset === "source" ? order.sourceImageUrl : order.previewUrl;

    if (!isAllowedRemoteImageUrl(assetUrl)) {
      return NextResponse.json(
        { error: "The requested image is missing or not downloadable." },
        { status: 400 }
      );
    }

    const upstream = await fetch(assetUrl as string);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image from upstream source (${upstream.status}).` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type");
    const extension = getFileExtension(contentType, assetUrl as string);
    const fileName = `${order.reference}-${asset}.${extension}`;
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Admin order asset download failed:", error);
    return NextResponse.json(
      { error: "Failed to download order asset." },
      { status: 500 }
    );
  }
}
