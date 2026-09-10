import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

// GET /api/admin/frames
export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const frames = await prisma.frame.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ frames });
  } catch (err) {
    console.error("[admin/frames GET]", err);
    return NextResponse.json({ frames: [], error: "Failed to load frames." }, { status: 500 });
  }
}

// POST /api/admin/frames
export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { name, slug, description, imageUrl, availableSizes, priceCents, isActive, sortOrder } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const existing = await prisma.frame.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A frame with this slug already exists." }, { status: 409 });
  }

  try {
    const frame = await prisma.frame.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description?.trim() ?? null,
        imageUrl: imageUrl ?? null,
        availableSizes: Array.isArray(availableSizes) ? availableSizes : ["8x10", "12x16", "18x24", "24x36"],
        priceCents: Number(priceCents) || 0,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });
    return NextResponse.json(frame, { status: 201 });
  } catch (err) {
    console.error("[admin/frames POST]", err);
    return NextResponse.json({ error: "Failed to create frame." }, { status: 500 });
  }
}
