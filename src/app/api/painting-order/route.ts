import { NextRequest, NextResponse } from "next/server";
import {
  sendCommissionAdminEmail,
  sendCommissionConfirmationEmail,
  type CommissionPayload,
} from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const REQUIRED = [
  "customerName",
  "email",
  "paintingType",
  "size",
  "surface",
  "style",
  "quantity",
];

function formatCurrencyRange(base: number) {
  return `$${Math.round(base)} – $${Math.round(base * 1.35)}`;
}

function estimateBasePrice(p: Record<string, string>) {
  const baseByType: Record<string, number> = {
    portrait: 180, landscape: 220, interior: 300,
    event: 450,    pet: 160,       custom: 260,
  };
  const sizeFactor: Record<string, number> = {
    small: 1, medium: 1.35, large: 1.8, mural: 3.5,
  };
  const qty = Math.max(Number(p.quantity) || 1, 1);
  return (baseByType[p.paintingType] || 200) * (sizeFactor[p.size] || 1.2) * qty;
}

function estimateTimeline(p: Record<string, string>) {
  if (p.paintingType === "event") return "Depends on event date and setup requirements";
  const map: Record<string, string> = {
    small: "7 – 10 business days",  medium: "10 – 14 business days",
    large: "14 – 21 business days", mural:  "21 – 30 business days",
  };
  return map[p.size] ?? "10 – 18 business days";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    for (const field of REQUIRED) {
      if (!String(payload?.[field] ?? "").trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const base           = estimateBasePrice(payload);
    const estimatedRange = formatCurrencyRange(base);
    const timeline       = estimateTimeline(payload);
    const reference      = `ART-${Date.now().toString().slice(-8)}`;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id ?? null;

    const referenceImageUrls: string[] = Array.isArray(payload.referenceImageUrls)
      ? payload.referenceImageUrls.filter(Boolean)
      : [];

    // Persist to DB so admin can view and assign to artists
    await prisma.commissionRequest.create({
      data: {
        reference,
        customerName: String(payload.customerName ?? "").trim(),
        email,
        phone:         String(payload.phone ?? "").trim() || null,
        paintingType:  String(payload.paintingType ?? "custom"),
        size:          String(payload.size ?? "medium"),
        surface:       String(payload.surface ?? "canvas"),
        style:         String(payload.style ?? "modern"),
        quantity:      String(payload.quantity ?? "1"),
        deadline:      String(payload.deadline ?? "").trim() || null,
        budget:        String(payload.budget ?? "").trim() || null,
        deliveryCity:  String(payload.deliveryCity ?? "").trim() || null,
        notes:         String(payload.notes ?? "").trim() || null,
        referenceImageUrls,
        estimatedRange,
        timeline,
        userId,
      },
    });

    const emailPayload: CommissionPayload = {
      customerName:       String(payload.customerName ?? "").trim(),
      email,
      phone:              String(payload.phone ?? "").trim() || undefined,
      paintingType:       String(payload.paintingType ?? "custom"),
      size:               String(payload.size ?? "medium"),
      surface:            String(payload.surface ?? "canvas"),
      style:              String(payload.style ?? "modern"),
      quantity:           String(payload.quantity ?? "1"),
      deadline:           String(payload.deadline ?? "").trim() || undefined,
      budget:             String(payload.budget ?? "").trim() || undefined,
      deliveryCity:       String(payload.deliveryCity ?? "").trim() || undefined,
      notes:              String(payload.notes ?? "").trim() || undefined,
      referenceImageUrls,
      estimatedRange,
      timeline,
      reference,
    };

    await Promise.allSettled([
      sendCommissionAdminEmail(emailPayload),
      sendCommissionConfirmationEmail(emailPayload),
    ]);

    return NextResponse.json(
      { ok: true, reference, estimatedRange, timeline },
      { status: 201 }
    );
  } catch (error) {
    console.error("[painting-order] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to process your commission request. Please try again." },
      { status: 500 }
    );
  }
}
