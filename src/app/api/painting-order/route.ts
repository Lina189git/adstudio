import { NextRequest, NextResponse } from "next/server";

const requiredFields = [
  "customerName",
  "email",
  "paintingType",
  "size",
  "surface",
  "style",
  "quantity",
];

function formatCurrencyRange(base: number) {
  const low = Math.round(base);
  const high = Math.round(base * 1.35);
  return `$${low} - $${high}`;
}

function estimateBasePrice(payload: Record<string, string>) {
  const baseByType: Record<string, number> = {
    portrait: 180,
    landscape: 220,
    interior: 300,
    event: 450,
    pet: 160,
    custom: 260,
  };

  const sizeFactor: Record<string, number> = {
    small: 1,
    medium: 1.35,
    large: 1.8,
    mural: 3.5,
  };

  const quantity = Math.max(Number(payload.quantity) || 1, 1);

  return (
    (baseByType[payload.paintingType] || 200) *
    (sizeFactor[payload.size] || 1.2) *
    quantity
  );
}

function estimateTimeline(payload: Record<string, string>) {
  const sizeTimeline: Record<string, string> = {
    small: "7 to 10 days",
    medium: "10 to 14 days",
    large: "14 to 21 days",
    mural: "21 to 30 days",
  };

  if (payload.paintingType === "event") {
    return "Depends on event date and setup requirements";
  }

  return sizeTimeline[payload.size] || "10 to 18 days";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    for (const field of requiredFields) {
      if (!String(payload?.[field] || "").trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const email = String(payload.email || "").trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const base = estimateBasePrice(payload);
    const estimatedRange = formatCurrencyRange(base);
    const timeline = estimateTimeline(payload);
    const reference = `ART-${Date.now().toString().slice(-8)}`;

    return NextResponse.json(
      {
        ok: true,
        reference,
        estimatedRange,
        timeline,
        message:
          "Painting order request received. Persisted order tracking is the next backend step if needed.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to process painting order:", error);
    return NextResponse.json(
      { error: "Failed to process painting order." },
      { status: 500 }
    );
  }
}
