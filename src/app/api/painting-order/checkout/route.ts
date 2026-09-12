import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {

export const dynamic = "force-dynamic";
  CANVAS_SIZE_OPTIONS,
  CanvasSize,
  FRAME_STYLE_OPTIONS,
  FrameStyle,
  PAINTING_STYLE_OPTIONS,
  PaintingProductMode,
  estimatePaintingPrice,
} from "@/lib/paintingOrder";

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions) as { user?: { id?: string } } | null;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-06-20",
    });

    const body = await request.json();
    const mode = String(body?.mode || "").trim() as PaintingProductMode;
    const sourcePublicId = String(body?.sourcePublicId || "").trim();
    const sourceImageUrl = String(body?.sourceImageUrl || "").trim();
    const stylePreset = String(body?.stylePreset || "").trim();
    const previewUrl = String(body?.transformedUrl || "").trim();
    const customerName = String(body?.customerName || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const canvasSize = String(body?.canvasSize || "").trim();
    const frameStyle = String(body?.frameStyle || "").trim();
    const quantity = Math.max(Number(body?.quantity) || 1, 1);
    const notes = String(body?.notes || "").trim();
    const shareToGallery = Boolean(body?.shareToGallery);
    const galleryTitle = String(body?.galleryTitle || "").trim();
    const galleryDisplayName = String(body?.galleryDisplayName || "").trim();

    if (!["download", "print"].includes(mode)) {
      return NextResponse.json({ error: "Invalid order mode." }, { status: 400 });
    }

    if (!sourcePublicId || !stylePreset || !previewUrl) {
      return NextResponse.json(
        { error: "Upload and style preview are required before checkout." },
        { status: 400 }
      );
    }

    if (!customerName || !email) {
      return NextResponse.json(
        { error: "Customer name and email are required." },
        { status: 400 }
      );
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (!PAINTING_STYLE_OPTIONS.some((item) => item.value === stylePreset)) {
      return NextResponse.json({ error: "Invalid style preset." }, { status: 400 });
    }

    if (mode === "print") {
      const validSize = CANVAS_SIZE_OPTIONS.some((item) => item.value === canvasSize);
      const validFrame = FRAME_STYLE_OPTIONS.some((item) => item.value === frameStyle);
      if (!validSize || !validFrame) {
        return NextResponse.json(
          { error: "Canvas size and frame style are required for print orders." },
          { status: 400 }
        );
      }
    }

    const pricing = estimatePaintingPrice({
      mode,
      canvasSize: canvasSize as CanvasSize,
      frameStyle: frameStyle as FrameStyle,
      quantity,
    });

    const reference = `ART-${Date.now().toString().slice(-8)}-${Math.floor(
      Math.random() * 900 + 100
    )}`;

    const order = await prisma.paintingOrder.create({
      data: {
        reference,
        customerName,
        email,
        userId: authSession?.user?.id || null,
        sourceImageUrl: sourceImageUrl || null,
        sourcePublicId,
        previewUrl,
        stylePreset,
        mode: mode.toUpperCase() as "DOWNLOAD" | "PRINT",
        canvasSize: mode === "print" ? canvasSize : null,
        frameStyle: mode === "print" ? frameStyle : null,
        quantity,
        amountCents: pricing.unitAmount * quantity,
        currency: "usd",
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        shareToGallery,
        galleryTitle: shareToGallery ? galleryTitle || null : null,
        galleryDisplayName: shareToGallery
          ? galleryDisplayName || customerName || null
          : null,
        timelineEstimate:
          mode === "print" ? "Production review pending payment" : "Immediate after payment",
        notes: notes || null,
      },
      select: { id: true, reference: true },
    });

    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      success_url: `${origin}/painting-order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/painting-order/upload`,
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            product_data: {
              name: pricing.label,
              description:
                mode === "print"
                  ? `Styled oil-paint canvas print in ${canvasSize} with ${frameStyle}`
                  : "High-resolution stylized oil-paint digital download",
            },
            unit_amount: pricing.unitAmount,
          },
        },
      ],
      metadata: {
        paintingOrderId: order.id,
        reference: order.reference,
        mode,
        customerName,
        email,
        sourcePublicId,
        stylePreset,
        previewUrl,
        canvasSize: canvasSize || "",
        frameStyle: frameStyle || "",
        quantity: String(quantity),
        shareToGallery: String(shareToGallery),
        galleryTitle,
        galleryDisplayName,
      },
    });

    await prisma.paintingOrder.update({
      where: { id: order.id },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, orderId: order.id, reference });
  } catch (error) {
    console.error("Painting order checkout failed:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe checkout session." },
      { status: 500 }
    );
  }
}
