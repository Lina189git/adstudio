import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

// GET /api/admin/frames/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const frame = await prisma.frame.findUnique({ where: { id: params.id } });
  if (!frame) return NextResponse.json({ error: "Frame not found." }, { status: 404 });

  return NextResponse.json(frame);
}

// PUT /api/admin/frames/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { name, slug, description, imageUrl, availableSizes, priceCents, isActive, sortOrder } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
  }

  const existing = await prisma.frame.findUnique({ where: { slug } });
  if (existing && existing.id !== params.id) {
    return NextResponse.json({ error: "Another frame with this slug already exists." }, { status: 409 });
  }

  const frame = await prisma.frame.update({
    where: { id: params.id },
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

  return NextResponse.json(frame);
}

// DELETE /api/admin/frames/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  await prisma.frame.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
